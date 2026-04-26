import { NextResponse } from "next/server";
import { withAuth } from "@/backend/middleware/auth.middleware.js";
import { AcademicYear as AcademicYearModel } from "@/backend/models/postgres";

// PUT: Update Academic Year
async function updateAcademicYear(req, { params }) {
  try {
    const user = req.user;
    const { id } = await params;
    const body = await req.json();

    const year = await AcademicYearModel.findByPk(id);
    if (!year) {
      return NextResponse.json({ error: "Academic year not found" }, { status: 404 });
    }

    // Role-based access control
    if (user.role !== "SUPER_ADMIN" && year.branch_id !== user.branch_id) {
      return NextResponse.json({ error: "Forbidden: Access denied" }, { status: 403 });
    }

    // If setting as current, unset others for this branch
    if (body.is_current) {
        await AcademicYearModel.update(
            { is_current: false },
            { where: { branch_id: year.branch_id, is_current: true } }
        );
    }

    await year.update(body);
    return NextResponse.json(year);
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// DELETE: Remove Academic Year
async function deleteAcademicYear(req, { params }) {
  try {
    const user = req.user;
    const { id } = await params;

    const year = await AcademicYearModel.findByPk(id);
    if (!year) {
      return NextResponse.json({ error: "Academic year not found" }, { status: 404 });
    }

    // Role-based access control
    if (user.role !== "SUPER_ADMIN" && year.branch_id !== user.branch_id) {
      return NextResponse.json({ error: "Forbidden: Access denied" }, { status: 403 });
    }

    await year.destroy();
    return NextResponse.json({ message: "Academic year deleted successfully" });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export const PUT = withAuth(updateAcademicYear);
export const DELETE = withAuth(deleteAcademicYear);