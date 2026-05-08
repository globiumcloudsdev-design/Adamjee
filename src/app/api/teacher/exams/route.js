import { NextResponse } from "next/server";
import { withAuth } from "@/backend/middleware/auth.middleware";
import { Exam, Timetable, Branch, AcademicYear, Group, Class, Section, Subject } from "@/backend/models/postgres";
import { Op } from "sequelize";
import { format } from "date-fns";

// Automatically update exam status based on current date
async function autoUpdateExamStatuses(exams) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStr = today.toISOString().split('T')[0];

  for (let exam of exams) {
    // Only update if scheduled or ongoing
    if (exam.status !== 'scheduled' && exam.status !== 'ongoing') continue;

    const subjects = exam.subjects || [];
    if (subjects.length === 0) continue;

    // Get all unique dates from subjects
    const dates = subjects.map(s => s.date).filter(Boolean).sort();
    if (dates.length === 0) continue;

    const minDate = dates[0];
    const maxDate = dates[dates.length - 1];

    let targetStatus = exam.status;

    if (maxDate < todayStr) {
      targetStatus = 'completed';
    } else if (minDate <= todayStr && maxDate >= todayStr) {
      targetStatus = 'ongoing';
    } else if (minDate > todayStr) {
      targetStatus = 'scheduled';
    }

    if (targetStatus !== exam.status) {
      try {
        await Exam.update({ status: targetStatus }, { where: { id: exam.id } });
        exam.status = targetStatus; // Update the object for immediate response
      } catch (err) {
        console.error(`Failed to auto-update exam ${exam.id} status:`, err);
      }
    }
  }
}

async function getTeacherExams(req) {
  try {
    const user = req.user;
    const teacherId = user.id;

    // 1. Fetch Timetables where this teacher is assigned
    const timetables = await Timetable.findAll({
      where: {
        branch_id: user.branch_id,
        periods: {
          [Op.contains]: [{ teacherId }]
        }
      },
      attributes: ["class_id", "section_id"]
    });

    if (!timetables.length) {
      return NextResponse.json({ success: true, exams: [] });
    }

    // 2. Build OR conditions for class_id and section_id
    const classSectionConditions = timetables.map(tt => ({
      class_id: tt.class_id,
      section_id: tt.section_id
    }));

    // Remove duplicates
    const uniqueConditions = [];
    const seen = new Set();
    classSectionConditions.forEach(cond => {
      const key = `${cond.class_id}-${cond.section_id}`;
      if (!seen.has(key)) {
        seen.add(key);
        uniqueConditions.push(cond);
      }
    });

    // 3. Fetch Exams for these classes and sections
    const exams = await Exam.findAll({
      where: {
        branch_id: user.branch_id,
        [Op.or]: uniqueConditions
      },
      include: [
        { model: Branch, as: "branch", attributes: ["id", "name"] },
        { model: AcademicYear, as: "academicYear", attributes: ["id", "name"] },
        { model: Group, as: "group", attributes: ["id", "name"] },
        { model: Class, as: "class", attributes: ["id", "name"] },
        { model: Section, as: "section", attributes: ["id", "name"] },
      ],
      order: [["created_at", "DESC"]]
    });

    // Automatically update statuses based on date before processing
    await autoUpdateExamStatuses(exams);

    // Collect all unique subject_ids from all exams' subjects JSONB
    const allSubjectIds = [
      ...new Set(
        exams.flatMap((e) =>
          (e.subjects || []).map((s) => s.subject_id || s.subjectId).filter(Boolean)
        )
      ),
    ];

    // Bulk fetch subject names from DB
    const subjectRecords = allSubjectIds.length
      ? await Subject.findAll({
          where: { id: allSubjectIds },
          attributes: ["id", "name"],
        })
      : [];
    const subjectMap = {};
    subjectRecords.forEach((s) => { subjectMap[s.id] = s.name; });

    // Re-map each exam's subjects with fresh subject_name from DB
    const examsWithSubjectNames = exams.map((exam) => {
      const plain = exam.toJSON();
      plain.subjects = (plain.subjects || []).map((s) => ({
        ...s,
        subjectId: {
          _id: s.subject_id || s.subjectId,
          name: subjectMap[s.subject_id || s.subjectId] || s.subject_name || "Unknown Subject"
        },
        subject_name: subjectMap[s.subject_id || s.subjectId] || s.subject_name || "Unknown Subject",
      }));
      return plain;
    });

    return NextResponse.json({ success: true, exams: examsWithSubjectNames });
  } catch (error) {
    console.error("Error fetching teacher exams:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch exams", error: error.message },
      { status: 500 }
    );
  }
}

export const GET = withAuth(getTeacherExams, ["TEACHER"]);
