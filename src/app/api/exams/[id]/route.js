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

// GET /api/exams/:id
async function getExam(req, { params }) {
  const { id } = await params;
  try {
    const exam = await Exam.findByPk(id, {
      include: [
        { model: Branch, as: "branch", attributes: ["id", "name"] },
        { model: AcademicYear, as: "academicYear", attributes: ["id", "name"] },
        { model: Group, as: "group", attributes: ["id", "name"] },
        { model: Class, as: "class", attributes: ["id", "name"] },
        { model: Section, as: "section", attributes: ["id", "name"] },
      ],
    });
    if (!exam)
      return NextResponse.json({ error: "Exam not found" }, { status: 404 });

    // Bulk-fetch subject names from DB using subject_ids in JSONB
    const plain = exam.toJSON();
    const subjectIds = (plain.subjects || [])
      .map((s) => s.subject_id)
      .filter(Boolean);

    const subjectRecords = subjectIds.length
      ? await Subject.findAll({
          where: { id: subjectIds },
          attributes: ["id", "name"],
        })
      : [];
    const subjectMap = {};
    subjectRecords.forEach((s) => { subjectMap[s.id] = s.name; });

    plain.subjects = (plain.subjects || []).map((s) => ({
      ...s,
      subject_name: subjectMap[s.subject_id] || s.subject_name || "Unknown Subject",
    }));

    return NextResponse.json({ success: true, data: plain });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
}

// PUT /api/exams/:id
async function updateExam(req, { params }) {
  const { id } = await params;
  const currentUser = req.user;
  try {
    const exam = await Exam.findByPk(id);
    if (!exam)
      return NextResponse.json({ error: "Exam not found" }, { status: 404 });

    // Authorization
    if (
      currentUser.role === "BRANCH_ADMIN" &&
      currentUser.branch_id !== exam.branch_id
    ) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const body = await req.json();
    await exam.update({
      ...body,
      updated_by: currentUser.id,
    });

    return NextResponse.json({
      success: true,
      message: "Exam updated successfully",
      data: exam,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
}

// DELETE /api/exams/:id
async function deleteExam(req, { params }) {
  const { id } = await params;
  const currentUser = req.user;
  try {
    const exam = await Exam.findByPk(id);
    if (!exam)
      return NextResponse.json({ error: "Exam not found" }, { status: 404 });

    // Authorization
    if (
      currentUser.role === "BRANCH_ADMIN" &&
      currentUser.branch_id !== exam.branch_id
    ) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    await exam.destroy();
    return NextResponse.json({
      success: true,
      message: "Exam deleted successfully",
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
}

export const GET = withAuth(getExam, ["SUPER_ADMIN", "BRANCH_ADMIN"]);
export const PUT = withAuth(updateExam, ["SUPER_ADMIN", "BRANCH_ADMIN"]);
export const DELETE = withAuth(deleteExam, ["SUPER_ADMIN", "BRANCH_ADMIN"]);
