import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { KeyIcon } from 'lucide-react';

const MONTHS = [
  { value: '1', label: 'January' },
  { value: '2', label: 'February' },
  { value: '3', label: 'March' },
  { value: '4', label: 'April' },
  { value: '5', label: 'May' },
  { value: '6', label: 'June' },
  { value: '7', label: 'July' },
  { value: '8', label: 'August' },
  { value: '9', label: 'September' },
  { value: '10', label: 'October' },
  { value: '11', label: 'November' },
  { value: '12', label: 'December' },
];

const getMonthName = (month) => {
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 
                  'July', 'August', 'September', 'October', 'November', 'December'];
  return months[month - 1];
};

// /**
//  * Generate Salary Slip PDF
//  */
// export const generateSalarySlipPDF = async (payroll, employee) => {
//   const doc = new jsPDF();

//   // Colors
//   const primaryColor = [41, 128, 185]; // Blue
//   const secondaryColor = [52, 73, 94]; // Dark gray
//   const greenColor = [39, 174, 96]; // Green
//   const redColor = [231, 76, 60]; // Red

//   // Header Section
//   doc.setFillColor(...primaryColor);
//   doc.rect(0, 0, 210, 30, 'F'); // Reduced height

//   doc.setTextColor(255, 255, 255);
//   doc.setFontSize(22);
//   doc.setFont('helvetica', 'bold');
//   doc.text('ADAMJEE COACHING', 105, 12, { align: 'center' }); // Adjusted Y

//   doc.setFontSize(14);
//   doc.setFont('helvetica', 'normal');
//   doc.text('Salary Slip', 105, 20, { align: 'center' }); // Adjusted Y

//   doc.setFontSize(10);
//   doc.text(`${getMonthName(payroll.month)} ${payroll.year}`, 105, 26, { align: 'center' }); // Adjusted Y

//   // Employee Information Section
//   let yPos = 40; // Reduced starting Y

//   doc.setTextColor(...secondaryColor);
//   doc.setFontSize(12);
//   doc.setFont('helvetica', 'bold');
//   doc.text('Employee Information', 15, yPos);

//   yPos += 6; // Reduced spacing

//   // Determine profile data and designation based on role
//   let designation = '';
//   let employeeId = 'N/A';
  
//   if (employee.role === 'teacher' && employee.teacherProfile) {
//     designation = employee.teacherProfile.designation || 'Teacher';
//     employeeId = employee.teacherProfile.employeeId || 'N/A';
//   } else if (employee.role === 'staff' && employee.staffProfile) {
//     designation = employee.staffProfile.role || 'Staff'; // Use role for staff designation
//     employeeId = employee.staffProfile.employeeId || 'N/A';
//   } else {
//     designation = employee.role === 'branch_admin' ? 'Branch Admin' : (employee.role || 'Employee');
//     // Try to get ID from any profile
//     const p = employee.teacherProfile || employee.staffProfile;
//     if (p) employeeId = p.employeeId || 'N/A';
//   }

//   // Rounding helper for currency
//   const formatMoney = (amount) => `PKR ${Math.round(amount || 0).toLocaleString()}`;

//   // Employee details table
//   const employeeData = [
//     ['Employee Name:', `${employee.firstName} ${employee.lastName}`],
//     ['Employee ID:', employeeId],
//     ['Designation:', designation],
//     ['Email:', employee.email],
//     ['Phone:', employee.phone || 'N/A'],
//   ];

//   autoTable(doc, {
//     startY: yPos,
//     head: [],
//     body: employeeData,
//     theme: 'plain',
//     styles: {
//       fontSize: 9, // Reduced font size
//       cellPadding: 2, // Reduced padding
//     },
//     columnStyles: {
//       0: { fontStyle: 'bold', cellWidth: 40 }, // Reduced width
//       1: { cellWidth: 120 },
//     },
//   });

//   yPos = doc.lastAutoTable.finalY + 6; // Reduced spacing

