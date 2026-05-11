import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import {
  FeeVoucher,
  User,
  Class,
  Section,
  Branch,
  AcademicYear,
} from "@/backend/models/postgres";
import { ROLES } from "@/constants/roles";
import { Op } from "sequelize";

export async function GET(request) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get("studentId") || user.id;
    const status = searchParams.get("status"); // PAID, UNPAID, PARTIAL, OVERDUE
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");

    // Verify student is accessing their own vouchers or is admin/teacher
    if (
      user.role === ROLES.STUDENT &&
      studentId !== user.id
    ) {
      return NextResponse.json(
        { error: "You can only access your own vouchers" },
        { status: 403 }
      );
    }

    const offset = (page - 1) * limit;

    // Build where clause
    const where = { student_id: studentId };
    if (status && ["PAID", "UNPAID", "PARTIAL", "OVERDUE"].includes(status)) {
      where.status = status;
    }

    // Fetch vouchers
    const { count, rows } = await FeeVoucher.findAndCountAll({
      where,
      include: [
        {
          model: Class,
          as: "class",
          attributes: ["id", "name"],
        },
        {
          model: Section,
          as: "section",
          attributes: ["id", "name"],
        },
        {
          model: AcademicYear,
          as: "academic_year",
          attributes: ["id", "name"],
        },
        {
          model: Branch,
          as: "branch",
          attributes: ["id", "name"],
        },
        {
          model: User,
          as: "student",
          attributes: [
            "id",
            "first_name",
            "last_name",
            "email",
            "registration_no",
          ],
        },
      ],
      order: [["due_date", "DESC"]],
      limit,
      offset,
      subQuery: false,
    });

    // Format response
    const formattedVouchers = rows.map((voucher) => {
      const json = voucher.toJSON();
      const remaining =
        Number(json.amount_due) +
        Number(json.fine_amount || 0) -
        Number(json.paid_amount || 0);

      return {
        id: json.id,
        voucher_no: json.voucher_no,
        amount_due: Number(json.amount_due),
        paid_amount: Number(json.paid_amount),
        fine_amount: Number(json.fine_amount || 0),
        remaining_amount: remaining,
        status: json.status,
        fee_type: json.fee_type,
        installment_no: json.installment_no,
        total_installments: json.total_installments,
        due_date: json.due_date,
        paid_date: json.paid_date,
        month: json.month,
        remarks: json.remarks,
        class: json.class ? { id: json.class.id, name: json.class.name } : null,
        section: json.section
          ? { id: json.section.id, name: json.section.name }
          : null,
        academic_year: json.academic_year
          ? { id: json.academic_year.id, name: json.academic_year.name }
          : null,
        branch: json.branch ? { id: json.branch.id, name: json.branch.name } : null,
        created_at: json.created_at,
        updated_at: json.updated_at,
        payment_history: json.payment_history || [],
      };
    });

    return NextResponse.json(
      {
        success: true,
        data: {
          vouchers: formattedVouchers,
          pagination: {
            page,
            limit,
            total: count,
            pages: Math.ceil(count / limit),
          },
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Fee vouchers error:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only branch admin, super admin can create vouchers for students
    if (![ROLES.BRANCH_ADMIN, ROLES.SUPER_ADMIN].includes(user.role)) {
      return NextResponse.json(
        { error: "Permission denied" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      student_id,
      amount_due,
      fine_amount = 0,
      due_date,
      fee_type,
      month,
      remarks,
      class_id,
      section_id,
      academic_year_id,
    } = body;

    // Validate required fields
    if (!student_id || !amount_due || !due_date || !fee_type) {
      return NextResponse.json(
        {
          error:
            "Missing required fields: student_id, amount_due, due_date, fee_type",
        },
        { status: 400 }
      );
    }

    // Verify student exists
    const student = await User.findByPk(student_id);
    if (!student) {
      return NextResponse.json(
        { error: "Student not found" },
        { status: 404 }
      );
    }

    // Generate voucher number
    const voucherNo = `VOC-${Date.now()}-${Math.floor(Math.random() * 10000)}`;

    // Get branch_id from student or user
    const branchId = student.branch_id || user.branch_id;

    // Create fee voucher
    const voucher = await FeeVoucher.create({
      voucher_no: voucherNo,
      student_id,
      branch_id: branchId,
      academic_year_id:
        academic_year_id ||
        (await AcademicYear.findOne({
          where: { is_current: true },
          attributes: ["id"],
        }))?.id,
      class_id,
      section_id,
      amount_due: parseFloat(amount_due),
      fine_amount: parseFloat(fine_amount),
      due_date,
      fee_type,
      month,
      remarks,
      status: "UNPAID",
      created_by: user.id,
      payment_history: [],
    });

    return NextResponse.json(
      {
        success: true,
        message: "Fee voucher created successfully",
        data: {
          id: voucher.id,
          voucher_no: voucher.voucher_no,
          student_id: voucher.student_id,
          amount_due: Number(voucher.amount_due),
          status: voucher.status,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Create voucher error:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
