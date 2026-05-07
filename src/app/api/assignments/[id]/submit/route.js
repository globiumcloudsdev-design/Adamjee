import { NextResponse } from "next/server";
import { withAuth } from "@/backend/middleware/auth.middleware";
import { Assignment, AssignmentSubmission } from "@/backend/models/postgres";
import sequelize from "@/backend/config/database";

async function submitAssignment(req, { params }) {
  let stage = "start";
  try {
    const currentUser = req.user;
    if (currentUser.role !== "STUDENT") {
      return NextResponse.json(
        { error: "Only students can submit" },
        { status: 403 },
      );
    }

    const resolvedParams = params ? await params : {};
    const id = resolvedParams?.id;
    if (!id) {
      return NextResponse.json({ error: "Assignment id is required" }, { status: 400 });
    }

    stage = "assignment-lookup";
    const assignment = await Assignment.findByPk(id);
    if (!assignment) {
      return NextResponse.json(
        { error: "Assignment not found" },
        { status: 404 },
      );
    }

    // Enrollment-based access control
    stage = "enrollment-validation";
    const academicInfo = currentUser.details?.academic_info || {};
    const enrolledSubjectIds = academicInfo.subjects?.map(s => s.id) || [];
    
    // Student can only submit if:
    // 1. They are in the same branch
    // 2. They are in the same class
    // 3. They are in the same section
    // 4. They are enrolled in the assignment's subject
    const isEnrolledInSubject = enrolledSubjectIds.includes(assignment.subject_id);
    const isInCorrectClass = academicInfo.class_id === assignment.class_id;
    const isInCorrectSection = academicInfo.section_id === assignment.section_id;
    const isInCorrectBranch = currentUser.branch_id === assignment.branch_id;
    
    if (!isEnrolledInSubject || !isInCorrectClass || !isInCorrectSection || !isInCorrectBranch) {
      return NextResponse.json(
        { error: "You are not enrolled in this assignment's subject/class/section" },
        { status: 403 },
      );
    }

    const body = await req.json();
    const { submission_text, submission_url, submission_public_id } = body;
    if (!submission_text && !submission_url) {
      return NextResponse.json(
        { error: "Provide text or file URL" },
        { status: 400 },
      );
    }

    stage = "duplicate-check";
    const existing = await AssignmentSubmission.findOne({
      where: { assignment_id: id, student_id: currentUser.id },
    });
    if (existing) {
      return NextResponse.json({ error: "Already submitted" }, { status: 400 });
    }

    stage = "create-submission";
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
  } catch (error) {
    console.error(`Submit assignment error [stage=${stage}]`, error);
    return NextResponse.json(
      { error: `${stage}: ${error.message || "Internal server error"}` },
      { status: 500 },
    );
  }
}

export const POST = withAuth(submitAssignment, ["STUDENT"]);
