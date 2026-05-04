import { NextResponse } from "next/server";
import { withAuth } from "@/backend/middleware/auth.middleware";
import { Assignment, AssignmentSubmission } from "@/backend/models/postgres";
import sequelize from "@/backend/config/database";

async function submitAssignment(req, { params }) {
  const currentUser = req.user;
  if (currentUser.role !== "STUDENT") {
    return NextResponse.json(
      { error: "Only students can submit" },
      { status: 403 },
    );
  }
  const { id } = await params;
  const assignment = await Assignment.findByPk(id);
  if (!assignment)
    return NextResponse.json(
      { error: "Assignment not found" },
      { status: 404 },
    );
  const body = await req.json();
  const { submission_text, submission_url, submission_public_id } = body;
  if (!submission_text && !submission_url) {
    return NextResponse.json(
      { error: "Provide text or file URL" },
      { status: 400 },
    );
  }

  const existing = await AssignmentSubmission.findOne({
    where: { assignment_id: id, student_id: currentUser.id },
  });
  if (existing) {
    return NextResponse.json({ error: "Already submitted" }, { status: 400 });
  }

  const now = new Date();
  const dueDate = new Date(assignment.due_date);
  const is_late = now > dueDate;

  const submission = await AssignmentSubmission.create({
    assignment_id: id,
    student_id: currentUser.id,
    submission_text,
    submission_url,
    submission_public_id,
    submitted_at: now,
    is_late,
    status: "submitted",
  });
  return NextResponse.json({ success: true, submission }, { status: 201 });
}

export const POST = withAuth(submitAssignment, ["STUDENT"]);
