import { NextResponse } from "next/server";
import { withAuth } from "@/backend/middleware/auth.middleware.js";
import {
  Exam,
  Branch,
  AcademicYear,
  Class,
  Section,
  Group,
  Subject,
} from "@/backend/models/postgres";
import { Op } from "sequelize";

// Ensure table exists
let tableSynced = false;
async function ensureTableSynced() {
  if (!tableSynced) {
    try {
      await Exam.sync({ alter: true });
      tableSynced = true;
    } catch (e) {
      console.error("Exam table sync failed:", e);
    }
  }
}

// GET /api/exams
async function listExams(req) {
  await ensureTableSynced();
  const currentUser = req.user;
  const { searchParams } = new URL(req.url);

  const branch_id = searchParams.get("branch_id");
  const class_id = searchParams.get("class_id");
  const section_id = searchParams.get("section_id");
  const status = searchParams.get("status");
  const exam_type = searchParams.get("exam_type");

  let where = {};

  if (currentUser.role === "BRANCH_ADMIN") {
    where.branch_id = currentUser.branch_id;
  } else if (branch_id) {
    where.branch_id = branch_id;
  }

  if (class_id) where.class_id = class_id;
  if (section_id) where.section_id = section_id;
  if (status) where.status = status;
  if (exam_type) where.exam_type = exam_type;

  try {
    const exams = await Exam.findAll({
      where,
      include: [
        { model: Branch, as: "branch", attributes: ["id", "name"] },
        { model: AcademicYear, as: "academicYear", attributes: ["id", "name"] },
        { model: Group, as: "group", attributes: ["id", "name"] },
        { model: Class, as: "class", attributes: ["id", "name"] },
        { model: Section, as: "section", attributes: ["id", "name"] },
      ],
      order: [["created_at", "DESC"]],
    });

    // Collect all unique subject_ids from all exams' subjects JSONB
    const allSubjectIds = [
      ...new Set(
        exams.flatMap((e) =>
          (e.subjects || []).map((s) => s.subject_id).filter(Boolean)
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
        subject_name: subjectMap[s.subject_id] || s.subject_name || "Unknown Subject",
      }));
      return plain;
    });

    return NextResponse.json({
      success: true,
      data: examsWithSubjectNames,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
}

// POST /api/exams
async function createExam(req) {
  await ensureTableSynced();
  const currentUser = req.user;

  if (currentUser.role !== "BRANCH_ADMIN") {
    return NextResponse.json(
      { error: "Only Branch Admins can create exams" },
      { status: 403 },
    );
  }

  try {
    const body = await req.json();
    const {
      title,
      exam_type,
      branch_id,
      academic_year_id,
      group_id,
      class_id,
      section_id,
      subjects,
      description,
    } = body;

    // Validation
    if (
      !title ||
      !class_id ||
      !section_id ||
      !group_id ||
      !academic_year_id ||
      !subjects ||
      !Array.isArray(subjects)
    ) {
      return NextResponse.json(
        {
          error:
            "Missing required fields (Title, Academic Year, Group, Class, Section, Subjects)",
        },
        { status: 400 },
      );
    }

    // Lookup subject_name from Subject model using subject_id
    const subjectIds = subjects.map((s) => s.subject_id).filter(Boolean);
    const subjectRecords = await Subject.findAll({
      where: { id: subjectIds },
      attributes: ["id", "name"],
    });
    const subjectMap = {};
    subjectRecords.forEach((s) => { subjectMap[s.id] = s.name; });

    const subjectsWithNames = subjects.map((s) => ({
      ...s,
      subject_name: subjectMap[s.subject_id] || "Unknown Subject",
    }));

    const exam = await Exam.create({
      title,
      exam_type: exam_type || "midterm",
      branch_id: currentUser.branch_id, // Force current branch
      academic_year_id,
      group_id,
      class_id,
      section_id,
      subjects: subjectsWithNames,
      description,
      created_by: currentUser.id,
      status: "scheduled",
    });

    return NextResponse.json(
      {
        success: true,
        message: "Exam created successfully",
        data: exam,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Exam creation error:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
}

export const GET = withAuth(listExams, ["SUPER_ADMIN", "BRANCH_ADMIN"]);
export const POST = withAuth(createExam, ["SUPER_ADMIN", "BRANCH_ADMIN"]);
