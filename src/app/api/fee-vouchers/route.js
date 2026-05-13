import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { Op } from 'sequelize';
import { sequelize, FeeVoucher, User, Class, Branch, AcademicYear, Section } from '@/backend/models/postgres';
import NotificationService from '@/backend/services/NotificationService';
import { ROLES } from '@/constants/roles';

export async function GET(request) {
  try {
    const user = await getCurrentUser(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const branchId = searchParams.get('branchId') || searchParams.get('branch_id');
    const studentId = searchParams.get('studentId') || searchParams.get('student_id');
    const rollNo = searchParams.get('roll_no');

    let whereClause = {};
    if (user.role === ROLES.BRANCH_ADMIN) {
      whereClause.branch_id = user.branch_id;
    } else if (branchId) {
      whereClause.branch_id = branchId;
    }

    if (studentId) {
      whereClause.student_id = studentId;
    }

    let studentInclude = { 
      model: User, 
      as: 'student', 
      attributes: ['first_name', 'last_name', 'email', 'details', 'branch_id', 'registration_no'],
      where: {}
    };

    if (rollNo) {
      studentInclude.where = sequelize.where(
        sequelize.fn('replace', sequelize.literal("student.details->'academic_info'->>'roll_no'"), ' ', ''),
        { [Op.iLike]: `%${rollNo.trim().replace(/\s+/g, '')}%` }
      );
      studentInclude.required = true;
    }

    const vouchers = await FeeVoucher.findAll({
      where: whereClause,
      include: [
        studentInclude,
        { model: Branch, as: 'branch', attributes: ['name'] },
        { model: AcademicYear, as: 'academic_year', attributes: ['name'] },
        { model: Class, as: 'class', attributes: ['name'] },
        { model: Section, as: 'section', attributes: ['name'] },
      ],
      order: [['created_at', 'DESC']],
    });

    const formattedVouchers = vouchers.map(v => {
      const json = v.toJSON();

      let status = 'pending';
      if (json.status === 'UNPAID') status = 'pending';
      else if (json.status === 'PAID') status = 'paid';
      else if (json.status === 'PARTIAL') status = 'partial';
      else if (json.status === 'OVERDUE') status = 'overdue';

      return {
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
        amountDue: Number(json.amount_due) || 0,
        totalAmount: Number(json.amount_due) || 0,
        paidAmount: Number(json.paid_amount) || 0,
        remainingAmount: (Number(json.amount_due) + Number(json.fine_amount || 0)) - Number(json.paid_amount || 0),
        dueDate: json.due_date,
        paidDate: json.paid_date,
        status: status,
        feeType: json.fee_type,
        installmentNo: json.installment_no,
        totalInstallments: json.total_installments,
        academicYear: json.academic_year ? { id: json.academic_year_id, name: json.academic_year.name } : null,
        class: json.class ? { id: json.class_id, name: json.class.name } : null,
        section: json.section ? { id: json.section_id, name: json.section.name } : null,
        group: json.student?.details?.academic_info?.group_id || json.student?.group_id || null,
        month: json.month || json.due_date?.substring(5, 7) || '1',
        year: json.due_date ? json.due_date.substring(0, 4) : new Date().getFullYear().toString(),
        remarks: json.remarks,
        createdAt: json.created_at,
        updatedAt: json.updated_at,
      };
    });

    return NextResponse.json({
      success: true,
      data: { vouchers: formattedVouchers }
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const user = await getCurrentUser(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const {
      generation_type,
      student_id,
      student_ids,
      group_id,
      class_id,
      branch_id,
      academic_year_id,
      due_date,
      month,
      year,
      remarks,
    } = body;

    const studentsWhere = { role: 'STUDENT', is_active: true };
    if (user.role === ROLES.BRANCH_ADMIN) {
      studentsWhere.branch_id = user.branch_id;
    } else if (branch_id && branch_id !== 'all') {
      studentsWhere.branch_id = branch_id;
    }

    const students = await User.findAll({
      where: studentsWhere
    });

    const targetStudents = students.filter(st => {
      const details = st.details?.academic_info || {};
      const stGroupId = st.groupId || details.group_id || st.group_id;
      const stClassId = st.classId || details.class_id || st.class_id;
      const stSectionId = st.sectionId || details.section_id || st.section_id;
      const stBranchId = st.branchId || st.branch_id;

      if (generation_type === 'single') return st.id === student_id;
      if (generation_type === 'multi') return Array.isArray(student_ids) && student_ids.includes(st.id);
      if (generation_type === 'group') return stGroupId === group_id;
      if (generation_type === 'class') {
        const matchClass = stClassId === class_id;
        const matchSection = !body.section_id || stSectionId === body.section_id;
        return matchClass && matchSection;
      }
      if (generation_type === 'branch') return stBranchId === (branch_id || user.branch_id);
      if (generation_type === 'institute') return true;
      return false;
    });

    if (targetStudents.length === 0) {
      return NextResponse.json({ success: false, error: 'No students found matching the selected criteria.' }, { status: 400 });
    }

    const targetStudentIds = targetStudents.map(st => st.id);
    const allExistingVouchers = await FeeVoucher.findAll({
      where: { student_id: targetStudentIds }
    });

    const academicYearsData = await AcademicYear.findAll();
    const academicYearsMap = {};
    for (const ay of academicYearsData) {
      let months = 12;
      if (ay.start_date && ay.end_date) {
        const start = new Date(ay.start_date);
        const end = new Date(ay.end_date);
        months = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth()) + 1;
        if (months <= 0) months = 12;
      }
      academicYearsMap[ay.id] = months;
    }

    const voucherMap = {};
    for (const stId of targetStudentIds) {
      voucherMap[stId] = { LumpSum: false, Monthly: {}, Installment: 0 };
    }

    for (const v of allExistingVouchers) {
      if (!voucherMap[v.student_id]) {
        voucherMap[v.student_id] = { LumpSum: false, Monthly: {}, Installment: 0 };
      }
      if (v.fee_type === 'LumpSum') {
        voucherMap[v.student_id].LumpSum = true;
      } else if (v.fee_type === 'Installment') {
        voucherMap[v.student_id].Installment += 1;
      } else if (v.fee_type === 'Monthly') {
        voucherMap[v.student_id].Monthly[v.month] = true;
      }
    }

    const createdVouchers = [];

    for (const st of targetStudents) {
      const details = st.details?.academic_info || {};
      const stGroupId = st.groupId || details.group_id || st.group_id;
      const stClassId = st.classId || details.class_id || st.class_id;
      const stSectionId = st.sectionId || details.section_id || st.section_id;
      const stBranchId = st.branchId || st.branch_id;

      const subjects = details.subjects || [];
      const subjectsTotal = subjects.reduce((acc, sub) => acc + (sub.fee || 0), 0);
      const discount = Number(st.discount_amount || details.discount_amount || details.discount || 0);

      let amount_due = 0;
      let total_installments = null;
      let installment_no = null;
      const fee_type = st.fee_mention || st.fee_type || details.fee_mention || details.fee_type || 'Monthly';
      const targetAcademicYearId = details.academic_year_id || academic_year_id;
      const totalMonths = academicYearsMap[targetAcademicYearId] || 12;

      /* --- Old Calculation Logic (Fallback) ---
      if (fee_type === 'LumpSum') {
        if (voucherMap[st.id].LumpSum) continue;
        amount_due = (subjectsTotal * totalMonths) - discount;
      } else if (fee_type === 'Installment') {
        total_installments = Number(st.installment_count || st.installments || details.installment_count || details.installments || 1);
        installment_no = voucherMap[st.id].Installment + 1;
        if (installment_no > total_installments) continue;
        amount_due = Math.round(((subjectsTotal * totalMonths) - discount) / total_installments);
      } else { // Monthly
        if (voucherMap[st.id].Monthly[month]) continue;
        amount_due = subjectsTotal - discount;
      }
      ----------------------------------------- */

      // --- Logic: Use Agreement Amount (total_fee) ---
      const agreementTotal = Number(details.total_fee || 0);
      const admissionFee = Number(details.admission_fee || 0);

      if (fee_type === 'LumpSum') {
        if (voucherMap[st.id].LumpSum) continue;
        const baseAmount = agreementTotal > 0 ? (agreementTotal - discount) : ((subjectsTotal * totalMonths) - discount);
        amount_due = baseAmount;
      } else if (fee_type === 'Installment') {
        total_installments = Number(st.installment_count || st.installments || details.installment_count || details.installments || 1);
        installment_no = voucherMap[st.id].Installment + 1;
        if (installment_no > total_installments) continue;
        
        const baseAmount = agreementTotal > 0 ? (agreementTotal - discount) : ((subjectsTotal * totalMonths) - discount);
        amount_due = Math.round(baseAmount / total_installments);
      } else { // Monthly
        if (voucherMap[st.id].Monthly[month]) continue;
        
        // --- Monthly Logic Overhaul ---
        const baseMonthly = agreementTotal > 0 ? agreementTotal : subjectsTotal;
        
        // Check if this is the first ever voucher for this student to add Admission Fee
        const isFirstVoucher = Object.keys(voucherMap[st.id].Monthly).length === 0 && 
                              !voucherMap[st.id].LumpSum && 
                              voucherMap[st.id].Installment === 0;
        
        if (isFirstVoucher) {
          amount_due = (baseMonthly + admissionFee) - discount;
          var voucherRemarks = `Admission/Test Fee included. ` + (remarks || '');
        } else {
          amount_due = baseMonthly - discount;
          var voucherRemarks = remarks || ''; // No auto-remarks for regular months
        }
      }

      // --- Per-Student Due Date Logic ---
      // Use student's preferred payment day, default to 8
      const paymentDay = details.payment_date || '8';
      
      // Determine year: use the year from the body if provided, otherwise fallback to current year
      let targetYear = year || new Date().getFullYear();
      
      const monthStr = month.toString().padStart(2, '0');
      const dayStr = paymentDay.toString().padStart(2, '0');
      const studentSpecificDueDate = `${targetYear}-${monthStr}-${dayStr}`;

      // Calculate previous rolled over pending balance
      const pendingVouchers = allExistingVouchers.filter(v =>
        v.student_id === st.id &&
        v.status !== 'PAID' &&
        v.status !== 'CANCELLED'
      );

      let rolledBalance = 0;
      let rolledVoucherNos = [];
      for (const pv of pendingVouchers) {
        const totalDue = Number(pv.amount_due) + Number(pv.fine_amount || 0);
        const currentPaid = Number(pv.paid_amount || 0);
        const remaining = totalDue - currentPaid;
        if (remaining > 0) {
          rolledBalance += remaining;
          rolledVoucherNos.push(pv.voucher_no);
          // Soft delete or mark as merged the old unpaid voucher
          await pv.destroy(); // Since we are merging the balance, we delete the previous one
        }
      }

      // Validate required fields
      if (!targetAcademicYearId) {
        console.warn(`Skipping student ${st.id}: missing academic_year_id`);
        continue;
      }
      if (!stBranchId) {
        console.warn(`Skipping student ${st.id}: missing branch_id`);
        continue;
      }
      if (!stClassId) {
        console.warn(`Skipping student ${st.id}: missing class_id`);
        continue;
      }

      const timestamp = Date.now();
      const random = Math.floor(1000 + Math.random() * 9000);
      const voucher_no = `VCH-${timestamp}-${random}`;

      try {
        const voucher = await FeeVoucher.create({
          voucher_no,
          student_id: st.id,
          class_id: stClassId,
          section_id: stSectionId,
          academic_year_id: targetAcademicYearId,
          branch_id: stBranchId,
          amount_due: Number(amount_due || 0) + Number(rolledBalance || 0),
          due_date: studentSpecificDueDate,
          fee_type,
          installment_no,
          total_installments,
          month: month.toString(),
          remarks: (rolledBalance > 0 ? `Includes pending balance of PKR ${rolledBalance} from merged vouchers (${rolledVoucherNos.join(', ')}). ` : '') + (voucherRemarks || remarks || ''),
          created_by: user.id,
          status: 'UNPAID',
        });

        createdVouchers.push(voucher);
      } catch (createErr) {
        console.error(`Failed to create voucher for student ${st.id}:`, createErr);
        // Continue to next student instead of failing whole request
      }
    }

    // Send notifications asynchronously
    (async () => {
      try {
        for (const voucher of createdVouchers) {
          await NotificationService.sendToUsers([voucher.student_id], {
            title: "Fee Voucher Generated",
            message: `A new fee voucher (${voucher.voucher_no}) for the month of ${voucher.month} has been generated. Due date: ${voucher.due_date}.`,
            type: "fee_due",
            branchId: voucher.branch_id,
            sentBy: user.id,
          });
        }
      } catch (err) {
        console.error("Fee Voucher Notification Error:", err);
      }
    })();

    return NextResponse.json({
      success: true,
      message: `Successfully generated ${createdVouchers.length} fee vouchers`,
      count: createdVouchers.length,
    }, { status: 201 });

  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

