import { NextResponse } from "next/server";
import { Group } from "@/backend/models/postgres";
import { getCurrentUser } from "@/lib/auth";

export async function PUT(req, { params }) {
  try {
    const user = await getCurrentUser(req);
    if (!user) {
      return NextResponse.json({ error: "Login required" }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();
    const group = await Group.findByPk(id);

    if (!group) {
      return NextResponse.json({ error: "Group not found" }, { status: 404 });
    }

    // Authorization: Super Admin can do anything, Branch Admin only their branch
    if (user.role !== "SUPER_ADMIN" && group.branch_id !== user.branch_id) {
      return NextResponse.json({ error: "Access Denied" }, { status: 403 });
    }

    await group.update(body);
    return NextResponse.json(group);
  } catch (error) {
    console.error("PUT Group Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  try {
    const user = await getCurrentUser(req);
    if (!user) {
      return NextResponse.json({ error: "Login required" }, { status: 401 });
    }

    const { id } = await params;
    const group = await Group.findByPk(id);

    if (!group) {
      return NextResponse.json({ error: "Group not found" }, { status: 404 });
    }

    if (user.role !== "SUPER_ADMIN" && group.branch_id !== user.branch_id) {
      return NextResponse.json({ error: "Access Denied" }, { status: 403 });
    }

    await group.destroy(); // Soft delete logic
    return NextResponse.json({ message: "Group deleted" });
  } catch (error) {
    console.error("DELETE Group Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
