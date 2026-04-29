import { NextResponse } from "next/server";
import { withAuth } from "@/backend/middleware/auth.middleware";
import {
  Timetable,
  Class,
  Section,
  Subject,
  User,
  Branch,
  AcademicYear,
} from "@/backend/models/postgres";
import { Op } from "sequelize";

// Ensure table exists (temporary fix for migration DNS issues)
let tableSynced = false;
async function ensureTableSynced() {
  if (!tableSynced) {
    try {
      console.log("Auto-syncing Timetable model...");
      await Timetable.sync({ alter: true });
      tableSynced = true;
      console.log("Timetable table synced successfully");
    } catch (e) {
      console.error("Timetable table sync failed:", e);
    }
  }
}

// GET /api/timetable
async function listTimetable(req) {
  await ensureTableSynced();
  const currentUser = req.user;
  const { searchParams } = new URL(req.url);
  const branch_id = searchParams.get("branch_id");
  const class_id = searchParams.get("class_id");
  const section_id = searchParams.get("section_id");
  const academic_year_id = searchParams.get("academic_year_id");
  const teacher_id = searchParams.get("teacher_id");

  let where = {};

  if (currentUser.role === "BRANCH_ADMIN") {
    where.branch_id = currentUser.branch_id;
  } else if (branch_id) {
    where.branch_id = branch_id;
  }

  if (class_id) where.class_id = class_id;
  if (section_id) where.section_id = section_id;
  if (academic_year_id) where.academic_year_id = academic_year_id;

  if (teacher_id) {
    where.periods = {
      [Op.contains]: [{ teacherId: teacher_id }],
    };
  }

  const entries = await Timetable.findAll({
    where,
    include: [
      { model: Branch, as: "branch", attributes: ["id", "name"] },
      { model: AcademicYear, as: "academicYear", attributes: ["id", "name"] },
      { model: Class, as: "class", attributes: ["id", "name"] },
      { model: Section, as: "section", attributes: ["id", "name"] },
    ],
    order: [["created_at", "DESC"]],
  });

  // Each entry already has 'periods' as JSONB
  return NextResponse.json({
    success: true,
    timetable: entries,
    data: entries,
  });
}

// POST /api/timetable (Create/Update)
async function createTimetable(req) {
  await ensureTableSynced();
  const currentUser = req.user;
  if (currentUser.role !== "BRANCH_ADMIN") {
    return NextResponse.json(
      { error: "Only branch admin can create timetable" },
      { status: 403 },
    );
  }

  const body = await req.json();
  const branch_id = currentUser.branch_id;

  const { academic_year_id, class_id, section_id, periods } = body;

  if (!class_id || !section_id || !periods || !Array.isArray(periods)) {
    return NextResponse.json(
      { error: "Class, Section and Periods (array) are required" },
      { status: 400 },
    );
  }

  // Use upsert-like logic: Find if a record exists for this combination
  try {
    const [timetable, created] = await Timetable.findOrCreate({
      where: {
        branch_id,
        class_id,
        section_id,
        academic_year_id: academic_year_id || null,
      },
      defaults: {
        periods,
        created_by: currentUser.id,
      },
    });

    if (!created) {
      // Update existing record
      await timetable.update({
        periods,
        updated_by: currentUser.id,
      });
    }

    return NextResponse.json(
      {
        success: true,
        message: created ? "Timetable created" : "Timetable updated",
        timetable,
      },
      { status: created ? 201 : 200 },
    );
  } catch (error) {
    console.error("Timetable save error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export const GET = withAuth(listTimetable, ["SUPER_ADMIN", "BRANCH_ADMIN"]);
export const POST = withAuth(createTimetable, ["BRANCH_ADMIN"]); // only branch admin
