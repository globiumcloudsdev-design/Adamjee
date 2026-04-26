import { NextResponse } from "next/server";
import { Section, Class } from "@/backend/models/postgres";
import { getCurrentUser } from "@/lib/auth";

// --- PUT: Update Section ---
export async function PUT(req, { params }) {
  try {
    const user = await getCurrentUser(req);
    const bodyText = await req.text();
    console.log("Section PUT Request Body:", bodyText);

    let data;
    try {
      data = JSON.parse(bodyText);
    } catch (e) {
      return NextResponse.json({ error: "Invalid JSON format: " + e.message }, { status: 400 });
    }

    const { id } = await params;

    const section = await Section.findByPk(id, { include: ["class"] });
    if (!section)
      return NextResponse.json({ error: "Section not found" }, { status: 404 });

    // Authorization via parent Class branch_id
    if (
      user.role !== "SUPER_ADMIN" &&
      section.class.branch_id !== user.branch_id
    ) {
      return NextResponse.json({ error: "Access Denied" }, { status: 403 });
    }

    // Filter allowed fields
    const allowedFields = ["name", "capacity", "is_active", "class_id"];
    const updatePayload = {};
    allowedFields.forEach(field => {
      if (data[field] !== undefined) updatePayload[field] = data[field];
    });

    await section.update(updatePayload);
    return NextResponse.json({ message: "Section updated", section });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// --- DELETE: Delete Section ---
export async function DELETE(req, { params }) {
  try {
    const user = await getCurrentUser(req);
    const { id } = await params;

    const section = await Section.findByPk(id, { include: ["class"] });
    if (!section)
      return NextResponse.json({ error: "Section not found" }, { status: 404 });

    if (
      user.role !== "SUPER_ADMIN" &&
      section.class.branch_id !== user.branch_id
    ) {
      return NextResponse.json({ error: "Access Denied" }, { status: 403 });
    }

    await section.destroy();
    return NextResponse.json({ message: "Section deleted successfully" });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// --- GET: Single Section ---
export async function GET(req, { params }) {
  try {
    const user = await getCurrentUser(req);
    const { id } = await params;

    const section = await Section.findByPk(id, { include: ["class"] });
    if (!section)
      return NextResponse.json({ error: "Section not found" }, { status: 404 });

    if (
      user.role !== "SUPER_ADMIN" &&
      section.class.branch_id !== user.branch_id
    ) {
      return NextResponse.json({ error: "Access Denied" }, { status: 403 });
    }

    return NextResponse.json(section);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
