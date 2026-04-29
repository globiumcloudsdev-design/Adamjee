import { NextResponse } from "next/server";
import { withAuth } from "@/backend/middleware/auth.middleware";
import { Timetable, Class, Section, AcademicYear } from "@/backend/models/postgres";
import { Op } from "sequelize";

async function getTeacherTimetable(req, { params }) {
  const { id: teacherId } = params;
  const { searchParams } = new URL(req.url);
  const academic_year_id = searchParams.get("academic_year_id");

  let where = {
    periods: {
      [Op.contains]: [{ teacherId: teacherId }]
    }
  };

  if (academic_year_id) {
    where.academic_year_id = academic_year_id;
  }

  try {
    const entries = await Timetable.findAll({
      where,
      include: [
        { model: Class, as: "class", attributes: ["id", "name"] },
        { model: Section, as: "section", attributes: ["id", "name"] },
        { model: AcademicYear, as: "academicYear", attributes: ["id", "name"] },
      ],
      order: [["created_at", "DESC"]],
    });

    // Extract only relevant periods for this teacher from each timetable
    const teacherSchedule = [];
    entries.forEach(tt => {
      const relevantPeriods = (tt.periods || []).filter(p => p.teacherId === teacherId);
      relevantPeriods.forEach(p => {
        teacherSchedule.push({
          ...p,
          class: tt.class,
          section: tt.section,
          academicYear: tt.academicYear,
          timetableId: tt.id
        });
      });
    });

    return NextResponse.json({
      success: true,
      schedule: teacherSchedule,
      timetables: entries // return full timetables if needed
    });
  } catch (error) {
    console.error("Teacher timetable fetch error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export const GET = withAuth(getTeacherTimetable, ["SUPER_ADMIN", "BRANCH_ADMIN", "TEACHER"]);
