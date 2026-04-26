import { NextResponse } from "next/server";
import { Class } from "@/backend/models/postgres";
import { getCurrentUser } from "@/lib/auth";


// --- PUT: Update Class ---
export async function PUT(req, { params }) {
  try {
    const user = await getCurrentUser(req);
    const bodyText = await req.text();
    console.log("PUT Request Body:", bodyText);
    
    let data;
    try {
      data = JSON.parse(bodyText);
    } catch (e) {
      return NextResponse.json({ error: "Invalid JSON format: " + e.message }, { status: 400 });
    }

    const { id } = await params;

    const targetClass = await Class.findByPk(id);
    if (!targetClass)
      return NextResponse.json({ error: "Class not found" }, { status: 404 });

    if (
      user.role !== "SUPER_ADMIN" &&
      targetClass.branch_id !== user.branch_id
    ) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Filter allowed fields to prevent accidental ID or metadata updates
    const allowedFields = ["name", "group_id", "branch_id", "academic_year_id", "is_active", "display_order"];
    const updatePayload = {};
    allowedFields.forEach(field => {
      if (data[field] !== undefined) updatePayload[field] = data[field];
    });

    await targetClass.update(updatePayload);
    return NextResponse.json({ message: "Class updated", targetClass });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// --- DELETE: Delete Class ---
export async function DELETE(req, { params }) {
  try {
    const user = await getCurrentUser(req);
    const { id } = await params;

    const targetClass = await Class.findByPk(id);
    if (!targetClass)
      return NextResponse.json({ error: "Class not found" }, { status: 404 });

    if (
      user.role !== "SUPER_ADMIN" &&
      targetClass.branch_id !== user.branch_id
    ) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Soft delete (Sequelize paranoid mode)
    await targetClass.destroy();
    return NextResponse.json({
      message: "Class and its sections deleted successfully",
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