//   // Salary Breakdown Section
//   doc.setFontSize(12);
//   doc.setFont('helvetica', 'bold');
//   doc.setTextColor(...primaryColor);
//   doc.text('Salary Breakdown', 15, yPos);

//   yPos += 4; // Reduced spacing

//   // Earnings Table
//   const earningsData = [
//     ['Basic Salary', '', formatMoney(payroll.basicSalary)],
//     ['House Rent Allowance', '', formatMoney(payroll.allowances.houseRent)],
//     ['Medical Allowance', '', formatMoney(payroll.allowances.medical)],
//     ['Transport Allowance', '', formatMoney(payroll.allowances.transport)],
//     ['Other Allowances', '', formatMoney(payroll.allowances.other)],
//   ];

//   autoTable(doc, {
//     startY: yPos,
//     head: [['Earnings', '', 'Amount']],
//     body: earningsData,
//     foot: [['Gross Salary', '', formatMoney(payroll.grossSalary)]],
//     theme: 'grid',
//     headStyles: {
//       fillColor: [...primaryColor],
//       fontSize: 10,
//       fontStyle: 'bold',
//     },
//     footStyles: {
//       fillColor: [...greenColor],
//       fontSize: 10, // Reduced font size
//       fontStyle: 'bold',
//     },
//     styles: {
//       fontSize: 9, // Reduced font size
//       cellPadding: 3, // Reduced padding
//     },
//     columnStyles: {
//       0: { cellWidth: 80 },
//       1: { cellWidth: 30 },
//       2: { cellWidth: 60, halign: 'right' },
//     },
//   });

//   yPos = doc.lastAutoTable.finalY + 6; // Reduced spacing

//   // Deductions Table
//   const deductionsData = [
//     ['Tax', '', formatMoney(payroll.deductions.tax)],
//     ['Provident Fund', '', formatMoney(payroll.deductions.providentFund)],
//     ['Insurance', '', formatMoney(payroll.deductions.insurance)],
//     ['Other Deductions', '', formatMoney(payroll.deductions.other)],
//   ];

//   // Add attendance deduction if applicable
//   if (payroll.attendanceDeduction.calculatedDeduction > 0) {
//     deductionsData.push([
//       `Absence Deduction (${payroll.attendanceDeduction.absentDays} days)`,
//       '',
//       formatMoney(payroll.attendanceDeduction.calculatedDeduction),
//     ]);
//   }

//   autoTable(doc, {
//     startY: yPos,
//     head: [['Deductions', '', 'Amount']],
//     body: deductionsData,
//     foot: [['Total Deductions', '', formatMoney(payroll.totalDeductions)]],
//     theme: 'grid',
//     headStyles: {
//       fillColor: [...secondaryColor],
//       fontSize: 10,
//       fontStyle: 'bold',
//     },
//     footStyles: {
//       fillColor: [...redColor],
//       fontSize: 10, // Reduced font size
//       fontStyle: 'bold',
//     },
//     styles: {
//       fontSize: 9, // Reduced font size
//       cellPadding: 3, // Reduced padding
//     },
//     columnStyles: {
//       0: { cellWidth: 80 },
//       1: { cellWidth: 30 },
//       2: { cellWidth: 60, halign: 'right' },
//     },
//   });

//   yPos = doc.lastAutoTable.finalY + 8; // Reduced spacing

//   // Attendance Details (if available)
//   if (payroll.attendanceDeduction.totalWorkingDays > 0) {
//     doc.setFontSize(11);
//     doc.setFont('helvetica', 'bold');
//     doc.setTextColor(...secondaryColor);
//     doc.text('Attendance Summary', 15, yPos);

//     yPos += 4; // Reduced spacing

//     const attendanceData = [
//       ['Total Working Days', payroll.attendanceDeduction.totalWorkingDays.toString()],
//       ['Present Days', payroll.attendanceDeduction.presentDays.toString()],
//       ['Absent Days', payroll.attendanceDeduction.absentDays.toString()],
//       ['Leave Days', payroll.attendanceDeduction.leaveDays.toString()],
//     ];

