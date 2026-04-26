import { NextResponse } from "next/server";
import { withAuth } from "@/backend/middleware/auth.middleware.js";
import { AcademicYear as AcademicYearModel, Branch } from "@/backend/models/postgres";
import { Op } from "sequelize";

// GET: List Academic Years
async function getAcademicYears(req) {
  try {
    const user = req.user;
    const whereClause = user.role === "SUPER_ADMIN" ? {} : { [Op.or]: [{ branch_id: user.branch_id }, { branch_id: null }] };
    const years = await AcademicYearModel.findAll({ 
      where: whereClause, 
      order: [["start_date", "DESC"]],
      include: [
        { model: Branch, as: "branch", attributes: ["name", "code"] }
      ]
    });
    return NextResponse.json({ academic_years: years });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// POST: Create Academic Year
async function createAcademicYear(req) {
  try {
    const user = req.user;
    const { name, start_date, end_date, branch_id, is_current } = await req.json();
    let finalBranchId = user.role === "SUPER_ADMIN" ? (branch_id || null) : user.branch_id;

    if (is_current) {
        await AcademicYearModel.update({ is_current: false }, { where: { branch_id: finalBranchId, is_current: true } });
    }

    const newYear = await AcademicYearModel.create({
      name, start_date, end_date, is_current: is_current || false, branch_id: finalBranchId, created_by: user.id
    });
    return NextResponse.json(newYear, { status: 201 });
  } catch (err) {
    if (err.name === 'SequelizeUniqueConstraintError') {
      return NextResponse.json({ error: "Academic Year with this name already exists for the selected branch!" }, { status: 400 });
    }
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export const GET = withAuth(getAcademicYears);
export const POST = withAuth(createAcademicYear);
