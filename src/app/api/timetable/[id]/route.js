import { NextResponse } from "next/server";
import { withAuth } from "@/backend/middleware/auth.middleware";
import { Timetable } from "@/backend/models/postgres";

async function getOne(req, { params }) {
  const { id } = await params;
  const currentUser = req.user;
  const entry = await Timetable.findByPk(id);
  if (!entry) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (
    currentUser.role === "BRANCH_ADMIN" &&
    entry.branch_id !== currentUser.branch_id
  ) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  return NextResponse.json({ success: true, timetable_entry: entry });
}

async function updateEntry(req, { params }) {
  const { id } = await params;
  if (!entry) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (entry.branch_id !== currentUser.branch_id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const { periods, academic_year_id, class_id, section_id } = body;

  if (periods) entry.periods = periods;
  if (academic_year_id) entry.academic_year_id = academic_year_id;
  if (class_id) entry.class_id = class_id;
  if (section_id) entry.section_id = section_id;

  entry.updated_by = currentUser.id;
  await entry.save();
  return NextResponse.json({ success: true, timetable: entry });
}

async function deleteEntry(req, { params }) {
  const { id } = await params;
  if (!entry) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (entry.branch_id !== currentUser.branch_id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  await entry.destroy();
  return NextResponse.json({ success: true });
}

export const GET = withAuth(getOne, ["SUPER_ADMIN", "BRANCH_ADMIN"]);
export const PUT = withAuth(updateEntry, ["BRANCH_ADMIN"]);
export const DELETE = withAuth(deleteEntry, ["BRANCH_ADMIN"]);
