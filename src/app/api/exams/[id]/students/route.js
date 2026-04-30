import { NextResponse } from "next/server";
import { withAuth } from "@/backend/middleware/auth.middleware.js";
import {
  Exam,
  User,
  Section,
  Class,
  sequelize,
} from "@/backend/models/postgres";
import { Op } from "sequelize";

// GET /api/exams/:id/students
async function getExamStudents(req, { params }) {
  const { id } = await params;
  const currentUser = req.user;

  try {
    const exam = await Exam.findByPk(id, {
      include: [
        { model: Class, as: "class" },
        { model: Section, as: "section" },
      ],
    });

    if (!exam) {
      return NextResponse.json({ error: "Exam not found" }, { status: 404 });
    }

    // Check authorization
    if (
      currentUser.role === "BRANCH_ADMIN" &&
      currentUser.branch_id !== exam.branch_id
    ) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Fetch students in this branch
    // Note: We'll do a broad fetch and then filter by section_id in JS for better compatibility
    // with nested JSONB structure unless we are sure of the schema.
    const students = await User.findAll({
      where: {
        role: "STUDENT",
        branch_id: exam.branch_id,
        is_active: true,
      },
      attributes: [
        "id",
        "first_name",
        "last_name",
        "registration_no",
        "details",
      ],
      order: [["first_name", "ASC"]],
    });

    // Filter students by section_id (stored in details.academic_info.section_id)
    const sectionStudents = students.filter((student) => {
      const academicInfo =
        student.details?.academic_info || student.details?.student || {};

      // Check for section match (can be section_id or section)
      const studentSectionId = academicInfo.section_id || academicInfo.section;

      return String(studentSectionId) === String(exam.section_id);
    });

    // Post-process to format and include enrolled subjects
    const formattedStudents = sectionStudents.map((student) => {
      const academicInfo =
        student.details?.academic_info || student.details?.student || {};

      // Extract enrolled subject IDs
      // Subjects can be an array of IDs or objects with subject_id
      const rawSubjects =
        academicInfo.subjects ||
        academicInfo.selected_subjects ||
        academicInfo.enrolled_subjects ||
        [];
      const enrolledSubjects = rawSubjects
        .map((s) => {
          if (typeof s === "string") return s;
          return s.subject_id || s.id || s.subject?.id;
        })
        .filter(Boolean);

      return {
        id: student.id,
        name: `${student.first_name} ${student.last_name}`,
        registration_no: student.registration_no,
        roll_no: academicInfo.roll_no || "",
        enrolled_subjects: enrolledSubjects,
      };
    });

    return NextResponse.json({
      success: true,
      data: formattedStudents,
      exam_subjects: exam.subjects,
    });
  } catch (error) {
    console.error("Fetch exam students error:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
}

export const GET = withAuth(getExamStudents, [
  "SUPER_ADMIN",
  "BRANCH_ADMIN",
  "TEACHER",
]);
