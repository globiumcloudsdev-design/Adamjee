import { NextResponse } from "next/server";
import { Op, fn, col } from "sequelize";
import { withAuth } from "@/backend/middleware/auth.middleware.js";
import { Attendance, Branch, Class, Section, User } from "@/backend/models/postgres";

const ALLOWED_FILTER_STATUSES = new Set(["PRESENT", "ABSENT", "LEAVE"]);
const DISPLAY_STATUSES = ["present", "absent", "leave"];

function parseJsonSafe(value, fallback = {}) {
  if (!value) return fallback;
  if (typeof value === "object") return value;
  if (typeof value !== "string") return fallback;

  try {
    const parsed = JSON.parse(value);
    return parsed && typeof parsed === "object" ? parsed : fallback;
  } catch {
    return fallback;
  }
}

function toInt(value, defaultValue) {
  const parsed = Number.parseInt(String(value ?? ""), 10);
  return Number.isNaN(parsed) ? defaultValue : parsed;
}

function isDateOnly(value) {
  if (typeof value !== "string") return false;
  return /^\d{4}-\d{2}-\d{2}$/.test(value.trim());
}

function formatDateOnly(d) {
  return d.toISOString().split("T")[0];
}

function normalizeStatus(status) {
  if (!status) return null;
  const normalized = String(status).trim().toUpperCase();
  return ALLOWED_FILTER_STATUSES.has(normalized) ? normalized : null;
}

function normalizeStatusForStudentView(status) {
  const normalized = String(status || "").toUpperCase();
  if (normalized === "PRESENT") return "present";
  if (normalized === "LEAVE") return "leave";
  return "absent";
}

async function buildStudentContext(user) {
  const details = parseJsonSafe(user.details, {});
  const academicInfo = details?.academic_info || {};

  const classId = user.class_id || user.classId || academicInfo.class_id || details.class_id || details.classId || null;
  const sectionId =
    user.section_id || user.sectionId || academicInfo.section_id || details.section_id || details.sectionId || null;
  const rollNumber = academicInfo.roll_no || details.roll_no || details.rollNumber || null;

  let className = null;
  let sectionName = null;

  if (classId) {
    const cls = await Class.findByPk(classId, { attributes: ["id", "name"] });
    className = cls?.name || null;
  }

  if (sectionId) {
    const section = await Section.findByPk(sectionId, { attributes: ["id", "name"] });
    sectionName = section?.name || null;
  }

  return {
    class: classId ? { id: classId, name: className } : null,
    section: sectionId ? { id: sectionId, name: sectionName } : null,
    rollNumber,
  };
}

function buildDateFilter(searchParams) {
  const filterType = String(searchParams.get("filterType") || "all").toLowerCase();

  if (filterType === "all") {
    return { filterType, whereDate: null, applied: { filterType } };
  }

  if (filterType === "date") {
    const date = (searchParams.get("date") || "").trim();
    if (!isDateOnly(date)) {
      throw new Error("For filterType=date, valid date (YYYY-MM-DD) is required");
    }

    return {
      filterType,
      whereDate: date,
      applied: { filterType, date },
    };
  }

  if (filterType === "monthly") {
    const month = toInt(searchParams.get("month"), 0);
    const year = toInt(searchParams.get("year"), 0);

    if (!month || month < 1 || month > 12 || !year || year < 2000) {
      throw new Error("For filterType=monthly, valid month (1-12) and year are required");
    }

    const start = new Date(Date.UTC(year, month - 1, 1));
    const end = new Date(Date.UTC(year, month, 0));

    return {
      filterType,
      whereDate: {
        [Op.gte]: formatDateOnly(start),
        [Op.lte]: formatDateOnly(end),
      },
      applied: {
        filterType,
        month,
        year,
      },
    };
  }

  if (filterType === "range") {
    const startDate = (searchParams.get("startDate") || "").trim();
    const endDate = (searchParams.get("endDate") || "").trim();

    if (!isDateOnly(startDate) || !isDateOnly(endDate)) {
      throw new Error("For filterType=range, startDate and endDate (YYYY-MM-DD) are required");
    }

    if (startDate > endDate) {
      throw new Error("startDate cannot be greater than endDate");
    }

    return {
      filterType,
      whereDate: {
        [Op.gte]: startDate,
        [Op.lte]: endDate,
      },
      applied: {
        filterType,
        startDate,
        endDate,
      },
    };
  }

  throw new Error("filterType must be one of: all, date, monthly, range");
}

function buildStatisticsFromGroupedStatus(groupedRows, total) {
  const counts = {
    PRESENT: 0,
    ABSENT: 0,
    LEAVE: 0,
  };

  for (const row of groupedRows) {
    const status = String(row.status || "").toUpperCase();
    const count = Number.parseInt(String(row.get("count") || "0"), 10) || 0;

    if (status === "PRESENT") {
      counts.PRESENT += count;
      continue;
    }

    if (status === "LEAVE") {
      counts.LEAVE += count;
      continue;
    }

    counts.ABSENT += count;
  }

  const presentDays = counts.PRESENT;

  return {
    totalRecords: total,
    presentDays,
    absentDays: counts.ABSENT,
    leaveDays: counts.LEAVE,
    attendancePercentage: total > 0 ? Number(((presentDays / total) * 100).toFixed(2)) : 0,
    statusBreakdown: {
      present: counts.PRESENT,
      absent: counts.ABSENT,
      leave: counts.LEAVE,
    },
  };
}

