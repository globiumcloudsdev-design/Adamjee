import { NextResponse } from 'next/server';
import { withAuth, requireRole } from '@/backend/middleware/auth';
// import Attendance from '@/backend/models/postgres';
import { User } from '@/backend/models/postgres';

// GET /api/super-admin/students/[id]/attendance - Get student's attendance history
export const GET = withAuth(async (request, user, userDoc, { params }) => {
  try {
        
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 50;
    const skip = (page - 1) * limit;
    
    // Verify student exists
    const student = await User.findOne({ _id: id, role: 'student' }).lean();
    if (!student) {
      return NextResponse.json(
        { success: false, message: 'Student not found' },
        { status: 404 }
      );
    }
    
    // Get all attendance records where this student appears
    const [attendanceRecords, total] = await Promise.all([
      Attendance.find({ 'records.studentId': id })
        .populate('classId', 'name code')
        .populate('subjectId', 'name code')
        .populate('branchId', 'name')
        .populate('eventId', 'title')
        .populate('markedBy', 'fullName email')
        .sort({ date: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Attendance.countDocuments({ 'records.studentId': id })
    ]);
    
    // Extract only this student's record from each attendance
    const studentAttendance = attendanceRecords.map(attendance => {
      const studentRecord = attendance.records.find(
        r => r.studentId.toString() === id
      );
      
      return {
        _id: attendance._id,
        date: attendance.date,
        classId: attendance.classId,
        subjectId: attendance.subjectId,
        branchId: attendance.branchId,
        eventId: attendance.eventId,
        attendanceType: attendance.attendanceType,
        markedBy: attendance.markedBy,
        status: studentRecord?.status || 'absent',
        checkInTime: studentRecord?.checkInTime,
        remarks: studentRecord?.remarks,
        createdAt: attendance.createdAt
      };
    });
    
    // Calculate statistics
    const stats = {
      total: studentAttendance.length,
      present: studentAttendance.filter(a => a.status === 'present').length,
      absent: studentAttendance.filter(a => a.status === 'absent').length,
      late: studentAttendance.filter(a => a.status === 'late').length,
      excused: studentAttendance.filter(a => a.status === 'excused').length,
      halfDay: studentAttendance.filter(a => a.status === 'half_day').length
    };
    
    stats.percentage = stats.total > 0 
      ? ((stats.present / stats.total) * 100).toFixed(2) 
      : 0;
    
    return NextResponse.json({
      success: true,
      data: {
        student: {
          _id: student._id,
          fullName: student.fullName,
          email: student.email,
          registrationNumber: student.studentProfile?.registrationNumber,
          rollNumber: student.studentProfile?.rollNumber,
          section: student.studentProfile?.section
        },
        attendance: studentAttendance,
        stats,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Error fetching student attendance:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to fetch attendance' },
      { status: 500 }
    );
  }
}, [requireRole(['super_admin'])]);

// PUT /api/super-admin/students/[id]/attendance - Update specific attendance status
export const PUT = withAuth(async (request, user, userDoc, { params }) => {
  try {
        
    const { id } = await params;
    const body = await request.json();
    const { attendanceId, status, remarks } = body;
    
    if (!attendanceId || !status) {
      return NextResponse.json(
        { success: false, message: 'Attendance ID and status are required' },
        { status: 400 }
      );
    }
    
    // Find the attendance record
    const attendance = await Attendance.findById(attendanceId);
    if (!attendance) {
      return NextResponse.json(
        { success: false, message: 'Attendance record not found' },
        { status: 404 }
      );
    }
    
    // Find and update the student's record
    const studentRecord = attendance.records.find(
      r => r.studentId.toString() === id
    );
    
    if (!studentRecord) {
      return NextResponse.json(
        { success: false, message: 'Student not found in attendance record' },
        { status: 404 }
      );
    }
    
    studentRecord.status = status;
    if (remarks !== undefined) {
      studentRecord.remarks = remarks;
    }
    
    await attendance.save();
    
    return NextResponse.json({
      success: true,
      message: 'Attendance status updated successfully',
      data: { attendance }
    });
  } catch (error) {
    console.error('Error updating attendance:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to update attendance' },
      { status: 500 }
    );
  }
}, [requireRole(['super_admin'])]);
