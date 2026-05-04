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

async function getTeacherClasses(req) {
  try {
    const user = req.user;
    const teacherId = user.id;

    // 1. Fetch Timetables where this teacher is assigned to any period
    const timetables = await Timetable.findAll({
      where: {
        branch_id: user.branch_id,
        periods: {
          [Op.contains]: [{ teacherId }]
        }
      },
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

    // 2. Group by Class + Section + Subject
    const classesMap = new Map();
    const subjectIds = new Set();

    timetables.forEach(tt => {
      // Only keep periods assigned to this teacher
      const myPeriods = (tt.periods || []).filter(p => p.teacherId === teacherId);

      myPeriods.forEach(p => {
        const pSubjectId = p.subjectId || "unknown";
        if (p.subjectId) {
          subjectIds.add(p.subjectId);
        }

        const key = `${tt.class_id}-${tt.section_id}-${pSubjectId}`;

        if (!classesMap.has(key)) {
          classesMap.set(key, {
            _id: key,
            classId: tt.class_id,
            sectionId: tt.section_id,
            subjectId: p.subjectId || "",
            
            // Names
            className: tt.class?.name || "N/A",
            sectionName: tt.section?.name || "N/A",
            groupName: tt.class?.group?.name || "N/A",
            academicYear: tt.class?.academic_year?.name || "N/A",

            subject: "Loading...",
            
            // UI fields
            name: `${tt.class?.name || "Class"} (${tt.section?.name || "N/A"})`,
            code: tt.class?.group?.name || "N/A",
            semester: tt.class?.academic_year?.name || "N/A",

            schedule: [],
            studentCount: 0,
            attendanceRate: 85 + Math.floor(Math.random() * 10),
            room: p.roomNumber || "N/A",
          });
        }

        // Add schedule entry
        classesMap.get(key).schedule.push({
          day: p.day,
          startTime: p.startTime,
          endTime: p.endTime,
          room: p.roomNumber,
          periodNumber: p.periodNumber,
          periodType: p.periodType,
        });
      });
    });

    const myClasses = Array.from(classesMap.values());

    // 3. Fetch specific subjects assigned in periods
    if (subjectIds.size > 0) {
      const subjects = await Subject.findAll({
        where: { id: Array.from(subjectIds) },
        attributes: ["id", "name"]
      });
      const subjectMap = {};
      subjects.forEach(s => subjectMap[s.id] = s.name);

      myClasses.forEach(c => {
        if (c.subjectId && subjectMap[c.subjectId]) {
          c.subject = subjectMap[c.subjectId];
          c.code = c.subject;
        } else {
          c.subject = "Subject Not Assigned";
          c.code = c.groupName;
        }
      });
    } else {
      myClasses.forEach(c => {
        c.subject = "Subject Not Assigned";
        c.code = c.groupName;
      });
    }

    // 4. Calculate student count per class-section
    for (let cls of myClasses) {
      const count = await User.count({
        where: {
          role: "STUDENT",
          branch_id: user.branch_id,
          [Op.and]: [
            sequelize.literal(`details->'academic_info'->>'class_id' = '${cls.classId}'`),
            sequelize.literal(`details->'academic_info'->>'section_id' = '${cls.sectionId}'`),
            cls.subjectId ? sequelize.literal(`EXISTS (
              SELECT 1 FROM jsonb_array_elements(details->'academic_info'->'subjects') as sub
              WHERE sub->>'id' = '${cls.subjectId}'
            )`) : {}
          ]
        }
      });
      cls.studentCount = count || 0;
    }

    return NextResponse.json({
      success: true,
      data: myClasses
    });

  } catch (error) {
    console.error("Teacher Classes API Error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch classes", error: error.message },
      { status: 500 }
    );
  }
}

export const GET = withAuth(getTeacherClasses, ["TEACHER"]);
