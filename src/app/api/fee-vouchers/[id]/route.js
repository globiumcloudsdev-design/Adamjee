import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { FeeVoucher, User, Class, Branch, AcademicYear, Section } from '@/backend/models/postgres';

export async function GET(request, { params }) {
  try {
    const user = await getCurrentUser(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;

    const voucher = await FeeVoucher.findByPk(id, {
      include: [
        { model: User, as: 'student', attributes: ['first_name', 'last_name', 'email', 'details', 'branch_id', 'registration_no'] },
        { model: Branch, as: 'branch', attributes: ['name'] },
        { model: AcademicYear, as: 'academic_year', attributes: ['name'] },
        { model: Class, as: 'class', attributes: ['name'] },
        { model: Section, as: 'section', attributes: ['name'] },
      ]
    });

    if (!voucher) {
      return NextResponse.json({ success: false, error: 'Voucher not found' }, { status: 404 });
    }

    const json = voucher.toJSON();
    let status = 'pending';
    if (json.status === 'UNPAID') status = 'pending';
    else if (json.status === 'PAID') status = 'paid';
    else if (json.status === 'PARTIAL') status = 'partial';
    else if (json.status === 'OVERDUE') status = 'overdue';

    const formattedVoucher = {
      _id: json.id,
      id: json.id,
      voucherNumber: json.voucher_no,
      studentId: {
        _id: json.student_id,
        id: json.student_id,
        firstName: json.student?.first_name,
        lastName: json.student?.last_name,
        email: json.student?.email,
        registrationNumber: json.student?.registration_no,
        rollNumber: json.student?.details?.academic_info?.roll_no,
      },
      branchId: {
        _id: json.branch_id,
        id: json.branch_id,
        name: json.branch?.name,
      },
      class: json.class ? { id: json.class_id, name: json.class.name } : null,
      section: json.section ? { id: json.section_id, name: json.section.name } : null,
      academicYear: json.academic_year ? { id: json.academic_year_id, name: json.academic_year.name } : null,
      group: json.student?.details?.academic_info?.group_id || json.student?.group_id || null,
      amountDue: Number(json.amount_due) || 0,
      totalAmount: Number(json.amount_due) || 0,
      paidAmount: Number(json.paid_amount) || 0,
      remainingAmount: (Number(json.amount_due) + Number(json.fine_amount || 0)) - Number(json.paid_amount || 0),
      paymentHistory: json.payment_history || [],
      fineAmount: Number(json.fine_amount) || 0,
      dueDate: json.due_date,
      paidDate: json.paid_date,
      status: status,
      feeType: json.fee_type,
      installmentNo: json.installment_no,
      totalInstallments: json.total_installments,
      month: json.month || json.due_date?.substring(5, 7) || '1',
      year: json.due_date ? json.due_date.substring(0, 4) : new Date().getFullYear().toString(),
      remarks: json.remarks,
      createdAt: json.created_at,
      updatedAt: json.updated_at,
    };

    return NextResponse.json({ success: true, data: formattedVoucher });
  } catch (error) {
    console.error('Error fetching fee voucher:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const user = await getCurrentUser(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const voucher = await FeeVoucher.findByPk(id);

    if (!voucher) {
      return NextResponse.json({ success: false, error: 'Voucher not found' }, { status: 404 });
    }

    await voucher.destroy();
    
    return NextResponse.json({ success: true, message: 'Voucher deleted successfully' });
  } catch (error) {
    console.error('Error deleting fee voucher:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
