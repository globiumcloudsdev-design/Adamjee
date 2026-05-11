import { NextResponse } from "next/server";
import { Op } from "sequelize";
import { withAuth } from "@/backend/middleware/auth.middleware";
import {
  Assignment,
  AssignmentSubmission,
  Class,
  Section,
  Subject,
  User,
} from "@/backend/models/postgres";

function getStudentContext(user) {
  const academicInfo = user.details?.academic_info || {};
  const enrolledSubjectIds = (academicInfo.subjects || [])
    .map((subject) => subject?.id)
    .filter(Boolean);

  return {
    branchId: user.branch_id,
    classId: academicInfo.class_id || null,
    sectionId: academicInfo.section_id || null,
    enrolledSubjectIds,
  };
}

async function listStudentAssignments(req) {
  const student = req.user;
  const { searchParams } = new URL(req.url);

  const page = Math.max(parseInt(searchParams.get("page") || "1", 10), 1);
  const limit = Math.min(
    Math.max(parseInt(searchParams.get("limit") || "20", 10), 1),
    100,
  );
  const offset = (page - 1) * limit;
  const status = (searchParams.get("status") || "").toLowerCase();
  const subjectId = searchParams.get("subject_id");

  const studentContext = getStudentContext(student);
  if (!studentContext.classId || !studentContext.sectionId) {
    return NextResponse.json(
      {
        success: true,
        data: {
          assignments: [],
          pagination: { page, limit, total: 0, pages: 0 },
        },
      },
      { status: 200 },
    );
  }

  const where = {
    branch_id: studentContext.branchId,
    class_id: studentContext.classId,
    section_id: studentContext.sectionId,
    is_active: true,
  };

  if (subjectId) {
    where.subject_id = subjectId;
  } else if (studentContext.enrolledSubjectIds.length > 0) {
    where.subject_id = { [Op.in]: studentContext.enrolledSubjectIds };
  }

  const { rows, count } = await Assignment.findAndCountAll({
    where,
    limit,
    offset,
    order: [["due_date", "ASC"]],
    include: [
      { model: Class, as: "class", attributes: ["id", "name"] },
      { model: Section, as: "section", attributes: ["id", "name"] },
      { model: Subject, as: "subject", attributes: ["id", "name"] },
      {
        model: User,
        as: "teacher",
        attributes: ["id", "first_name", "last_name", "email"],
      },
    ],
  });

  const assignmentIds = rows.map((assignment) => assignment.id);
  const submissions = assignmentIds.length
    ? await AssignmentSubmission.findAll({
        where: {
          assignment_id: { [Op.in]: assignmentIds },
          student_id: student.id,
        },
        attributes: [
          "id",
          "assignment_id",
          "submitted_at",
          "status",
          "obtained_marks",
          "is_late",
        ],
      })
    : [];

  const submissionMap = new Map(
    submissions.map((submission) => [submission.assignment_id, submission]),
  );

  const now = new Date();
  let assignments = rows.map((assignment) => {
    const data = assignment.toJSON();
    const submission = submissionMap.get(assignment.id) || null;
    const isOverdue = !submission && new Date(assignment.due_date) < now;

    return {
      ...data,
      submission: submission
        ? {
            id: submission.id,
            submitted_at: submission.submitted_at,
            status: submission.status,
            obtained_marks: submission.obtained_marks,
            is_late: submission.is_late,
          }
        : null,
      submission_status: submission
        ? "submitted"
        : isOverdue
          ? "overdue"
          : "pending",
    };
  });

  if (status === "submitted") {
    assignments = assignments.filter((assignment) => assignment.submission);
  } else if (status === "pending") {
    assignments = assignments.filter(
      (assignment) => !assignment.submission && new Date(assignment.due_date) >= now,
    );
  } else if (status === "overdue") {
    assignments = assignments.filter(
      (assignment) => !assignment.submission && new Date(assignment.due_date) < now,
    );
  }

  return NextResponse.json({
    success: true,
    data: {
      assignments,
      pagination: {
        page,
        limit,
        total: count,
        pages: Math.ceil(count / limit),
      },
    },
  });
}

export const GET = withAuth(listStudentAssignments, ["STUDENT"]);
