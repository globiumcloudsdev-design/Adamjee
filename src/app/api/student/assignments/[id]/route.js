import { NextResponse } from "next/server";
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

function canStudentAccessAssignment(studentContext, assignment) {
  const sameBranch = studentContext.branchId === assignment.branch_id;
  const sameClass = studentContext.classId === assignment.class_id;
  const sameSection = studentContext.sectionId === assignment.section_id;
  const subjectAllowed =
    studentContext.enrolledSubjectIds.length === 0 ||
    studentContext.enrolledSubjectIds.includes(assignment.subject_id);

  return sameBranch && sameClass && sameSection && subjectAllowed;
}

async function getStudentAssignment(req, { params }) {
  const student = req.user;
  const { id } = await params;

  const assignment = await Assignment.findByPk(id, {
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

  if (!assignment) {
    return NextResponse.json({ success: false, error: "Assignment not found" }, { status: 404 });
  }

  if (!assignment.is_active) {
    return NextResponse.json({ success: false, error: "Assignment is inactive" }, { status: 404 });
  }

  const studentContext = getStudentContext(student);
  if (!canStudentAccessAssignment(studentContext, assignment)) {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }

  const submission = await AssignmentSubmission.findOne({
    where: {
      assignment_id: assignment.id,
      student_id: student.id,
    },
  });

  return NextResponse.json({
    success: true,
    data: {
      ...assignment.toJSON(),
      submission: submission ? submission.toJSON() : null,
    },
  });
}

export const GET = withAuth(getStudentAssignment, ["STUDENT"]);
