import { NextResponse } from "next/server";
import { withAuth } from "@/backend/middleware/auth.middleware";
import {
  Assignment,
  Branch,
  Class,
  Section,
  Subject,
  User,
  sequelize
} from "@/backend/models/postgres";
import { Op } from "sequelize";

// GET /api/assignments?branch_id=&class_id=&section_id=&subject_id=&teacher_id=
async function listAssignments(req) {
  const currentUser = req.user;
  const { searchParams } = new URL(req.url);
  let branch_id = searchParams.get("branch_id");
  const class_id = searchParams.get("class_id");
  const section_id = searchParams.get("section_id");
  const subject_id = searchParams.get("subject_id");
  const teacher_id = searchParams.get("teacher_id");

  let where = {};
  if (currentUser.role === "BRANCH_ADMIN") {
    where.branch_id = currentUser.branch_id;
  } else if (currentUser.role === "STUDENT") {
    where.branch_id = currentUser.branch_id;
    // Auto-filter by student's class and section
    const academicInfo = currentUser.details?.academic_info || {};
    if (academicInfo.class_id) where.class_id = academicInfo.class_id;
    if (academicInfo.section_id) where.section_id = academicInfo.section_id;
    where.is_active = true; // Students only see active assignments
  } else if (branch_id) {
    where.branch_id = branch_id;
  }
  
  if (class_id) where.class_id = class_id;
  if (section_id) where.section_id = section_id;
  if (subject_id) where.subject_id = subject_id;
  if (teacher_id) where.teacher_id = teacher_id;
  else if (currentUser.role === "TEACHER") where.teacher_id = currentUser.id;

  const assignments = await Assignment.findAll({
    where,
    attributes: {
      include: [
        [
          sequelize.literal(`(SELECT COUNT(*) FROM assignment_submissions WHERE assignment_id = "Assignment".id)`),
          "submission_count"
        ],
        [
          sequelize.literal(`(SELECT COUNT(*) FROM users WHERE role = 'STUDENT' AND branch_id = "Assignment".branch_id AND (details->'academic_info'->>'class_id')::text = "Assignment".class_id::text AND (details->'academic_info'->>'section_id')::text = "Assignment".section_id::text)`),
          "total_students"
        ]
      ]
    },
    include: [
      { model: Branch, as: "branch", attributes: ["id", "name"] },
      { model: Class, as: "class", attributes: ["id", "name", "group_id"] },
      { model: Section, as: "section", attributes: ["id", "name"] },
      { model: Subject, as: "subject", attributes: ["id", "name"] },
      {
        model: User,
        as: "teacher",
        attributes: ["id", "first_name", "last_name"],
      },
    ],
    order: [["due_date", "ASC"]],
  });

  // Explicitly map to ensure the virtual fields are included in the JSON response
  let mappedAssignments = assignments.map(a => {
    const data = a.get({ plain: true });
    return {
      ...data,
      submission_count: parseInt(a.getDataValue("submission_count") || 0),
      total_students: parseInt(a.getDataValue("total_students") || 0)
    };
  });

  // Apply enrollment-based filtering for STUDENT role
  if (currentUser.role === "STUDENT") {
    const academicInfo = currentUser.details?.academic_info || {};
    const enrolledSubjectIds = academicInfo.subjects?.map(s => s.id) || [];
    
    // Only show assignments for subjects the student is enrolled in
    mappedAssignments = mappedAssignments.filter(assignment => 
      enrolledSubjectIds.includes(assignment.subject_id)
    );
  }

  return NextResponse.json({ success: true, data: mappedAssignments });
}

// POST /api/assignments (Teacher or Admin)
async function createAssignment(req) {
  const currentUser = req.user;
  const body = await req.json();

  if (!["SUPER_ADMIN", "BRANCH_ADMIN", "TEACHER"].includes(currentUser.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let {
    branch_id,
    academic_year_id,
    class_id,
    section_id,
    subject_id,
    title,
    description,
    attachment_url,
    attachment_public_id,
    due_date,
    total_marks,
    is_active,
  } = body;

  if (!class_id || !section_id || !subject_id || !title || !due_date) {
    return NextResponse.json(
      { error: "Missing required fields" },
      { status: 400 },
    );
  }

  if (currentUser.role === "TEACHER") {
    // Optionally verify teacher owns this subject/class? We'll trust for simplicity.
    branch_id = currentUser.branch_id;
  } else if (currentUser.role === "BRANCH_ADMIN") {
    if (branch_id && branch_id !== currentUser.branch_id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    branch_id = currentUser.branch_id;
  }

  const assignment = await Assignment.create({
    branch_id,
    academic_year_id: academic_year_id || null,
    class_id,
    section_id,
    subject_id,
    teacher_id:
      currentUser.role === "TEACHER"
        ? currentUser.id
        : body.teacher_id || currentUser.id,
    title,
    description,
    attachment_url,
    attachment_public_id,
    due_date,
    total_marks: total_marks || 0,
    is_active: is_active !== undefined ? is_active : true,
    created_by: currentUser.id,
  });
  return NextResponse.json({ success: true, assignment }, { status: 201 });
}

export const GET = withAuth(listAssignments, [
  "SUPER_ADMIN",
  "BRANCH_ADMIN",
  "TEACHER",
  "STUDENT",
]);
export const POST = withAuth(createAssignment, [
  "SUPER_ADMIN",
  "BRANCH_ADMIN",
]);
