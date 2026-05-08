import { NextResponse } from "next/server";
import { withAuth } from "@/backend/middleware/auth.middleware.js";
import { Exam, ExamMark, sequelize } from "@/backend/models/postgres";
import NotificationService from "@/backend/services/NotificationService";

// Ensure table exists
let tableSynced = false;
async function ensureTableSynced() {
  if (!tableSynced) {
    try {
      await ExamMark.sync({ alter: true });
      tableSynced = true;
    } catch (e) {
      console.error("ExamMark table sync failed:", e);
    }
  }
}

// POST /api/exams/:id/marks
async function saveExamMarks(req, { params }) {
  await ensureTableSynced();
  const { id } = await params;
  const currentUser = req.user;

  try {
    const exam = await Exam.findByPk(id);
    if (!exam) {
      return NextResponse.json({ error: "Exam not found" }, { status: 404 });
    }

    // Authorization
    if (
      (currentUser.role === "BRANCH_ADMIN" || currentUser.role === "TEACHER") &&
      currentUser.branch_id !== exam.branch_id
    ) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { marks } = await req.json(); // Array: [{ student_id, subject_id, marks_obtained, is_absent, remarks }]

    if (!marks || !Array.isArray(marks)) {
      return NextResponse.json(
        { error: "Marks array is required" },
        { status: 400 },
      );
    }

    // Batch create or update marks
    // We use a transaction for safety
    await sequelize.transaction(async (t) => {
      for (const markData of marks) {
        const { student_id, subject_id, marks_obtained, is_absent, remarks } =
          markData;

        // Upsert logic
        const [mark, created] = await ExamMark.findOrCreate({
          where: {
            exam_id: id,
            student_id,
            subject_id,
          },
          defaults: {
            marks_obtained,
            is_absent,
            remarks,
            created_by: currentUser.id,
          },
          transaction: t,
        });

        if (!created) {
          await mark.update(
            {
              marks_obtained,
              is_absent,
              remarks,
              updated_by: currentUser.id,
            },
            { transaction: t },
          );
        }
      }
    });

    // Send notifications asynchronously
    (async () => {
      try {
        // Collect unique student IDs to avoid duplicate notifications
        const uniqueStudentIds = [...new Set(marks.map(m => m.student_id))];
        for (const studentId of uniqueStudentIds) {
          await NotificationService.sendToUsers([studentId], {
            title: "Exam Results Published",
            message: `Marks for the exam "${exam.title}" have been updated. Please check your dashboard for details.`,
            type: "exam_result",
            branchId: exam.branch_id,
            sentBy: currentUser.id,
          });
        }
      } catch (err) {
        console.error("Exam Marks Notification Error:", err);
      }
    })();

    return NextResponse.json({
      success: true,
      message: "Marks saved successfully",
    });
  } catch (error) {
    console.error("Save exam marks error:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
}

// GET /api/exams/:id/marks
async function getExamMarks(req, { params }) {
  await ensureTableSynced();
  const { id } = await params;
  const { searchParams } = new URL(req.url);
  const student_id = searchParams.get("student_id");

  let where = { exam_id: id };
  if (student_id) where.student_id = student_id;

  try {
    const marks = await ExamMark.findAll({ where });
    return NextResponse.json({
      success: true,
      data: marks,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
}

export const POST = withAuth(saveExamMarks, [
  "SUPER_ADMIN",
  "BRANCH_ADMIN",
  "TEACHER",
]);
export const GET = withAuth(getExamMarks, [
  "SUPER_ADMIN",
  "BRANCH_ADMIN",
  "TEACHER",
]);
