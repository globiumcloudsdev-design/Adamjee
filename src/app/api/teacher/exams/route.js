import { NextResponse } from "next/server";
import { withAuth } from "@/backend/middleware/auth.middleware";
import { Exam, Timetable, Branch, AcademicYear, Group, Class, Section, Subject } from "@/backend/models/postgres";
import { Op } from "sequelize";

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