//     autoTable(doc, {
//       startY: yPos,
//       body: attendanceData,
//       theme: 'striped',
//       styles: {
//         fontSize: 9, // Reduced font size
//         cellPadding: 2, // Reduced padding
//       },
//       columnStyles: {
//         0: { fontStyle: 'bold', cellWidth: 80 },
//         1: { cellWidth: 90 },
//       },
//     });

//     yPos = doc.lastAutoTable.finalY + 8; // Reduced spacing
//   }

//   // Net Salary Box
//   doc.setFillColor(...greenColor);
//   doc.rect(15, yPos, 180, 16, 'F'); // Reduced height

//   doc.setTextColor(255, 255, 255);
//   doc.setFontSize(13); // Reduced font size
//   doc.setFont('helvetica', 'bold');
//   doc.text('Net Salary:', 25, yPos + 10);
//   doc.setFontSize(15);
//   doc.text(formatMoney(payroll.netSalary), 175, yPos + 10, { align: 'right' });

//   yPos += 20; // Reduced spacing

//   // Bank Details (if available)
//   // Check in teacherProfile (where it is defined in schema)
//   const bankAccount = employee.teacherProfile?.bankAccount;

//   if (bankAccount && (bankAccount.bankName || bankAccount.accountNumber)) {
    
//     doc.setFontSize(11);
//     doc.setFont('helvetica', 'bold');
//     doc.setTextColor(...secondaryColor);
//     doc.text('Bank Account Details', 15, yPos);

//     yPos += 4; // Reduced spacing

//     const bankData = [
//       ['Bank Name:', bankAccount.bankName || 'N/A'],
//       ['Account Number:', bankAccount.accountNumber || 'N/A'],
//       ['IBAN:', bankAccount.iban || 'N/A'],
//     ];

//     autoTable(doc, {
//       startY: yPos,
//       body: bankData,
//       theme: 'plain',
//       styles: {
//         fontSize: 9,
//         cellPadding: 2,
//       },
//       columnStyles: {
//         0: { fontStyle: 'bold', cellWidth: 50 },
//         1: { cellWidth: 120 },
//       },
//     });

//     yPos = doc.lastAutoTable.finalY + 8; // Reduced spacing
//   }

//   // Remarks (if available)
//   if (payroll.remarks) {
//     doc.setFontSize(10);
//     doc.setFont('helvetica', 'bold');
//     doc.setTextColor(...secondaryColor);
//     doc.text('Remarks:', 15, yPos);
    
//     doc.setFont('helvetica', 'normal');
//     doc.setFontSize(9);
//     const splitRemarks = doc.splitTextToSize(payroll.remarks, 170);
//     doc.text(splitRemarks, 15, yPos + 5);
    
//     yPos += 5 + (splitRemarks.length * 5) + 5;
//   }

//   // Footer
//   const pageHeight = doc.internal.pageSize.height;
//   doc.setFontSize(8);
//   doc.setFont('helvetica', 'italic');
//   doc.setTextColor(128, 128, 128);
//   doc.text('This is a computer-generated salary slip and does not require a signature.', 105, pageHeight - 20, { align: 'center' });
//   doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 105, pageHeight - 15, { align: 'center' });
//   doc.text('© Adamjee Coaching - Coaching Management System', 105, pageHeight - 10, { align: 'center' });

//   // Return PDF as buffer for email attachment
//   return Buffer.from(doc.output('arraybuffer'));
// };

