import { NextResponse } from "next/server";
import { withAuth } from "@/backend/middleware/auth.middleware";
import { Assignment } from "@/backend/models/postgres";

async function getAssignment(req, { params }) {
  const { id } = await params;
  const assignment = await Assignment.findByPk(id);
  if (!assignment)
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ assignment });
}

async function updateAssignment(req, { params }) {
  const currentUser = req.user;
  const { id } = await params;
  if (!["SUPER_ADMIN", "BRANCH_ADMIN", "TEACHER"].includes(currentUser.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const assignment = await Assignment.findByPk(id);
  if (!assignment)
    return NextResponse.json({ error: "Not found" }, { status: 404 });
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
  const body = await req.json();
  const allowed = [
    "title",
    "description",
    "attachment_url",
    "attachment_public_id",
    "due_date",
    "total_marks",
    "is_active",
  ];
  allowed.forEach((f) => {
    if (body[f] !== undefined) assignment[f] = body[f];
  });
  assignment.updated_by = currentUser.id;
  await assignment.save();
  return NextResponse.json({ success: true, assignment });
}

async function deleteAssignment(req, { params }) {
  const currentUser = req.user;
  const { id } = await params;
  if (!["SUPER_ADMIN", "BRANCH_ADMIN", "TEACHER"].includes(currentUser.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const assignment = await Assignment.findByPk(id);
  if (!assignment)
    return NextResponse.json({ error: "Not found" }, { status: 404 });
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
  await assignment.destroy();
  return NextResponse.json({ success: true });
}

export const GET = withAuth(getAssignment, [
  "SUPER_ADMIN",
  "BRANCH_ADMIN",
  "TEACHER",
  "STUDENT",
]);
export const PUT = withAuth(updateAssignment, [
  "SUPER_ADMIN",
  "BRANCH_ADMIN",
  "TEACHER",
]);
export const DELETE = withAuth(deleteAssignment, [
  "SUPER_ADMIN",
  "BRANCH_ADMIN",
  "TEACHER",
]);
