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

  // Enhanced Professional Color Palette
  const primaryColor = [0, 102, 204]; // Professional Blue
  const secondaryColor = [52, 73, 94]; // Dark Gray
  const accentColor = [34, 197, 94]; // Green for amounts
  const warningColor = [245, 158, 11]; // Amber for warnings
  const borderColor = [229, 231, 235]; // Light Gray for borders
  const highlightColor = [254, 252, 232]; // Soft Yellow for highlights
  const lightGray = [248, 250, 252]; // Very light gray background
  const darkBlue = [23, 37, 84]; // Dark blue for headers

  // Page dimensions
  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;
  const margin = isMobile ? 8 : 12; // Reduced margin for better content fit
  const contentWidth = pageWidth - (2 * margin);

  // Responsive font sizes
  const h1Size = isMobile ? 18 : 24;
  const h2Size = isMobile ? 14 : 18;
  const h3Size = isMobile ? 12 : 14;
  const bodySize = isMobile ? 9 : 10;
  const smallSize = isMobile ? 7 : 8;

  // Responsive spacing
  const lineHeight = isMobile ? 6 : 7;
  const sectionGap = isMobile ? 10 : 15;
  const boxPadding = isMobile ? 6 : 8; // Reduced padding

  // Clear background with subtle gradient effect
  doc.setFillColor(255, 255, 255);
  doc.rect(0, 0, pageWidth, pageHeight, 'F');

  // Add subtle background pattern
  doc.setFillColor(250, 250, 250);
  doc.rect(0, 0, pageWidth, 40, 'F');
  
  // ========== HEADER SECTION ==========
  let yPosition = margin;

  // Enhanced Coaching Header with gradient effect
  const headerSectionHeight = isMobile ? 35 : 45;

  // Main header background
  doc.setFillColor(...primaryColor);
  doc.roundedRect(margin, yPosition, contentWidth, headerSectionHeight, 3, 3, 'F');

  // Add gradient effect with lighter blue
  doc.setFillColor(100, 150, 255);
  doc.roundedRect(margin, yPosition, contentWidth, headerSectionHeight * 0.6, 3, 3, 'F');

  // Coaching badge/logo with enhanced styling
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(...primaryColor);
  doc.setLineWidth(1.5);
  doc.roundedRect(margin + (isMobile ? 6 : 8), yPosition + (isMobile ? 6 : 8),
                  isMobile ? 20 : 25, isMobile ? 20 : 25, 3, 3, 'FD');
  doc.setTextColor(...primaryColor);
  doc.setFontSize(isMobile ? 12 : 15);
  doc.setFont('helvetica', 'bold');
  doc.text('EA', margin + (isMobile ? 6 : 8) + (isMobile ? 10 : 12.5), 
           yPosition + (isMobile ? 6 : 8) + (isMobile ? 10 : 12.5), 
           { align: 'center', baseline: 'middle' });

  // Coaching name with enhanced positioning
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(h1Size);
  doc.setFont('helvetica', 'bold');
  const coachingName = 'ADAMJEE COACHING';
  const coachingX = isMobile ? margin + 32 : margin + 40;

  // Add subtle shadow for text
  doc.setTextColor(0, 50, 100, 0.3);
  doc.text(coachingName, coachingX + 1, yPosition + (isMobile ? 14 : 18) + 1);
  doc.setTextColor(255, 255, 255);
  doc.text(coachingName, coachingX, yPosition + (isMobile ? 14 : 18));

  // Coaching motto with better positioning
  if (!isMobile) {
    doc.setFontSize(bodySize - 1);
    doc.setFont('helvetica', 'italic');
    doc.text('Center of Excellence in Education', margin + 40, yPosition + 25);
  }

  // Enhanced Voucher title with background
  const titleY = yPosition + (isMobile ? 26 : 32);
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(...primaryColor);
  doc.setLineWidth(0.8);
  doc.roundedRect(pageWidth / 2 - 50, titleY - 3, 100, isMobile ? 8 : 10, 2, 2, 'FD');

  doc.setTextColor(...primaryColor);
  doc.setFontSize(h2Size);
  doc.setFont('helvetica', 'bold');
  doc.text('FEE VOUCHER', pageWidth / 2, titleY + (isMobile ? 1.5 : 2), 
           { align: 'center', baseline: 'middle' });

  yPosition += headerSectionHeight + (isMobile ? 4 : 6);
  
  // ========== VOUCHER INFO BADGE ==========
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(...primaryColor);
  doc.setLineWidth(0.5);
  doc.roundedRect(margin, yPosition, contentWidth, isMobile ? 16 : 20, 2, 2, 'FD');
  
  // Voucher number
  doc.setTextColor(...primaryColor);
  doc.setFontSize(h3Size);
  doc.setFont('helvetica', 'bold');
  const voucherText = isMobile ? `Voucher #${voucher.voucherNumber}` : `Voucher #${voucher.voucherNumber}`;
  doc.text(voucherText, margin + boxPadding, yPosition + (isMobile ? 6 : 8));
  
  // Issue date
  doc.setFontSize(bodySize);
  doc.setFont('helvetica', 'normal');
  const issueDate = new Date().toLocaleDateString('en-PK', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
  doc.text(`Issued: ${issueDate}`, margin + contentWidth - boxPadding, 
           yPosition + (isMobile ? 6 : 8), 
           { align: 'right', baseline: 'middle' });
  
  yPosition += isMobile ? 18 : 22;
  
  // ========== STUDENT INFORMATION SECTION ==========
  // Section header with enhanced styling
  doc.setFillColor(...primaryColor);
  doc.roundedRect(margin, yPosition, contentWidth, isMobile ? 7 : 9, 2, 2, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(h3Size);
  doc.setFont('helvetica', 'bold');
  doc.text('STUDENT DETAILS', margin + boxPadding, yPosition + (isMobile ? 4 : 5));

  yPosition += (isMobile ? 8 : 10);

  // Enhanced Student info box with gradient background
  const studentBoxHeight = isMobile ? 45 : 50;

  // Main background
  doc.setFillColor(249, 250, 251);
  doc.roundedRect(margin, yPosition, contentWidth, studentBoxHeight, 3, 3, 'F');

  // Add subtle gradient effect
  doc.setFillColor(240, 245, 250);
  doc.roundedRect(margin, yPosition, contentWidth, studentBoxHeight * 0.4, 3, 3, 'F');

  // Border with primary color
  doc.setDrawColor(...primaryColor);
  doc.setLineWidth(0.8);
  doc.roundedRect(margin, yPosition, contentWidth, studentBoxHeight, 3, 3, 'S');
  
  const studentY = yPosition + boxPadding;
  
  // Get student data with fallbacks
  const studentName = voucher.studentId?.fullName ||
                     `${voucher.studentId?.firstName || ''} ${voucher.studentId?.lastName || ''}`.trim() ||
                     'N/A';
  const guardianType = voucher.studentId?.studentProfile?.guardianType || 'parent';
  const parentLabel = guardianType === 'guardian' ? 'Guardian:' : 'Father:';
  const parentName = guardianType === 'guardian'
    ? (voucher.studentId?.studentProfile?.guardian?.name || 'N/A')
    : (voucher.studentId?.fatherName || voucher.studentId?.studentProfile?.father?.name || 'N/A');
  const registrationNumber = voucher.studentId?.studentProfile?.registrationNumber ||
                            voucher.studentId?.registrationNumber || 'N/A';
  const rollNumber = voucher.studentId?.studentProfile?.rollNumber ||
                    voucher.studentId?.rollNumber || 'N/A';
  const className = voucher.classId?.name || 'N/A';
  const section = voucher.studentId?.studentProfile?.section || 'N/A';
  const branchName = voucher.branchId?.name || 'N/A';
  
  doc.setFontSize(bodySize);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(0, 0, 0);
  
  if (isMobile) {
    // Mobile: Stacked layout with proper alignment
    const labelValueGap = 4;
    const rowSpacing = lineHeight + 1;
    
    // First row: Student Name
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...secondaryColor);
    doc.text('Student:', margin + boxPadding, studentY, { baseline: 'middle' });
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(0, 0, 0);
    const studentLabelWidth = doc.getTextWidth('Student:');
    // Check if name fits, otherwise truncate
    let displayName = studentName;
    const maxNameWidth = contentWidth - (boxPadding * 2) - studentLabelWidth - labelValueGap;
    if (doc.getTextWidth(displayName) > maxNameWidth) {
      while (doc.getTextWidth(displayName + '...') > maxNameWidth && displayName.length > 3) {
        displayName = displayName.slice(0, -1);
      }
      displayName = displayName + '...';
    }
    doc.text(displayName, margin + boxPadding + studentLabelWidth + labelValueGap, 
             studentY, { baseline: 'middle' });

    // Second row: Class & Section
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...secondaryColor);
    doc.text('Class:', margin + boxPadding, studentY + rowSpacing, { baseline: 'middle' });
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(0, 0, 0);
    const classLabelWidth = doc.getTextWidth('Class:');
    doc.text(`${className} - ${section}`, margin + boxPadding + classLabelWidth + labelValueGap, 
             studentY + rowSpacing, { baseline: 'middle' });

    // Third row: Parent/Guardian
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...secondaryColor);
    doc.text(parentLabel, margin + boxPadding, studentY + (rowSpacing * 2), { baseline: 'middle' });
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(0, 0, 0);
    const parentLabelWidth = doc.getTextWidth(parentLabel);
    // Check if parent name fits
    let displayParentName = parentName;
    const maxParentWidth = contentWidth - (boxPadding * 2) - parentLabelWidth - labelValueGap;
    if (doc.getTextWidth(displayParentName) > maxParentWidth) {
      while (doc.getTextWidth(displayParentName + '...') > maxParentWidth && displayParentName.length > 3) {
        displayParentName = displayParentName.slice(0, -1);
      }
      displayParentName = displayParentName + '...';
    }
    doc.text(displayParentName, margin + boxPadding + parentLabelWidth + labelValueGap, 
             studentY + (rowSpacing * 2), { baseline: 'middle' });

    // Fourth row: Registration & Roll Number
    const fourthRowY = studentY + (rowSpacing * 3);
    
    // Registration Number
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...secondaryColor);
    doc.text('Reg #:', margin + boxPadding, fourthRowY, { baseline: 'middle' });
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(0, 0, 0);
    const regLabelWidth = doc.getTextWidth('Reg #:');
    doc.text(registrationNumber, margin + boxPadding + regLabelWidth + labelValueGap, 
             fourthRowY, { baseline: 'middle' });

    // Fifth row: Roll Number & Branch
    const fifthRowY = studentY + (rowSpacing * 4);
    
    // Roll Number
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...secondaryColor);
    doc.text('Roll #:', margin + boxPadding, fifthRowY, { baseline: 'middle' });
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(0, 0, 0);
    const rollLabelWidth = doc.getTextWidth('Roll #:');
    doc.text(rollNumber, margin + boxPadding + rollLabelWidth + labelValueGap, 
             fifthRowY, { baseline: 'middle' });

    // Branch (on same line if space available)
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...secondaryColor);
    const rollEndX = margin + boxPadding + rollLabelWidth + labelValueGap + doc.getTextWidth(rollNumber);
    if (rollEndX + doc.getTextWidth('Branch:') + labelValueGap + doc.getTextWidth(branchName) < margin + contentWidth - boxPadding) {
      doc.text('Branch:', rollEndX + 10, fifthRowY, { baseline: 'middle' });
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(0, 0, 0);
      const branchLabelWidth = doc.getTextWidth('Branch:');
      doc.text(branchName, rollEndX + 10 + branchLabelWidth + labelValueGap, 
               fifthRowY, { baseline: 'middle' });
    }

  } else {
    // Desktop: Two-column layout with adjusted widths
    const labelWidth = 35; // Reduced for better fit
    const leftColX = margin + boxPadding;
    const rightColX = margin + (contentWidth * 0.55); // Adjusted column split
    const valueOffset = labelWidth + 3; // Reduced space between label and value
    
    // Set font for labels
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...secondaryColor);
    
    // Left Column - Labels
    doc.text('Student Name:', leftColX, studentY, { baseline: 'middle' });
    doc.text('Class & Section:', leftColX, studentY + lineHeight, { baseline: 'middle' });
    doc.text(parentLabel, leftColX, studentY + (lineHeight * 2), { baseline: 'middle' });

    // Right Column - Labels
    doc.text('Registration #:', rightColX, studentY, { baseline: 'middle' });
    doc.text('Roll Number:', rightColX, studentY + lineHeight, { baseline: 'middle' });
    doc.text('Branch:', rightColX, studentY + (lineHeight * 2), { baseline: 'middle' });

    // Set font for values
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(0, 0, 0);
    
    // Calculate available width for values
    const leftValueWidth = rightColX - leftColX - valueOffset - 5;
    const rightValueWidth = margin + contentWidth - rightColX - valueOffset - boxPadding;
    
    // Left Column - Values with text wrapping
    let displayStudentName = studentName;
    if (doc.getTextWidth(displayStudentName) > leftValueWidth) {
      while (doc.getTextWidth(displayStudentName + '...') > leftValueWidth && displayStudentName.length > 3) {
        displayStudentName = displayStudentName.slice(0, -1);
      }
      displayStudentName = displayStudentName + '...';
    }
    doc.text(displayStudentName, leftColX + valueOffset, studentY, { baseline: 'middle' });
    
    doc.text(`${className} - ${section}`, leftColX + valueOffset, studentY + lineHeight, { baseline: 'middle' });
    
    let displayParentName = parentName;
    if (doc.getTextWidth(displayParentName) > leftValueWidth) {
      while (doc.getTextWidth(displayParentName + '...') > leftValueWidth && displayParentName.length > 3) {
        displayParentName = displayParentName.slice(0, -1);
      }
      displayParentName = displayParentName + '...';
    }
    doc.text(displayParentName, leftColX + valueOffset, studentY + (lineHeight * 2), { baseline: 'middle' });

    // Right Column - Values
    doc.text(registrationNumber, rightColX + valueOffset, studentY, { baseline: 'middle' });
    doc.text(rollNumber, rightColX + valueOffset, studentY + lineHeight, { baseline: 'middle' });
    doc.text(branchName, rightColX + valueOffset, studentY + (lineHeight * 2), { baseline: 'middle' });
  }
  
  yPosition += studentBoxHeight + (isMobile ? 4 : 6);
  
  // ========== FEE PERIOD SECTION ==========
  // Section header with enhanced styling
  doc.setFillColor(...primaryColor);
  doc.roundedRect(margin, yPosition, contentWidth, isMobile ? 7 : 9, 2, 2, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(h3Size);
  doc.setFont('helvetica', 'bold');
  doc.text('FEE PERIOD', margin + boxPadding, yPosition + (isMobile ? 4 : 5));

  yPosition += (isMobile ? 8 : 10);

  // Enhanced Fee period box with gradient background
  const periodBoxHeight = isMobile ? 16 : 18;

  // Main background
  doc.setFillColor(249, 250, 251);
  doc.roundedRect(margin, yPosition, contentWidth, periodBoxHeight, 3, 3, 'F');

  // Add subtle gradient effect
  doc.setFillColor(240, 245, 250);
  doc.roundedRect(margin, yPosition, contentWidth, periodBoxHeight * 0.4, 3, 3, 'F');

  // Border with primary color
  doc.setDrawColor(...primaryColor);
  doc.setLineWidth(0.8);
  doc.roundedRect(margin, yPosition, contentWidth, periodBoxHeight, 3, 3, 'S');
  
  const periodY = yPosition + boxPadding;
  
  const monthName = MONTHS.find(m => m.value === voucher.month.toString())?.label || voucher.month;
  const dueDate = voucher.dueDate ? new Date(voucher.dueDate).toLocaleDateString('en-PK', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  }) : 'N/A';
  
  doc.setFontSize(bodySize);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(0, 0, 0);
  
  if (isMobile) {
    // Mobile: Two lines for better readability
    doc.text(`Month: ${monthName} ${voucher.year}`, 
             margin + boxPadding, periodY, { baseline: 'middle' });
    doc.text(`Due: ${dueDate}`, 
             margin + contentWidth - boxPadding, periodY, 
             { align: 'right', baseline: 'middle' });
  } else {
    // Desktop: Three sections with proper spacing
    const centerY = periodY;
    
    // Left: Month and Year
    doc.text(`For: ${monthName} ${voucher.year}`, 
             margin + boxPadding, centerY, { baseline: 'middle' });
    
    // Center: Due Date
    doc.text(`Due: ${dueDate}`, 
             pageWidth / 2, centerY, 
             { align: 'center', baseline: 'middle' });
    
    // Right: Fee Template (truncated if needed)
    const templateName = voucher.templateId?.name || 'N/A';
    let displayTemplate = `Template: ${templateName}`;
    const maxTemplateWidth = contentWidth * 0.3;
    if (doc.getTextWidth(displayTemplate) > maxTemplateWidth) {
      while (doc.getTextWidth(displayTemplate + '...') > maxTemplateWidth && displayTemplate.length > 10) {
        displayTemplate = displayTemplate.slice(0, -1);
      }
      displayTemplate = displayTemplate + '...';
    }
    doc.text(displayTemplate, 
             margin + contentWidth - boxPadding, centerY, 
             { align: 'right', baseline: 'middle' });
  }
  
  yPosition += periodBoxHeight + (isMobile ? 4 : 6);

  // ========== FEE BREAKDOWN SECTION ==========
  // Section header
  doc.setFillColor(...primaryColor);
  doc.roundedRect(margin, yPosition, contentWidth, isMobile ? 7 : 9, 2, 2, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(h3Size);
  doc.setFont('helvetica', 'bold');
  doc.text('FEE BREAKDOWN', margin + boxPadding, yPosition + (isMobile ? 4 : 5));

  yPosition += (isMobile ? 8 : 10);

  // Prepare fee items dynamically from voucher
  const feeItems = [];
  
  // 1. Add Base Amount if exists
  if (voucher.baseAmount > 0) {
    feeItems.push({ description: 'Base Template Amount', amount: voucher.baseAmount });
  }

  // 2. Add Template Items/Components
  if (voucher.items && voucher.items.length > 0) {
    voucher.items.forEach(item => {
      feeItems.push({ description: item.name, amount: item.amount || 0 });
    });
  } else if (voucher.templateId?.items && voucher.templateId.items.length > 0) {
    // Fallback to template items if voucher doesn't have them (for older vouchers)
    voucher.templateId.items.forEach(item => {
      feeItems.push({ description: item.name, amount: item.amount || 0 });
    });
  } else {
    // Ultimate fallback for very old vouchers
    feeItems.push({ description: 'Tuition Fee', amount: voucher.amount || 0 });
  }

  // 3. Add Late Fee if applicable
  if (voucher.lateFeeAmount > 0) {
    feeItems.push({ description: 'Late Fee Fine', amount: voucher.lateFeeAmount });
  }

  // Filter non-zero items (except we might want to show 0 if user asked for it, but usually non-zero is cleaner)
  // User said: "r agar ksi component mein Amount hoto Amount aye wrna 0 aye"
  // This implies they want to see all components even if 0.
  const displayItems = feeItems;

  // Add discount if applicable
  if (voucher.discountAmount > 0) {
    displayItems.push({ description: 'Discount', amount: -voucher.discountAmount });
  }

  // Calculate table dimensions
  const headerHeight = isMobile ? 10 : 12;
  const rowHeight = isMobile ? 10 : 12;
  const totalRowHeight = isMobile ? 12 : 15;
  const tableHeight = headerHeight + (displayItems.length * rowHeight) + totalRowHeight;

  // Calculate column widths - optimized for better fit
  const descColWidth = contentWidth * 0.6; // 60% for description
  const amountColWidth = contentWidth * 0.4; // 40% for amount

  // Column positions
  const descHeaderX = margin + boxPadding;
  const amountHeaderX = margin + descColWidth;
  const amountEndX = margin + contentWidth - boxPadding;

  // Table header
  doc.setFillColor(...primaryColor);
  doc.roundedRect(margin, yPosition, contentWidth, headerHeight, 1, 1, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(isMobile ? 9 : 11);
  doc.setFont('helvetica', 'bold');
  doc.text('Description', descHeaderX, yPosition + headerHeight/2, { baseline: 'middle' });
  doc.text('Amount (PKR)', amountEndX, yPosition + headerHeight/2, { align: 'right', baseline: 'middle' });

  let currentY = yPosition + headerHeight;

  // Table rows
  let subTotal = 0;

  displayItems.forEach((item, index) => {
    // Alternate row background
    if (index % 2 === 0) {
      doc.setFillColor(255, 255, 255);
    } else {
      doc.setFillColor(249, 250, 251);
    }
    doc.rect(margin, currentY, contentWidth, rowHeight, 'F');

    // Description with truncation
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(isMobile ? 8 : 10);

    let description = item.description;
    const maxDescWidth = descColWidth - (boxPadding * 2);
    
    if (doc.getTextWidth(description) > maxDescWidth) {
      while (doc.getTextWidth(description + '...') > maxDescWidth && description.length > 3) {
        description = description.slice(0, -1);
      }
      description = description + '...';
    }

    doc.text(description, descHeaderX, currentY + rowHeight/2, { baseline: 'middle' });

    // Amount
    const amountText = Math.abs(item.amount).toLocaleString('en-PK');
    const amountColor = item.amount < 0 ? [220, 38, 38] : secondaryColor; // Red for discount
    doc.setTextColor(...amountColor);
    doc.setFont('helvetica', 'bold');

    const formattedAmount = item.amount < 0 ? `-${amountText}` : amountText;
    doc.text(formattedAmount, amountEndX, currentY + rowHeight/2, { align: 'right', baseline: 'middle' });

    subTotal += item.amount;
    currentY += rowHeight;
  });

  // Total row
  const totalAmount = voucher.totalAmount || Math.max(0, subTotal);

  doc.setFillColor(...highlightColor);
  doc.roundedRect(margin, currentY, contentWidth, totalRowHeight, 1, 1, 'F');

  doc.setDrawColor(245, 158, 11);
  doc.setLineWidth(0.5);
  doc.rect(margin, currentY, contentWidth, totalRowHeight);

  doc.setFontSize(isMobile ? 10 : 12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(133, 77, 14);

  const totalLabel = 'TOTAL PAYABLE:';
  doc.text(totalLabel, descHeaderX, currentY + totalRowHeight/2, { baseline: 'middle' });

  const totalText = totalAmount.toLocaleString('en-PK');
  doc.text(totalText, amountEndX, currentY + totalRowHeight/2, { align: 'right', baseline: 'middle' });

  // Add vertical line to separate columns
  doc.setDrawColor(...borderColor);
  doc.setLineWidth(0.3);
  doc.line(amountHeaderX, yPosition, amountHeaderX, yPosition + tableHeight);

  // Add border around entire table
  doc.setDrawColor(...borderColor);
  doc.setLineWidth(0.5);
  doc.roundedRect(margin, yPosition, contentWidth, tableHeight, 2, 2, 'S');

  yPosition += tableHeight + (isMobile ? 8 : 12);

  // ========== PAYMENT STATUS SECTION ==========
  if (voucher.paidAmount > 0) {
    const paidAmount = voucher.paidAmount || 0;
    const remainingAmount = Math.max(0, totalAmount - paidAmount);
    
    const statusBoxHeight = isMobile ? 30 : 35;
    
    doc.setFillColor(240, 253, 244);
    doc.roundedRect(margin, yPosition, contentWidth, statusBoxHeight, 2, 2, 'F');
    doc.setDrawColor(34, 197, 94);
    doc.setLineWidth(0.8);
    doc.rect(margin, yPosition, contentWidth, statusBoxHeight);
    
    // Status title
    doc.setTextColor(21, 128, 61);
    doc.setFontSize(isMobile ? 11 : 13);
    doc.setFont('helvetica', 'bold');
    doc.text('PAYMENT STATUS', margin + boxPadding, yPosition + (statusBoxHeight/3), { baseline: 'middle' });
    
    // Amount details
    doc.setFontSize(isMobile ? 9 : 11);
    doc.setFont('helvetica', 'normal');
    
    if (isMobile) {
      doc.setTextColor(21, 128, 61);
      doc.text(`Paid: ${paidAmount.toLocaleString('en-PK')}`, 
               margin + boxPadding, yPosition + (statusBoxHeight * 2/3), { baseline: 'middle' });
      
      if (remainingAmount > 0) {
        doc.setTextColor(220, 38, 38);
        doc.text(`Due: ${remainingAmount.toLocaleString('en-PK')}`, 
                 margin + contentWidth - boxPadding, yPosition + (statusBoxHeight * 2/3), 
                 { align: 'right', baseline: 'middle' });
      } else {
        doc.setTextColor(21, 128, 61);
        doc.text('✓ Fully Paid', margin + contentWidth - boxPadding, yPosition + (statusBoxHeight * 2/3), 
                 { align: 'right', baseline: 'middle' });
      }
    } else {
      doc.setTextColor(21, 128, 61);
      doc.text(`Amount Paid: ${paidAmount.toLocaleString('en-PK')}`, 
               margin + boxPadding, yPosition + (statusBoxHeight * 2/3), { baseline: 'middle' });
      
      if (remainingAmount > 0) {
        doc.setTextColor(220, 38, 38);
        doc.text(`Balance Due: ${remainingAmount.toLocaleString('en-PK')}`, 
                 margin + contentWidth - boxPadding, yPosition + (statusBoxHeight * 2/3), 
                 { align: 'right', baseline: 'middle' });
      } else {
        doc.setTextColor(21, 128, 61);
        doc.text('✓ Fully Paid', margin + contentWidth - boxPadding, yPosition + (statusBoxHeight * 2/3), 
                 { align: 'right', baseline: 'middle' });
      }
    }
    
    yPosition += statusBoxHeight + (isMobile ? 8 : 12);
  }

  // ========== INSTRUCTIONS SECTION ==========
  if (yPosition < pageHeight - 40) {
    doc.setTextColor(...secondaryColor);
    doc.setFontSize(isMobile ? 8 : 9);
    doc.setFont('helvetica', 'italic');
    
    const instructions = [
      '• Pay before due date to avoid late charges',
      '• Keep this voucher for your records',
      '• Contact accounts office for queries'
    ];
    
    instructions.forEach((instruction, index) => {
      const instructionY = yPosition + (index * (isMobile ? 3 : 4));
      doc.text(instruction, margin + 2, instructionY, { baseline: 'middle' });
    });
    
    yPosition += isMobile ? 15 : 20;
  }
  
  // ========== FOOTER SECTION ==========
  const footerY = pageHeight - margin - (isMobile ? 20 : 25);
  
  // Horizontal line
  doc.setDrawColor(...borderColor);
  doc.setLineWidth(0.3);
  doc.line(margin, footerY, margin + contentWidth, footerY);
  
  // Signature areas
  doc.setFontSize(smallSize);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  
  if (!isMobile) {
    // Desktop: Two signature areas
    doc.text('____________________', margin + 50, footerY + 6, 
             { align: 'center', baseline: 'middle' });
    doc.text('Student/Parent Signature', margin + 50, footerY + 10, 
             { align: 'center', baseline: 'middle' });
    
    doc.text('____________________', margin + contentWidth - 50, footerY + 6, 
             { align: 'center', baseline: 'middle' });
    doc.text('Accounts Officer', margin + contentWidth - 50, footerY + 10, 
             { align: 'center', baseline: 'middle' });
  } else {
    // Mobile: Single signature area centered
    doc.text('____________________', pageWidth / 2, footerY + 6, 
             { align: 'center', baseline: 'middle' });
    doc.text('Student/Parent Signature', pageWidth / 2, footerY + 10, 
             { align: 'center', baseline: 'middle' });
  }
  
  // Footer text
  doc.setFontSize(smallSize);
  doc.setFont('helvetica', 'italic');
  
  const footerNoteY = pageHeight - margin - 3;
  doc.text('Computer Generated Document - No Signature Required', 
           pageWidth / 2, footerNoteY, 
           { align: 'center', baseline: 'middle' });
  
  // Generation timestamp
  doc.setFont('helvetica', 'normal');
  const timestamp = new Date().toLocaleString('en-PK', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
  
  doc.text(`Generated: ${timestamp}`, 
           margin + contentWidth, footerY - 8, 
           { align: 'right', baseline: 'middle' });
  
  // Coaching contact information
  doc.setTextColor(...primaryColor);
  doc.setFontSize(smallSize);
  doc.setFont('helvetica', 'bold');
  
  const contactText = 'Adamjee Coaching • accounts@easeacademy.edu.pk • (042) 123-4567';
  const contactTextWidth = doc.getTextWidth(contactText);
  
  if (contactTextWidth > contentWidth) {
    // Split into two lines if too long
    doc.text('Adamjee Coaching • accounts@easeacademy.edu.pk', 
             margin, footerY - 15, { baseline: 'middle' });
    doc.text('(042) 123-4567', margin, footerY - 10, { baseline: 'middle' });
  } else {
    doc.text(contactText, margin, footerY - 12, { baseline: 'middle' });
  }
  
  return doc.output('arraybuffer');
};