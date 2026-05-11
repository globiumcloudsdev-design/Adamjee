import { NextResponse } from "next/server";
import { withAuth } from "@/backend/middleware/auth.middleware";
import { AssignmentSubmission, Assignment, Subject, Class, Section, User } from "@/backend/models/postgres";

async function listStudentSubmissions(req) {
  const student = req.user;
  const { searchParams } = new URL(req.url);
  const assignmentId = searchParams.get("assignment_id");
  const status = searchParams.get("status");

  const where = { student_id: student.id };
  if (assignmentId) where.assignment_id = assignmentId;
  if (status) where.status = status;

  const submissions = await AssignmentSubmission.findAll({
    where,
    include: [
      {
        model: Assignment,
        as: "assignment",
        include: [
          { model: Subject, as: "subject", attributes: ["id", "name"] },
          { model: Class, as: "class", attributes: ["id", "name"] },
          { model: Section, as: "section", attributes: ["id", "name"] },
          {
            model: User,
            as: "teacher",
            attributes: ["id", "first_name", "last_name", "email"],
          },
        ],
      },
    ],
    order: [["submitted_at", "DESC"]],
  });

  return NextResponse.json({
    success: true,
    data: submissions,
  });
}

export const GET = withAuth(listStudentSubmissions, ["STUDENT"]);
