import { NextResponse } from "next/server";
import { withAuth } from "@/backend/middleware/auth.middleware";
import { AssignmentSubmission, Assignment, User } from "@/backend/models/postgres";
import { Op } from "sequelize";

async function listSubmissions(req) {
  const currentUser = req.user;
  const { searchParams } = new URL(req.url);
  const assignment_id = searchParams.get("assignment_id");
  const student_id = searchParams.get("student_id");

  let where = {};
  if (assignment_id) where.assignment_id = assignment_id;
  if (student_id) where.student_id = student_id;

  // Teachers can see only submissions for their own assignments
  if (currentUser.role === "TEACHER") {
    const assignments = await Assignment.findAll({ where: { teacher_id: currentUser.id }, attributes: ["id"] });
    const assignmentIds = assignments.map(a => a.id);
    if (assignment_id) {
      if (!assignmentIds.includes(assignment_id)) {
        return NextResponse.json({ submissions: [] });
      }
      where.assignment_id = assignment_id;
    } else {
      where.assignment_id = { [Op.in]: assignmentIds };
    }
  } else if (currentUser.role === "BRANCH_ADMIN") {
    // Branch admin sees submissions of his branch: need join with Assignment
    // We'll handle via includes
  } else if (currentUser.role === "STUDENT") {
    where.student_id = currentUser.id;
  }

  const submissions = await AssignmentSubmission.findAll({
    where,
    include: [
      { model: Assignment, as: "assignment", include: ["class", "section", "subject"] },
      { model: User, as: "student", attributes: ["id", "first_name", "last_name", "registration_no"] },
    ],
    order: [["submitted_at", "DESC"]],
  });

  // Branch admin filter
  let filtered = submissions;
  if (currentUser.role === "BRANCH_ADMIN") {
    filtered = submissions.filter(s => s.assignment?.branch_id === currentUser.branch_id);
  }
  return NextResponse.json({ submissions: filtered });
}

export const GET = withAuth(listSubmissions, ["SUPER_ADMIN", "BRANCH_ADMIN", "TEACHER", "STUDENT"]);