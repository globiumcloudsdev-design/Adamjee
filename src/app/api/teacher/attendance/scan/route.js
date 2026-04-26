import { NextResponse } from 'next/server';
import { withAuth } from '@/backend/middleware/auth';
import Attendance from '@/backend/models/Attendance';
import { User } from '@/backend/models/postgres';
import FeeVoucher from '@/backend/models/FeeVoucher';
import Timetable from '@/backend/models/Timetable';
import { Class } from '@/backend/models/postgres';

// POST - Teacher scans QR code for student attendance
async function scanAttendance(request, authenticatedUser, userDoc) {
  try {
    if (authenticatedUser.role !== 'teacher') {
      return NextResponse.json(
        { success: false, message: 'Access denied. Teachers only.' },
        { status: 403 }
      );
    }

    if (!authenticatedUser.branchId) {
      return NextResponse.json(
        { success: false, message: 'No branch assigned' },
        { status: 400 }
      );
    }

    
    const body = await request.json();
    const { qr, date, subjectId, attendanceType } = body;

    console.log('📋 Scan Request:', { qr: typeof qr === 'object' ? JSON.stringify(qr).substring(0, 100) : qr, date, attendanceType });

    if (!qr) {
      console.log('❌ No QR data provided');
      return NextResponse.json(
        { success: false, message: 'QR data is required' },
        { status: 400 }
      );
    }

    // Parse QR data - could be JSON or plain text (registration number)
    let qrData;
    try {
      qrData = typeof qr === 'string' ? JSON.parse(qr) : qr;
    } catch (e) {
      // If not JSON, treat as registration number
      qrData = { registrationNumber: qr };
    }

    console.log('🔍 Parsed QR Data:', qrData);

    // Find student by registration number or ID
    const student = await User.findOne({
      $or: [
        { 'studentProfile.registrationNumber': qrData.registrationNumber },
        { _id: qrData.id || qrData.studentId }
      ],
      role: 'student',
      branchId: authenticatedUser.branchId,
    });

    if (!student) {
      console.log('❌ Student not found with:', { 
        registrationNumber: qrData.registrationNumber, 
        id: qrData.id || qrData.studentId,
        branchId: authenticatedUser.branchId 
      });
      return NextResponse.json(
        { success: false, message: `Student not found in your branch. Reg: ${qrData.registrationNumber || 'N/A'}` },
        { status: 404 }
      );
    }

    console.log('✅ Student found:', student.fullName, student.studentProfile?.registrationNumber);

    const classId = student.studentProfile?.classId;
    const section = student.studentProfile?.section;

    // Skip section check if section is "N/A" or empty/null
    const hasValidSection = section && section !== "N/A" && section.trim() !== "";

    if (!classId) {
      console.log('❌ Student has no class assigned');
      return NextResponse.json(
        { success: false, message: 'Student has no class assigned' },
        { status: 400 }
      );
    }

    // Verify teacher teaches this class - Multiple checks:
    
    // 1. First try WITHOUT section filter (teacher might teach this class but section differs)
    let teacherTimetable = null;
    try {
      const timetableQueryNoSection = {
        branchId: authenticatedUser.branchId,
        classId: classId,
        'periods.teacherId': userDoc._id,
        status: 'active'
      };
      teacherTimetable = await Timetable.findOne(timetableQueryNoSection);
    } catch (e) {
      console.log('Timetable query error:', e.message);
    }
    
    // 2. If not found with no section filter, try WITH section filter
    if (!teacherTimetable && hasValidSection) {
      try {
        const timetableQueryWithSection = {
          branchId: authenticatedUser.branchId,
          classId: classId,
          section: section,
          'periods.teacherId': userDoc._id,
          status: 'active'
        };
        teacherTimetable = await Timetable.findOne(timetableQueryWithSection);
      } catch (e) {
        console.log('Timetable query error:', e.message);
      }
    }
    
    // 3. Check if teacher is class teacher for this class
    let classDoc = null;
    try {
      classDoc = await Class.findOne({
        _id: classId,
        classTeacherId: userDoc._id
      });
    } catch (e) {
      console.log('Class lookup error:', e.message);
    }

    if (!teacherTimetable && !classDoc) {
      console.log('❌ Teacher not assigned to this class/section:', { classId, section, teacherId: userDoc._id });
      return NextResponse.json(
        { success: false, message: `You are not assigned to teach this student's class${hasValidSection ? `/section ${section}` : ''}` },
        { status: 403 }
      );
    }

    console.log('✅ Teacher verified for class (via timetable or classTeacher)');

    const attendanceDate = date ? new Date(date) : new Date();
    const startOfDay = new Date(attendanceDate.getFullYear(), attendanceDate.getMonth(), attendanceDate.getDate());

    // Determine attendance type and subject
    const type = attendanceType || (subjectId ? 'subject' : 'daily');
    
    // Find or create attendance record
    // Note: section is NOT stored in Attendance model - it's on the student profile
    const query = {
      branchId: authenticatedUser.branchId,
      classId: classId,
      date: startOfDay,
      attendanceType: type,
      ...(subjectId && { subjectId }),
    };

    let attendance = await Attendance.findOne(query);

    if (!attendance) {
      // Create new attendance record with all required fields from Attendance model
      attendance = new Attendance({
        branchId: authenticatedUser.branchId,
        classId: classId,
        date: startOfDay,
        attendanceType: type,
        ...(subjectId && { subjectId }),
        markedBy: userDoc._id, // Use userDoc._id for markedBy
        records: [],
      });
    }

    // Check if student already marked
    const existingRecordIndex = attendance.records.findIndex(
      r => r.studentId.toString() === student._id.toString()
    );

    const currentTime = new Date().toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });

    if (existingRecordIndex >= 0) {
      // Update existing record - only fields that exist in schema
      attendance.records[existingRecordIndex].status = 'present';
      attendance.records[existingRecordIndex].checkInTime = currentTime;
      attendance.records[existingRecordIndex].remarks = 'Marked via QR scan';
    } else {
      // Add new record - matching Attendance model schema
      attendance.records.push({
        studentId: student._id,
        status: 'present',
        checkInTime: currentTime,
        remarks: 'Marked via QR scan',
      });
    }

    await attendance.save();

    console.log('✅ Attendance saved successfully for:', student.fullName);

    // Get fee payment status for current month
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth() + 1;
    const currentYear = currentDate.getFullYear();
    
    const feeVoucher = await FeeVoucher.findOne({
      studentId: student._id,
      month: currentMonth,
      year: currentYear,
      status: { $in: ['paid', 'partial'] }
    }).lean();
    
    const hasPaidFees = !!feeVoucher;
    const feeStatus = feeVoucher ? feeVoucher.status : 'unpaid';
    
    // Populate full student details
    const studentDetails = {
      _id: student._id,
      fullName: student.fullName,
      firstName: student.firstName,
      lastName: student.lastName,
      email: student.email,
      phone: student.phone,
      registrationNumber: student.studentProfile?.registrationNumber,
      rollNumber: student.studentProfile?.rollNumber,
      section: student.studentProfile?.section,
      profilePhoto: student.profilePhoto,
      hasPaidFees,
      feeStatus
    };

    return NextResponse.json({ 
      success: true, 
      message: 'Attendance recorded successfully', 
      data: { 
        attendance, 
        student: studentDetails,
        alreadyMarked: existingRecordIndex >= 0
      } 
    });
  } catch (error) {
    console.error('Teacher scan attendance error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to record attendance' },
      { status: 500 }
    );
  }
}

export const POST = withAuth(scanAttendance);
