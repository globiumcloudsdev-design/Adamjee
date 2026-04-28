import { NextResponse } from 'next/server';
import { withAuth, requireRole } from '@/backend/middleware/auth';
import { Attendance, User, Branch, Class, Section } from '@/backend/models/postgres/index.js';

// GET /api/super-admin/students/[id]/attendance - Get student's attendance history
export const GET = withAuth(async (request, user, userDoc, { params }) => {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 50;
    const skip = (page - 1) * limit;
    
    // Verify student exists
    const student = await User.findOne({ where: { id, role: 'STUDENT' } });
    if (!student) {
      return NextResponse.json(
        { success: false, message: 'Student not found' },
        { status: 404 }
      );
    }

    let detailsObj = {};
    if (typeof student.details === 'string') {
      try {
        detailsObj = JSON.parse(student.details);
      } catch (e) {
        detailsObj = {};
      }
    } else if (student.details && typeof student.details === 'object') {
      detailsObj = student.details;
    }

    const classId = student.class_id || student.classId || detailsObj.academic_info?.class_id || detailsObj.class_id || detailsObj.classId;
    const sectionId = student.section_id || student.sectionId || detailsObj.academic_info?.section_id || detailsObj.section_id || detailsObj.sectionId;
    const rollNo = detailsObj.academic_info?.roll_no || detailsObj.roll_no || detailsObj.rollNumber || '';


    let className = '—';
    let sectionName = '—';

    if (classId) {
      const cls = await Class.findByPk(classId);
      if (cls) className = cls.name;
    }

    if (sectionId) {
      const sec = await Section.findByPk(sectionId);
      if (sec) sectionName = sec.name;
    }

    
    // Get all attendance records for this student
    const attendances = await Attendance.findAll({
      where: { student_id: id },
      include: [
        { model: Branch, as: 'branch', attributes: ['id', 'name'] },
        { model: User, as: 'marker', attributes: ['id', 'first_name', 'last_name', 'email'] },
      ],
      order: [['date', 'DESC']],
      offset: skip,
      limit: limit
    });

    const total = await Attendance.count({ where: { student_id: id } });

    const studentAttendance = attendances.map(attendance => ({
      id: attendance.id,
      date: attendance.date,
      branchId: attendance.branch,
      classId: { id: classId, name: className },
      sectionId: { id: sectionId, name: sectionName },
      attendanceType: attendance.attendance_type || 'daily',
      markedBy: attendance.marker,
      status: attendance.status?.toLowerCase() || 'absent',
      remarks: attendance.remarks,
      createdAt: attendance.created_at
    }));


    const stats = {
      total: studentAttendance.length,
      present: studentAttendance.filter(a => a.status === 'present').length,
      absent: studentAttendance.filter(a => a.status === 'absent').length,
      late: studentAttendance.filter(a => a.status === 'late').length,
      excused: studentAttendance.filter(a => a.status === 'leave').length
    };

    stats.percentage = stats.total > 0 
      ? ((stats.present / stats.total) * 100).toFixed(2) 
      : 0;

    return NextResponse.json({
      success: true,
      data: {
        student: {
          id: student.id,
          fullName: `${student.first_name} ${student.last_name || ''}`,
          email: student.email,
          registrationNumber: student.registration_no,
          rollNumber: rollNo || student.details?.academic_info?.roll_no || '',

          className: className,
          section: sectionName
        },

        attendance: studentAttendance,
        stats,
        pagination: { page, limit, total, pages: Math.ceil(total / limit) }
      }
    });
  } catch (error) {
    console.error('Error fetching student attendance:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to fetch attendance' },
      { status: 500 }
    );
  }
}, [requireRole(['SUPER_ADMIN', 'super_admin', 'BRANCH_ADMIN', 'branch_admin'])]);


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
    
    const attendance = await Attendance.findOne({ where: { id: attendanceId, student_id: id } });
    if (!attendance) {
      return NextResponse.json(
        { success: false, message: 'Attendance record not found for this student' },
        { status: 404 }
      );
    }
    
    attendance.status = String(status).toUpperCase();

    if (remarks !== undefined) {
      attendance.remarks = remarks;
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
}, [requireRole(['SUPER_ADMIN', 'super_admin', 'BRANCH_ADMIN', 'branch_admin'])]);


