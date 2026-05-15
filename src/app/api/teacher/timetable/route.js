import { NextResponse } from "next/server";
import { withAuth } from "@/backend/middleware/auth.middleware";
import { 
  User, 
  Timetable, 
  Class, 
  Section, 
  Subject, 
  Group, 
  AcademicYear,
  sequelize 
} from "@/backend/models/postgres";
import { Op } from "sequelize";

async function getTeacherTimetable(req) {
  try {
    const user = req.user;
    const teacherId = user.id;
    
    // Optional query params for filtering
    const { class_id, section_id } = req.nextUrl.searchParams;

    // 1. Fetch Timetables where this teacher is assigned to any period
    const where = {
      branch_id: user.branch_id,
      periods: {
        [Op.contains]: [{ teacherId }]
      }
    };

    // Add optional filters
    if (class_id) where.class_id = class_id;
    if (section_id) where.section_id = section_id;

    const timetables = await Timetable.findAll({
      where,
      include: [
        { 
          model: Class, 
          as: "class", 
          attributes: ["id", "name"],
          include: [
            { model: Group, as: "group", attributes: ["id", "name"] },
            { model: AcademicYear, as: "academic_year", attributes: ["id", "name"] }
          ]
        },
        { model: Section, as: "section", attributes: ["id", "name"] }
      ]
    });

    // 2. Format timetables with only this teacher's periods
    const formattedTimetables = timetables.map(tt => {
      // Filter periods assigned to this teacher
      const myPeriods = (tt.periods || []).filter(p => p.teacherId === teacherId);

      return {
        id: tt.id,
        class_id: tt.class_id,
        class_name: tt.class?.name || "N/A",
        section_id: tt.section_id,
        section_name: tt.section?.name || "N/A",
        group_name: tt.class?.group?.name || "N/A",
        academic_year_id: tt.academic_year_id,
        academic_year_name: tt.class?.academic_year?.name || "N/A",
        branch_id: tt.branch_id,
        periods: myPeriods.map(p => ({
          periodNumber: p.periodNumber,
          periodType: p.periodType,
          day: p.day,
          startTime: p.startTime,
          endTime: p.endTime,
          roomNumber: p.roomNumber,
          subjectId: p.subjectId,
          subjectName: p.subjectName || "N/A",
          teacherId: p.teacherId,
          teacherName: p.teacherName || "N/A"
        })),
        total_periods_assigned: myPeriods.length,
        created_at: tt.created_at,
        updated_at: tt.updated_at
      };
    });

    // 3. Bulk fetch subject names for all periods
    const allSubjectIds = [
      ...new Set(
        formattedTimetables.flatMap(tt =>
          tt.periods.map(p => p.subjectId).filter(Boolean)
        )
      )
    ];

    if (allSubjectIds.length > 0) {
      const subjects = await Subject.findAll({
        where: { id: allSubjectIds },
        attributes: ["id", "name"]
      });
      const subjectMap = {};
      subjects.forEach(s => subjectMap[s.id] = s.name);

      // Update subject names in periods
      formattedTimetables.forEach(tt => {
        tt.periods.forEach(p => {
          if (p.subjectId && subjectMap[p.subjectId]) {
            p.subjectName = subjectMap[p.subjectId];
          }
        });
      });
    }

    return NextResponse.json({
      success: true,
      data: formattedTimetables,
      total: formattedTimetables.length,
      message: "Teacher timetable fetched successfully"
    });

  } catch (error) {
    console.error("Teacher Timetable API Error:", error);
    return NextResponse.json(
      { 
        success: false, 
        message: "Failed to fetch timetable", 
        error: error.message 
      },
      { status: 500 }
    );
  }
}

export const GET = withAuth(getTeacherTimetable, ["TEACHER"]);