export const generateSalarySlipPDF = async (payroll, employee) => {
  const doc = new jsPDF('p', 'mm', 'a4');
  
  // Colors from the image
  const tealColor = [0, 153, 168]; // Primary Teal
  const textBlack = [30, 30, 30];
  const borderGray = [220, 220, 220];

  // --- 1. THE MODERN HEADER (Exact Image Style) ---
  doc.setFillColor(...tealColor);
  doc.rect(0, 0, 210, 45, 'F'); // Top bar

  // Drawing the white diagonal shape like in the image
  doc.setFillColor(255, 255, 255);
  doc.triangle(90, 45, 120, 0, 120, 45, 'F');
  doc.rect(120, 0, 90, 45, 'F');

  // Coaching Logo Icon (Geometric rectangles for a modern look)
  doc.setFillColor(255, 255, 255);
  doc.rect(20, 15, 3, 12, 'F');
  doc.rect(25, 10, 3, 17, 'F');
  doc.rect(30, 18, 3, 9, 'F');

  // Coaching Text
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.text('ADAMJEE COACHING', 40, 22);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('Fulfilling Your Educational Needs', 40, 28);

  // PAYSLIP Text (Right Aligned Teal)
  doc.setTextColor(...tealColor);
  doc.setFontSize(48);
  doc.setFont('helvetica', 'bold');
  doc.text('PAYSLIP', 195, 30, { align: 'right' });

  // --- 2. EMPLOYEE INFORMATION ---
  let yPos = 60;
  doc.setTextColor(...textBlack);
  doc.setFontSize(20);
  doc.text('EMPLOYEE INFORMATION:', 105, yPos, { align: 'center' });

  yPos += 15;
  const designation = employee.role === 'teacher' ? (employee.teacherProfile?.designation || 'Teacher') : (employee.staffProfile?.role || 'Staff');
  const employeeId = employee.teacherProfile?.employeeId || employee.staffProfile?.employeeId || 'N/A';

  doc.setFontSize(11);
  // Left Side
  doc.setFont('helvetica', 'bold');
  doc.text('Employee Name:', 20, yPos);
  doc.setFont('helvetica', 'normal');
  doc.text(`${employee.firstName} ${employee.lastName}`, 58, yPos);

  doc.setFont('helvetica', 'bold');
  doc.text('Position:', 20, yPos + 8);
  doc.setFont('helvetica', 'normal');
  doc.text(designation, 58, yPos + 8);

  // Right Side
  doc.setFont('helvetica', 'bold');
  doc.text('Employee ID:', 115, yPos);
  doc.setFont('helvetica', 'normal');
  doc.text(employeeId, 150, yPos);

  doc.setFont('helvetica', 'bold');
  doc.text('Department:', 115, yPos + 8);
  doc.setFont('helvetica', 'normal');
  doc.text(employee.role.replace('_', ' ').toUpperCase(), 150, yPos + 8);

  // --- 3. SALARY BREAKDOWN TABLE ---
  yPos += 22;
  const formatMoney = (amount) => `PKR${Math.round(amount || 0).toLocaleString()}`;

  // Extra Info (Email + Branch) - more compact
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('Email:', 20, yPos + 12);
  doc.setFont('helvetica', 'normal');
  doc.text(employee.email || 'N/A', 58, yPos + 12);

  doc.setFont('helvetica', 'bold');
  doc.text('Branch:', 115, yPos + 12);
  doc.setFont('helvetica', 'normal');
  doc.text(payroll.branchId?.name || 'N/A', 150, yPos + 12);

  // Build table rows dynamically - only show fields with value > 0
  const tableRows = [];
  
  // Earnings section
  if (payroll.basicSalary > 0) {
    tableRows.push(['Basic Salary', formatMoney(payroll.basicSalary)]);
  }
  if (payroll.allowances?.houseRent > 0) {
    tableRows.push(['House Rent Allowance', formatMoney(payroll.allowances.houseRent)]);
  }
  if (payroll.allowances?.medical > 0) {
    tableRows.push(['Medical Allowance', formatMoney(payroll.allowances.medical)]);
  }
  if (payroll.allowances?.transport > 0) {
    tableRows.push(['Transport Allowance', formatMoney(payroll.allowances.transport)]);
  }
  if (payroll.allowances?.other > 0) {
    tableRows.push(['Other Allowances', formatMoney(payroll.allowances.other)]);
  }
  
  // Gross Salary (always show)
  tableRows.push(['Gross Salary', formatMoney(payroll.grossSalary)]);
  
  // Deductions section
  if (payroll.deductions?.tax > 0) {
    tableRows.push(['Tax', formatMoney(payroll.deductions.tax)]);
  }
  if (payroll.deductions?.providentFund > 0) {
    tableRows.push(['Provident Fund', formatMoney(payroll.deductions.providentFund)]);
  }
  if (payroll.deductions?.insurance > 0) {
    tableRows.push(['Insurance', formatMoney(payroll.deductions.insurance)]);
  }
  if (payroll.deductions?.other > 0) {
    tableRows.push(['Other Deductions', formatMoney(payroll.deductions.other)]);
  }
  
  // Absent deduction (only if > 0)
  const absentDeduction = payroll.attendanceDeduction?.calculatedDeduction || 0;
  if (absentDeduction > 0) {
    tableRows.push([
      `Absent Deduction (${payroll.attendanceDeduction?.absentDays || 0} days)`,
      formatMoney(absentDeduction)
    ]);
  }
  
  // Total Deductions (always show if > 0)
  if (payroll.totalDeductions > 0) {
    tableRows.push(['Total Deductions', formatMoney(payroll.totalDeductions)]);
  }

  autoTable(doc, {
    startY: yPos,
    head: [['Description', 'Amount']],
    body: tableRows,
    theme: 'striped',
    headStyles: { 
      fillColor: [30, 30, 30], 
      textColor: 255, 
      fontSize: 12, 
      fontStyle: 'bold', 
      halign: 'left',
      cellPadding: 4
    },
    bodyStyles: { 
      fontSize: 10, 
      cellPadding: 5, 
      textColor: [50, 50, 50] 
    },
    columnStyles: {
      0: { cellWidth: 120 },
      1: { cellWidth: 50, halign: 'right', fontStyle: 'bold', textColor: [0, 0, 0] }
    },
    alternateRowStyles: { fillColor: [248, 248, 248] },
    margin: { left: 20, right: 20 },
    didParseCell: (data) => {
      // Bold the "Gross Salary" and "Total Deductions" rows
      const description = data.row.raw?.[0];
      if (description === 'Gross Salary' || description === 'Total Deductions') {
        data.cell.styles.fontStyle = 'bold';
        data.cell.styles.fontSize = 11;
      }
    }
  });

  // --- 4. FOOTER INFO (Bank & Signature Side-by-Side) ---
  yPos = doc.lastAutoTable.finalY + 10;

  // NET SALARY HIGHLIGHT (Teal Box)
  doc.setFillColor(...tealColor);
  doc.rect(20, yPos, 100, 15, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('NET SALARY', 25, yPos + 10);
  doc.text(formatMoney(payroll.netSalary), 115, yPos + 10, { align: 'right' });

  // Bank Info (Right of Net Salary)
  const bank = employee.teacherProfile?.bankAccount;
  doc.setTextColor(...textBlack);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('Bank Details:', 130, yPos + 4);
  doc.setFont('helvetica', 'normal');
  doc.text(`${bank?.bankName || 'N/A'}`, 130, yPos + 9);
  doc.text(`A/C: ${bank?.accountNumber || 'N/A'}`, 130, yPos + 13);

  yPos += 83;

  // Bottom Row: Paid Date & Signature
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text(`Paid on: ${new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}`, 20, yPos);

  // Signature Section
  doc.text('Prepared by:', 140, yPos - 5);
  doc.setFontSize(18);
  doc.setFont('courier', 'bolditalic'); // Signature font effect
  doc.text('Benjamin', 140, yPos + 3); 
  doc.line(140, yPos + 5, 185, yPos + 5); // Signature line
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('Benjamin Shah', 140, yPos + 10);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text('HR Manager', 140, yPos + 15);

  // Bottom Teal Strip
  const pageHeight = doc.internal.pageSize.height;
  doc.setFillColor(...tealColor);
  doc.rect(0, pageHeight - 15, 80, 15, 'F');
  doc.triangle(80, pageHeight, 80, pageHeight - 15, 100, pageHeight, 'F');
  
  doc.setFontSize(8);
  doc.setTextColor(255, 255, 255);
  doc.text('computer-generated document', 10, pageHeight - 6);
  doc.setTextColor(150, 150, 150);
  doc.text('© Adamjee Coaching System', 195, pageHeight - 6, { align: 'right' });

  return Buffer.from(doc.output('arraybuffer'));
};

export const generateFeeVoucherPDF = (voucher) => {
  const doc = new jsPDF();

  // Check if we're in a browser environment for responsive detection
  const isMobile = typeof window !== 'undefined' ? window.innerWidth < 768 : false;

  // Simplified Minimal Color Palette
  const primaryColor = [0, 0, 0]; // Solid Black
  const secondaryColor = [50, 50, 50]; // Dark Gray
  const borderColor = [200, 200, 200]; // Light Gray borders
  const highlightColor = [255, 255, 255]; // White

  // Page dimensions
  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;
  const margin = 15; 
  const contentWidth = pageWidth - (2 * margin);

  // Responsive font sizes
  const h1Size = 16;
  const h2Size = 12;
  const h3Size = 10;
  const bodySize = 10;
  const smallSize = 8;

  const lineHeight = 7;
  const boxPadding = 6; 

  doc.setFillColor(255, 255, 255);
  doc.rect(0, 0, pageWidth, pageHeight, 'F');
  
  // ========== HEADER SECTION ==========
  let yPosition = margin;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(h1Size);
  doc.setTextColor(0, 0, 0);
  doc.text('ADAMJEE', pageWidth / 2, yPosition, { align: 'center' });

  yPosition += 6;
  doc.setFontSize(h2Size);
  doc.text('FEE VOUCHER', pageWidth / 2, yPosition, { align: 'center' });

  yPosition += 6;
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.5);
  doc.line(margin, yPosition, margin + contentWidth, yPosition);

  yPosition += 8;
  // Metadata Section
  doc.setFontSize(bodySize);
  doc.setFont('helvetica', 'normal');
  const issueDate = new Date().toLocaleDateString('en-PK');
  const dueDate = voucher.dueDate ? new Date(voucher.dueDate).toLocaleDateString('en-PK') : 'N/A';

  doc.setFont('helvetica', 'bold');
  doc.text('Voucher #:', margin, yPosition);
  doc.setFont('helvetica', 'normal');
  doc.text(voucher.voucherNumber || '---', margin + 25, yPosition);

  doc.setFont('helvetica', 'bold');
  doc.text('Issue Date:', margin + (contentWidth * 0.65), yPosition);
  doc.setFont('helvetica', 'normal');
  doc.text(issueDate, margin + (contentWidth * 0.65) + 25, yPosition);

  yPosition += 6;
  doc.setFont('helvetica', 'bold');
  doc.text('Status:', margin, yPosition);
  doc.setFont('helvetica', 'normal');
  doc.text((voucher.status || 'pending').toUpperCase(), margin + 25, yPosition);

  doc.setFont('helvetica', 'bold');
  doc.text('Due Date:', margin + (contentWidth * 0.65), yPosition);
  doc.setFont('helvetica', 'normal');
  doc.text(dueDate, margin + (contentWidth * 0.65) + 25, yPosition);

  // STUDENT DETAILS
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(h2Size);
  doc.text('STUDENT DETAILS', margin, yPosition);
  
  yPosition += 4;
  doc.line(margin, yPosition, margin + contentWidth, yPosition);

  yPosition += 6;
  doc.setFontSize(bodySize);

  const studentName = voucher.studentId?.fullName || 
                     `${voucher.studentId?.firstName || ''} ${voucher.studentId?.lastName || ''}`.trim() ||
                     'N/A';
  const rollNo = voucher.studentId?.rollNumber || 'N/A';
  const regNo = voucher.studentId?.registrationNumber || voucher.studentId?.studentProfile?.registrationNumber || 'N/A';
  const className = voucher.class?.name || 'N/A';
  const sectionName = voucher.section?.name || 'N/A';

  doc.setFont('helvetica', 'bold');
  doc.text('Student Name:', margin, yPosition);
  doc.setFont('helvetica', 'normal');
  doc.text(studentName, margin + 35, yPosition);

  doc.setFont('helvetica', 'bold');
  doc.text('Class / Section:', margin + (contentWidth * 0.5), yPosition);
  doc.setFont('helvetica', 'normal');
  doc.text(`${className} - ${sectionName}`, margin + (contentWidth * 0.5) + 35, yPosition);

  yPosition += 6;
  doc.setFont('helvetica', 'bold');
  doc.text('Roll Number:', margin, yPosition);
  doc.setFont('helvetica', 'normal');
  doc.text(rollNo, margin + 35, yPosition);

  doc.setFont('helvetica', 'bold');
  doc.text('Registration #:', margin + (contentWidth * 0.5), yPosition);
  doc.setFont('helvetica', 'normal');
  doc.text(regNo, margin + (contentWidth * 0.5) + 35, yPosition);

  yPosition += 10;
  
  // Skip old complex mapping logic entirely
  
  // FEE DETAILS
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(h2Size);
  doc.text('FEE SUMMARY', margin, yPosition);
  
  yPosition += 4;
  doc.line(margin, yPosition, margin + contentWidth, yPosition);

  yPosition += 6;
  doc.setFontSize(bodySize);

  const feeType = voucher.feeType || voucher.fee_type || 'Monthly';
  const totalAmt = Number(voucher.totalAmount || voucher.amountDue || 0);
  const paidAmt = Number(voucher.paidAmount || 0);
  const remainingAmt = Number(voucher.remainingAmount !== undefined ? voucher.remainingAmount : (totalAmt - paidAmt));

  doc.setFont('helvetica', 'bold');
  doc.text('Fee Type:', margin, yPosition);
  doc.setFont('helvetica', 'normal');
  doc.text(feeType, margin + 35, yPosition);

  if (feeType === 'Installment') {
    doc.setFont('helvetica', 'bold');
    doc.text('Installment Info:', margin + (contentWidth * 0.5), yPosition);
    doc.setFont('helvetica', 'normal');
    doc.text(`${voucher.installmentNo} of ${voucher.totalInstallments}`, margin + (contentWidth * 0.5) + 35, yPosition);
    yPosition += 6;
  }

  yPosition += 6;

  doc.setFont('helvetica', 'bold');
  doc.text('Total Amount:', margin, yPosition);
  doc.setFont('helvetica', 'normal');
  doc.text(`PKR ${totalAmt.toLocaleString('en-PK')}`, margin + 35, yPosition);

  doc.setFont('helvetica', 'bold');
  doc.text('Already Paid:', margin + (contentWidth * 0.5), yPosition);
  doc.setFont('helvetica', 'normal');
  doc.text(`PKR ${paidAmt.toLocaleString('en-PK')}`, margin + (contentWidth * 0.5) + 35, yPosition);

  yPosition += 6;
  doc.setFont('helvetica', 'bold');
  doc.text('Outstanding:', margin, yPosition);
  doc.setFont('helvetica', 'normal');
  doc.text(`PKR ${remainingAmt.toLocaleString('en-PK')}`, margin + 35, yPosition);

  yPosition += 12;

  yPosition += 10;

  // Simple Total Summary
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('Total Payable:', margin, yPosition);
  doc.setFont('helvetica', 'normal');
  doc.text(`PKR ${remainingAmt.toLocaleString('en-PK')}`, margin + 35, yPosition);

  yPosition += 15;
  
  // INSTRUCTIONS
  yPosition += 10;
  doc.setFontSize(9);
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(0, 0, 0);
  doc.text('• Please pay before the due date to avoid late charges.', margin, yPosition);
  
  yPosition += 5;
  doc.text('• Keep this voucher for your personal records.', margin, yPosition);

  // Footer Signatures
  const footerY = pageHeight - 30;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('_________________________', margin + 30, footerY, { align: 'center' });
  doc.text('Student/Parent Signature', margin + 30, footerY + 5, { align: 'center' });

  doc.text('_________________________', margin + contentWidth - 30, footerY, { align: 'center' });
  doc.text('Accounts Officer', margin + contentWidth - 30, footerY + 5, { align: 'center' });
  
  return Buffer.from(doc.output('arraybuffer'));
};