import { NextResponse } from "next/server";
import { withAuth } from "@/backend/middleware/auth.middleware";
import { 
  Assignment, 
  Branch, 
  Class, 
  Section, 
  Subject, 
  User, 
  AssignmentSubmission,
  sequelize 
} from "@/backend/models/postgres";
import { Op } from "sequelize";

async function getAssignment(req, { params }) {
  try {
    const { id } = await params;
    const currentUser = req.user;
    
    const assignment = await Assignment.findByPk(id, {
      include: [
        { model: Branch, as: "branch", attributes: ["id", "name"] },
        { model: Class, as: "class", attributes: ["id", "name"] },
        { model: Section, as: "section", attributes: ["id", "name"] },
        { model: Subject, as: "subject", attributes: ["id", "name"] },
      ]
    });

    if (!assignment)
      return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });

    // Enrollment-based access control for STUDENT role
    if (currentUser.role === "STUDENT") {
      const academicInfo = currentUser.details?.academic_info || {};
      const enrolledSubjectIds = academicInfo.subjects?.map(s => s.id) || [];
      
      // Student can only view assignment if:
      // 1. They are in the same branch
      // 2. They are in the same class
      // 3. They are in the same section
      // 4. They are enrolled in the assignment's subject
      const isEnrolledInSubject = enrolledSubjectIds.includes(assignment.subject_id);
      const isInCorrectClass = academicInfo.class_id === assignment.class_id;
      const isInCorrectSection = academicInfo.section_id === assignment.section_id;
      const isInCorrectBranch = currentUser.branch_id === assignment.branch_id;
      
      if (!isEnrolledInSubject || !isInCorrectClass || !isInCorrectSection || !isInCorrectBranch) {
        return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
      }
    }

    // Fetch all students in this class/section for the roster
    const rosterStudents = await User.findAll({
      where: {
        role: "STUDENT",
        branch_id: assignment.branch_id,
        [Op.and]: [
          sequelize.literal(`details->'academic_info'->>'class_id' = '${assignment.class_id}'`),
          sequelize.literal(`details->'academic_info'->>'section_id' = '${assignment.section_id}'`)
        ]
      },
      attributes: ["id", "first_name", "last_name", "details"],
    });

    // Fetch submissions for this assignment
    const submissions = await AssignmentSubmission.findAll({
      where: { assignment_id: id },
      include: [
        { model: User, as: "student", attributes: ["id", "first_name", "last_name", "details"] }
      ]
    });

    // Create a map of all students who should be in the list
    const studentMap = new Map();

    // Add roster students first (Default to Missing)
    rosterStudents.forEach(s => {
      const sid = String(s.id);
      studentMap.set(sid, {
        _id: sid,
        fullName: `${s.first_name} ${s.last_name}`,
        rollNumber: s.details?.academic_info?.roll_no || s.details?.roll_no,
        profilePhoto: s.details?.profile_photo,
        submitted: false,
        submission: null
      });
    });

    // Add or update with submission data
    submissions.forEach(s => {
      const sid = String(s.student_id);
      const student = s.student;
      
      // If student is in roster, update their status. If not, add them as "extra" submission.
      studentMap.set(sid, {
        _id: sid,
        fullName: student ? `${student.first_name} ${student.last_name}` : "Unknown Student",
        rollNumber: student?.details?.academic_info?.roll_no || student?.details?.roll_no,
        profilePhoto: student?.details?.profile_photo,
        submitted: true,
        submission: {
          submittedAt: s.submitted_at,
          status: s.status,
          obtainedMarks: s.obtained_marks,
          feedback: s.feedback
        }
      });
    });

    const studentStats = Array.from(studentMap.values());
    console.log(`[DEBUG] Assignment ${id}: Found ${rosterStudents.length} roster students and ${submissions.length} submissions. Merged into ${studentStats.length} entries.`);

    const data = {
      ...assignment.toJSON(),
      classId: assignment.class, 
      subjectId: assignment.subject,
      studentStats,
      submissionCount: submissions.length,
      totalStudents: rosterStudents.length
    };

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("Get Assignment Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

async function updateAssignment(req, { params }) {
  const currentUser = req.user;
  const { id } = await params;
  if (!["SUPER_ADMIN", "BRANCH_ADMIN"].includes(currentUser.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const assignment = await Assignment.findByPk(id);
  if (!assignment)
    return NextResponse.json({ error: "Not found" }, { status: 404 });
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
    "class_id",
    "section_id",
    "subject_id",
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
  if (!["SUPER_ADMIN", "BRANCH_ADMIN"].includes(currentUser.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const assignment = await Assignment.findByPk(id);
  if (!assignment)
    return NextResponse.json({ error: "Not found" }, { status: 404 });
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
]);
export const DELETE = withAuth(deleteAssignment, [
  "SUPER_ADMIN",
  "BRANCH_ADMIN",
]);
