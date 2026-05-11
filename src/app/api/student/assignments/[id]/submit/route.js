import { NextResponse } from "next/server";
import { withAuth } from "@/backend/middleware/auth.middleware";
import { Assignment, AssignmentSubmission } from "@/backend/models/postgres";

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

async function submitStudentAssignment(req, { params }) {
  const student = req.user;
  const { id } = await params;

  const assignment = await Assignment.findByPk(id);
  if (!assignment) {
    return NextResponse.json({ success: false, error: "Assignment not found" }, { status: 404 });
  }

  if (!assignment.is_active) {
    return NextResponse.json({ success: false, error: "Assignment is inactive" }, { status: 400 });
  }

  const studentContext = getStudentContext(student);
  if (!canStudentAccessAssignment(studentContext, assignment)) {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const { submission_text, submission_url, submission_public_id } = body;

  if (!submission_text && !submission_url) {
    return NextResponse.json(
      { success: false, error: "Provide submission_text or submission_url" },
      { status: 400 },
    );
  }

  const now = new Date();
  const dueDate = new Date(assignment.due_date);
  const is_late = now > dueDate;

  const existingSubmission = await AssignmentSubmission.findOne({
    where: {
      assignment_id: assignment.id,
      student_id: student.id,
    },
  });

  if (existingSubmission) {
    if (existingSubmission.status === "graded") {
      return NextResponse.json(
        { success: false, error: "Graded submissions cannot be edited" },
        { status: 400 },
      );
    }

    existingSubmission.submission_text = submission_text || null;
    existingSubmission.submission_url = submission_url || null;
    existingSubmission.submission_public_id = submission_public_id || null;
    existingSubmission.submitted_at = now;
    existingSubmission.is_late = is_late;
    existingSubmission.status = "submitted";
    await existingSubmission.save();

    return NextResponse.json({
      success: true,
      message: "Submission updated successfully",
      data: existingSubmission,
    });
  }

  const createdSubmission = await AssignmentSubmission.create({
    assignment_id: assignment.id,
    student_id: student.id,
    submission_text: submission_text || null,
    submission_url: submission_url || null,
    submission_public_id: submission_public_id || null,
    submitted_at: now,
    is_late,
    status: "submitted",
  });

  return NextResponse.json(
    {
      success: true,
      message: "Assignment submitted successfully",
      data: createdSubmission,
    },
    { status: 201 },
  );
}

export const POST = withAuth(submitStudentAssignment, ["STUDENT"]);
