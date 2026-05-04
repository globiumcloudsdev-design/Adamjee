import { NextResponse } from "next/server";
import { withAuth } from "@/backend/middleware/auth.middleware";
import {
  Assignment,
  Branch,
  Class,
  Section,
  Subject,
  User,
} from "@/backend/models/postgres";
import { Op } from "sequelize";

// GET /api/assignments?branch_id=&class_id=&section_id=&subject_id=&teacher_id=
async function listAssignments(req) {
  const currentUser = req.user;
  const { searchParams } = new URL(req.url);
  let branch_id = searchParams.get("branch_id");
  const class_id = searchParams.get("class_id");
  const section_id = searchParams.get("section_id");
  const subject_id = searchParams.get("subject_id");
  const teacher_id = searchParams.get("teacher_id");

  let where = {};
  if (currentUser.role === "BRANCH_ADMIN") {
    where.branch_id = currentUser.branch_id;
  } else if (branch_id) {
    where.branch_id = branch_id;
  }
  if (class_id) where.class_id = class_id;
  if (section_id) where.section_id = section_id;
  if (subject_id) where.subject_id = subject_id;
  if (teacher_id) where.teacher_id = teacher_id;
  else if (currentUser.role === "TEACHER") where.teacher_id = currentUser.id;

  const assignments = await Assignment.findAll({
    where,
    include: [
      { model: Branch, as: "branch", attributes: ["id", "name"] },
      { model: Class, as: "class", attributes: ["id", "name"] },
      { model: Section, as: "section", attributes: ["id", "name"] },
      { model: Subject, as: "subject", attributes: ["id", "name"] },
      {
        model: User,
        as: "teacher",
        attributes: ["id", "first_name", "last_name"],
      },
    ],
    order: [["due_date", "ASC"]],
  });
  return NextResponse.json({ assignments });
}

// POST /api/assignments (Teacher or Admin)
async function createAssignment(req) {
  const currentUser = req.user;
  const body = await req.json();

  if (!["SUPER_ADMIN", "BRANCH_ADMIN", "TEACHER"].includes(currentUser.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let {
    branch_id,
    academic_year_id,
    class_id,
    section_id,
    subject_id,
    title,
    description,
    attachment_url,
    attachment_public_id,
    due_date,
    total_marks,
  } = body;

  if (!class_id || !section_id || !subject_id || !title || !due_date) {
    return NextResponse.json(
      { error: "Missing required fields" },
      { status: 400 },
    );
  }

  if (currentUser.role === "TEACHER") {
    // Optionally verify teacher owns this subject/class? We'll trust for simplicity.
    branch_id = currentUser.branch_id;
  } else if (currentUser.role === "BRANCH_ADMIN") {
    if (branch_id && branch_id !== currentUser.branch_id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    branch_id = currentUser.branch_id;
  }

  const assignment = await Assignment.create({
    branch_id,
    academic_year_id: academic_year_id || null,
    class_id,
    section_id,
    subject_id,
    teacher_id:
      currentUser.role === "TEACHER"
        ? currentUser.id
        : body.teacher_id || currentUser.id,
    title,
    description,
    attachment_url,
    attachment_public_id,
    due_date,
    total_marks: total_marks || 0,
    created_by: currentUser.id,
  });
  return NextResponse.json({ success: true, assignment }, { status: 201 });
}

export const GET = withAuth(listAssignments, [
  "SUPER_ADMIN",
  "BRANCH_ADMIN",
  "TEACHER",
  "STUDENT",
]);
export const POST = withAuth(createAssignment, [
  "SUPER_ADMIN",
  "BRANCH_ADMIN",
  "TEACHER",
]);