async function getStudentAttendanceHistory(request) {
  try {
    const currentUser = request.user;
    const { searchParams } = new URL(request.url);

    const page = Math.max(1, toInt(searchParams.get("page"), 1));
    const limit = Math.min(200, Math.max(1, toInt(searchParams.get("limit"), 20)));
    const offset = (page - 1) * limit;

    const status = normalizeStatus(searchParams.get("status"));
    if (searchParams.get("status") && !status) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid status. Allowed values: PRESENT, ABSENT, LEAVE",
        },
        { status: 400 }
      );
    }

    let dateFilter;
    try {
      dateFilter = buildDateFilter(searchParams);
    } catch (validationError) {
      return NextResponse.json(
        {
          success: false,
          message: validationError.message,
        },
        { status: 400 }
      );
    }

    const where = {
      student_id: currentUser.id,
    };

    if (currentUser.branch_id) {
      where.branch_id = currentUser.branch_id;
    }

    if (status) {
      where.status = status;
    }

    if (dateFilter.whereDate) {
      where.date = dateFilter.whereDate;
    }

    const [studentContext, attendanceResult, groupedStatusRows] = await Promise.all([
      buildStudentContext(currentUser),
      Attendance.findAndCountAll({
        where,
        include: [
          {
            model: Branch,
            as: "branch",
            attributes: ["id", "name"],
          },
          {
            model: User,
            as: "marker",
            attributes: ["id", "first_name", "last_name", "email"],
          },
        ],
        order: [["date", "DESC"], ["created_at", "DESC"]],
        limit,
        offset,
      }),
      Attendance.findAll({
        where,
        attributes: ["status", [fn("COUNT", col("id")), "count"]],
        group: ["status"],
      }),
    ]);

    const total = Number(attendanceResult.count || 0);
    const pages = total > 0 ? Math.ceil(total / limit) : 1;

    const records = attendanceResult.rows.map((attendance) => ({
      id: attendance.id,
      date: attendance.date,
      status: normalizeStatusForStudentView(attendance.status),
      remarks: attendance.remarks,
      attendanceType: attendance.attendance_type || "daily",
      branch: attendance.branch
        ? {
            id: attendance.branch.id,
            name: attendance.branch.name,
          }
        : null,
      markedBy: attendance.marker
        ? {
            id: attendance.marker.id,
            name: [attendance.marker.first_name, attendance.marker.last_name].filter(Boolean).join(" ").trim(),
            email: attendance.marker.email,
          }
        : null,
      createdAt: attendance.created_at,
      updatedAt: attendance.updated_at,
    }));

    const statistics = buildStatisticsFromGroupedStatus(groupedStatusRows, total);

    return NextResponse.json(
      {
        success: true,
        data: {
          student: {
            id: currentUser.id,
            fullName: [currentUser.first_name, currentUser.last_name].filter(Boolean).join(" ").trim(),
            email: currentUser.email || null,
            registrationNumber: currentUser.registration_no || null,
            rollNumber: studentContext.rollNumber,
            class: studentContext.class,
            section: studentContext.section,
          },
          records,
          statistics,
          pagination: {
            page,
            limit,
            total,
            pages,
          },
          appliedFilters: {
            ...dateFilter.applied,
            status: status ? status.toLowerCase() : null,
          },
          availableStatuses: DISPLAY_STATUSES,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Student attendance history fetch error:", error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || "Failed to fetch student attendance history",
      },
      { status: 500 }
    );
  }
}

async function markStudentAttendance(request) {
  try {
    const currentUser = request.user;

    // Only teachers, staff, and admin can mark attendance
    if (!["TEACHER", "STAFF", "BRANCH_ADMIN", "SUPER_ADMIN"].includes(currentUser.role)) {
      return NextResponse.json(
        {
          success: false,
          message: "Permission denied. Only teachers, staff, and admins can mark attendance.",
        },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { student_id, date, status, remarks, leave_request_id, branch_id } = body;

    // Validate required fields
    if (!student_id || !date || !status) {
      return NextResponse.json(
        { success: false, message: "Missing required fields: student_id, date, status" },
        { status: 400 }
      );
    }

    // Validate status
    if (!["PRESENT", "ABSENT", "LATE", "LEAVE", "HOLIDAY"].includes(status)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid status. Must be: PRESENT, ABSENT, LATE, LEAVE, or HOLIDAY",
        },
        { status: 400 }
      );
    }

    // Verify student exists
    const student = await User.findByPk(student_id);
    if (!student) {
      return NextResponse.json(
        { success: false, message: "Student not found" },
        { status: 404 }
      );
    }

    // Check if attendance already exists for this student on this date
    const existingAttendance = await Attendance.findOne({
      where: {
        student_id,
        date,
      },
    });

    if (existingAttendance) {
      // Update existing attendance
      await existingAttendance.update({
        status,
        remarks,
        leave_request_id,
        updated_by: currentUser.id,
      });

      return NextResponse.json(
        {
          success: true,
          message: "Attendance updated successfully",
          data: {
            id: existingAttendance.id,
            student_id: existingAttendance.student_id,
            date: existingAttendance.date,
            status: existingAttendance.status,
          },
        },
        { status: 200 }
      );
    }

    // Create new attendance record
    const attendance = await Attendance.create({
      student_id,
      branch_id: branch_id || student.branch_id || currentUser.branch_id,
      date,
      status,
      remarks,
      leave_request_id,
      marked_by: currentUser.id,
    });

    return NextResponse.json(
      {
        success: true,
        message: "Attendance marked successfully",
        data: {
          id: attendance.id,
          student_id: attendance.student_id,
          date: attendance.date,
          status: attendance.status,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Mark attendance error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Failed to mark attendance" },
      { status: 500 }
    );
  }
}

export const GET = withAuth(getStudentAttendanceHistory, ["STUDENT", "SUPER_ADMIN", "BRANCH_ADMIN"]);
export const POST = withAuth(markStudentAttendance, ["TEACHER", "STAFF", "BRANCH_ADMIN", "SUPER_ADMIN"]);
