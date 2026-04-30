import { NextResponse } from "next/server";
import { Subject } from "@/backend/models/postgres";
import { getCurrentUser } from "@/lib/auth";
import { deleteFromCloudinary } from "@/backend/utils/cloudinary";

// 1. GET SINGLE SUBJECT
export async function GET(req, { params }) {
  const { id } = await params;
  const user = await getCurrentUser(req);
  const subject = await Subject.findByPk(id, { include: ["class"] });

  if (!subject)
    return NextResponse.json({ error: "Not Found" }, { status: 404 });
  if (user.role !== "SUPER_ADMIN" && subject.branch_id !== user.branch_id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  return NextResponse.json(subject);
}

// 2. PUT: UPDATE SUBJECT (Details Only)
export async function PUT(req, { params }) {
  try {
    const { id } = await params;
    const user = await getCurrentUser(req);
    const body = await req.json();
    const subject = await Subject.findByPk(id);

    if (!subject)
      return NextResponse.json({ error: "Not Found" }, { status: 404 });

    // Security
    if (user.role !== "SUPER_ADMIN" && subject.branch_id !== user.branch_id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    await subject.update(body);
    return NextResponse.json(subject);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// 3. DELETE: SUBJECT & CLOUDINARY CLEANUP
export async function DELETE(req, { params }) {
  try {
    const { id } = await params;
    const user = await getCurrentUser(req);
    const subject = await Subject.findByPk(id);

    if (!subject)
      return NextResponse.json({ error: "Not Found" }, { status: 404 });

    // Authorization
    if (user.role !== "SUPER_ADMIN" && subject.branch_id !== user.branch_id) {
      return NextResponse.json({ error: "Access Denied" }, { status: 403 });
    }

    // --- Delete all files from Cloudinary ---
    if (subject.materials && subject.materials.length > 0) {
      const deletePromises = subject.materials.map((m) =>
        deleteFromCloudinary(m.public_id, "auto"),
      );
      await Promise.all(deletePromises);
    }

    // DB Soft Delete
    await subject.destroy();

    return NextResponse.json({
      message: "Subject and all materials deleted successfully",
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
