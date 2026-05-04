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
  Branch, 
  Exam,
  sequelize 
} from "@/backend/models/postgres";
import { Op } from "sequelize";

async function getTeacherDashboard(req) {
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

    const uniqueClassSections = new Set();
    const myClassesMap = new Map();
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
        uniqueClassSections.add(`${tt.class_id}-${tt.section_id}`); // Keep track of unique classes for total student count

        if (!myClassesMap.has(key)) {
          myClassesMap.set(key, {
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

            // UI display fields  
            name: `${tt.class?.name || "Class"} (${tt.section?.name || "N/A"})`,
            code: tt.class?.group?.name || "N/A",
            semester: tt.class?.academic_year?.name || "N/A",
            
            schedule: [],
            studentCount: 0,
            attendanceRate: 85 + Math.floor(Math.random() * 10),
            room: p.roomNumber || "N/A",
            nextClass: null
          });
        }

        // Add schedule entry
        myClassesMap.get(key).schedule.push({
          day: p.day,
          startTime: p.startTime,
          endTime: p.endTime,
          room: p.roomNumber,
          periodNumber: p.periodNumber,
          periodType: p.periodType
        });
      });
    });

    let myClasses = Array.from(myClassesMap.values());

    // 2. Fetch specific subjects assigned in periods
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

    // 3. Calculate student counts per class and find next upcoming class
    const now = new Date();
    const currentDay = now.toLocaleDateString("en-US", { weekday: "long" });
    const currentMins = now.getHours() * 60 + now.getMinutes();
    const dayIndices = { "Monday": 1, "Tuesday": 2, "Wednesday": 3, "Thursday": 4, "Friday": 5, "Saturday": 6, "Sunday": 7 };
    const currentDayIdx = dayIndices[currentDay] || 0;

    for (let cls of myClasses) {
      const count = await User.count({
        where: {
          role: "STUDENT",
          branch_id: user.branch_id,
          [Op.and]: [
            sequelize.literal(`details->'academic_info'->>'class_id' = '${cls.classId}'`),
            sequelize.literal(`details->'academic_info'->>'section_id' = '${cls.sectionId}'`)
          ]
        }
      });
      cls.studentCount = count || 0;

      // Find next occurrence in schedule
      let nextOcc = null;
      let minDiff = Infinity;
      cls.schedule.forEach(s => {
        if (!s.startTime) return;
        const sDayIdx = dayIndices[s.day] || 0;
        const [h, m] = s.startTime.split(':').map(Number);
        const sMins = h * 60 + m;
        let diff = (sDayIdx - currentDayIdx) * 1440 + (sMins - currentMins);
        if (diff <= 0) diff += 7 * 1440;
        if (diff < minDiff) {
          minDiff = diff;
          nextOcc = `${s.day} at ${s.startTime}`;
        }
      });
      cls.nextClass = nextOcc;
    }

    // 4. Calculate total unique students across all assigned classes
    let totalStudents = 0;
    const classSectionPairs = Array.from(uniqueClassSections);
    if (classSectionPairs.length > 0) {
      const conditions = classSectionPairs.map(pair => {
        const parts = pair.split('-');
        const cid = parts.slice(0, 5).join('-');
        const sid = parts.slice(5).join('-');
        return `(details->'academic_info'->>'class_id' = '${cid}' AND details->'academic_info'->>'section_id' = '${sid}')`;
      }).join(' OR ');

      totalStudents = await User.count({
        where: {
          role: "STUDENT",
          branch_id: user.branch_id,
          [Op.and]: [sequelize.literal(`(${conditions})`)]
        }
      });
    }

    const branch = await Branch.findByPk(user.branch_id, {
      attributes: ["id", "name", "address"]
    });

    let formattedUpcomingExams = [];
    if (classSectionPairs.length > 0) {
      const classSectionConditions = Array.from(uniqueClassSections).map(pair => {
        const parts = pair.split('-');
        return {
          class_id: parts.slice(0, 5).join('-'),
          section_id: parts.slice(5).join('-')
        };
      });

      const upcomingExams = await Exam.findAll({
        where: {
          branch_id: user.branch_id,
          status: "scheduled",
          [Op.or]: classSectionConditions
        },
        include: [{ model: Class, as: "class", attributes: ["name"] }],
        order: [["created_at", "ASC"]],
        limit: 5
      });

      formattedUpcomingExams = upcomingExams.map(exam => {
        const firstSubject = exam.subjects && exam.subjects[0] ? exam.subjects[0] : null;
        return {
          _id: exam.id,
          title: exam.title,
          examType: exam.exam_type,
          classId: { name: exam.class?.name || "N/A" },
          date: firstSubject ? firstSubject.date : new Date(),
          duration: firstSubject ? firstSubject.duration : null,
          room: firstSubject ? firstSubject.room : null,
          subject: firstSubject ? firstSubject.subject_name : null,
        };
      });
    }

    const data = {
      stats: {
        classes: { total: myClasses.length, active: myClasses.length, change: 0 },
        students: { total: totalStudents, change: 0 },
        attendance: { average: 94, change: 0 },
        exams: { total: formattedUpcomingExams.length, thisWeek: 0, change: 0 }
      },
      myClasses,
      branchInfo: branch,
      upcomingExams: formattedUpcomingExams,
      todayAttendance: { present: 0, absent: 0, late: 0, total: 0 },
      recentActivity: [],
      teacherAttendance: { status: "checked_out", checkInTime: null, checkOutTime: null, workingHours: null },
      attendanceHistory: []
    };

    return NextResponse.json({ success: true, data });

  } catch (error) {
    console.error("Dashboard API Error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch dashboard data", error: error.message },
      { status: 500 }
    );
  }
}

export const GET = withAuth(getTeacherDashboard, ["TEACHER"]);
