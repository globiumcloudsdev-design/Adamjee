import { NextResponse } from "next/server";
import { withAuth } from "@/backend/middleware/auth.middleware";
import { AssignmentSubmission, Assignment, User } from "@/backend/models/postgres";

async function getSubmission(req, { params }) {
  const { id } = await params;
  const submission = await AssignmentSubmission.findByPk(id, {
    include: [
      { model: Assignment, as: "assignment" },
      {
        model: User,
        as: "student",
        attributes: ["id", "first_name", "last_name"],
      },
    ],
  });
  if (!submission)
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ submission });
}

async function gradeSubmission(req, { params }) {
  const currentUser = req.user;
  const { id } = await params;
  if (!["SUPER_ADMIN", "BRANCH_ADMIN", "TEACHER"].includes(currentUser.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const submission = await AssignmentSubmission.findByPk(id);
  if (!submission)
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  const assignment = await Assignment.findByPk(submission.assignment_id);
  if (!assignment)
    return NextResponse.json(
      { error: "Assignment not found" },
      { status: 404 },
    );
  if (
    currentUser.role === "TEACHER" &&
    assignment.teacher_id !== currentUser.id
  ) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  if (
    currentUser.role === "BRANCH_ADMIN" &&
    assignment.branch_id !== currentUser.branch_id
  ) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { obtained_marks, feedback } = await req.json();
  if (obtained_marks === undefined) {
    return NextResponse.json(
      { error: "obtained_marks required" },
      { status: 400 },
    );
  }
  submission.obtained_marks = obtained_marks;
  submission.feedback = feedback || null;
  submission.graded_by = currentUser.id;
  submission.graded_at = new Date();
  submission.status = "graded";
  await submission.save();
  return NextResponse.json({ success: true, submission });
}

export const GET = withAuth(getSubmission, [
  "SUPER_ADMIN",
  "BRANCH_ADMIN",
  "TEACHER",
  "STUDENT",
]);
export const PUT = withAuth(gradeSubmission, [
  "SUPER_ADMIN",
  "BRANCH_ADMIN",
  "TEACHER",
]);
