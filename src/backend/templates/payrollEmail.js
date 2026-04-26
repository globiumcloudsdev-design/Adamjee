/**
 * Email Templates for Payroll Management
 * Returns HTML email body based on template type
 */

export const getPayrollEmailTemplate = (type, data) => {
  const { teacher, payroll, month, year } = data;
  const coachingName = 'Adamjee Coaching';

  const baseStyles = `
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    color: #333;
    line-height: 1.6;
  `;

  const headerStyles = `
    background: linear-gradient(135deg, #27ae60 0%, #229954 100%);
    color: white;
    padding: 30px;
    text-align: center;
    border-radius: 8px 8px 0 0;
  `;

  const containerStyles = `
    max-width: 650px;
    margin: 0 auto;
    border: 1px solid #ddd;
    border-radius: 8px;
    overflow: hidden;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
  `;

  const contentStyles = `
    padding: 30px;
    background: #f9f9f9;
  `;

  const detailsStyles = `
    background: white;
    padding: 20px;
    border-radius: 6px;
    margin: 20px 0;
    border-left: 4px solid #27ae60;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  `;

  const footerStyles = `
    background: #2c3e50;
    padding: 20px;
    text-align: center;
    font-size: 12px;
    color: #ecf0f1;
  `;

  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 
                      'July', 'August', 'September', 'October', 'November', 'December'];

  if (type === 'SALARY_SLIP') {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body { ${baseStyles} margin: 0; padding: 20px; background: #ecf0f1; }
          .container { ${containerStyles} }
          .header { ${headerStyles} }
          .content { ${contentStyles} }
          .details { ${detailsStyles} }
          .footer { ${footerStyles} }
          .salary-badge { 
            background: linear-gradient(135deg, #27ae60 0%, #229954 100%);
            color: white; 
            padding: 20px 25px; 
            border-radius: 8px; 
            display: inline-block; 
            margin: 20px 0; 
            font-weight: 700;
            font-size: 24px;
            box-shadow: 0 4px 8px rgba(39, 174, 96, 0.3);
          }
          .info-row {
            display: flex;
            justify-content: space-between;
            padding: 10px 0;
            border-bottom: 1px solid #ecf0f1;
          }
          .info-label {
            font-weight: 600;
            color: #555;
            width: 45%;
          }
          .info-value {
            color: #333;
            text-align: right;
            width: 50%;
          }
          .earnings-section {
            background: #e8f8f5;
            padding: 15px;
            border-radius: 6px;
            margin: 15px 0;
            border-left: 4px solid #27ae60;
          }
          .deductions-section {
            background: #fadbd8;
            padding: 15px;
            border-radius: 6px;
            margin: 15px 0;
            border-left: 4px solid #e74c3c;
          }
          .total-row {
            font-size: 16px;
            font-weight: bold;
            padding-top: 10px;
            border-top: 2px solid #27ae60;
          }
          .attachment-notice {
            background: #fff3cd;
            padding: 15px;
            border-radius: 6px;
            margin: 20px 0;
            border-left: 4px solid #ffc107;
            color: #856404;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="margin: 0; font-size: 32px;">💰 ${coachingName}</h1>
            <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.95;">Salary Slip - ${monthNames[month - 1]} ${year}</p>
          </div>
          
          <div class="content">
            <p style="margin-top: 0; font-size: 17px; font-weight: 500;">Dear ${teacher.firstName} ${teacher.lastName},</p>
            
            <p style="font-size: 15px;">Your salary for <strong>${monthNames[month - 1]} ${year}</strong> has been processed. Please find your detailed salary slip attached to this email.</p>
            
            <div class="attachment-notice">
              <strong>📎 Attachment:</strong> Your complete salary slip is attached as a PDF file. Please download and save it for your records.
            </div>

            <div style="text-align: center;">
              <div class="salary-badge">
                Net Salary: PKR ${payroll.netSalary.toLocaleString()}
              </div>
            </div>
            
            <div style="${detailsStyles}">
              <h3 style="margin-top: 0; color: #27ae60; font-size: 18px;">📊 Salary Summary</h3>
              
              <div class="earnings-section">
                <h4 style="margin: 0 0 10px 0; color: #27ae60;">Earnings</h4>
                <div class="info-row">
                  <span class="info-label">Basic Salary:</span>
                  <span class="info-value">PKR ${payroll.basicSalary.toLocaleString()}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">House Rent:</span>
                  <span class="info-value">PKR ${payroll.allowances.houseRent.toLocaleString()}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Medical:</span>
                  <span class="info-value">PKR ${payroll.allowances.medical.toLocaleString()}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Transport:</span>
                  <span class="info-value">PKR ${payroll.allowances.transport.toLocaleString()}</span>
                </div>
                ${payroll.allowances.other > 0 ? `
                <div class="info-row">
                  <span class="info-label">Other Allowances:</span>
                  <span class="info-value">PKR ${payroll.allowances.other.toLocaleString()}</span>
                </div>
                ` : ''}
                <div class="info-row total-row">
                  <span class="info-label">Gross Salary:</span>
                  <span class="info-value" style="color: #27ae60;">PKR ${payroll.grossSalary.toLocaleString()}</span>
                </div>
              </div>

              <div class="deductions-section">
                <h4 style="margin: 0 0 10px 0; color: #e74c3c;">Deductions</h4>
                ${payroll.deductions.tax > 0 ? `
                <div class="info-row">
                  <span class="info-label">Tax:</span>
                  <span class="info-value">PKR ${payroll.deductions.tax.toLocaleString()}</span>
                </div>
                ` : ''}
                ${payroll.deductions.providentFund > 0 ? `
                <div class="info-row">
                  <span class="info-label">Provident Fund:</span>
                  <span class="info-value">PKR ${payroll.deductions.providentFund.toLocaleString()}</span>
                </div>
                ` : ''}
                ${payroll.deductions.insurance > 0 ? `
                <div class="info-row">
                  <span class="info-label">Insurance:</span>
                  <span class="info-value">PKR ${payroll.deductions.insurance.toLocaleString()}</span>
                </div>
                ` : ''}
                ${payroll.attendanceDeduction.calculatedDeduction > 0 ? `
                <div class="info-row">
                  <span class="info-label">Absence Deduction (${payroll.attendanceDeduction.absentDays} days):</span>
                  <span class="info-value">PKR ${payroll.attendanceDeduction.calculatedDeduction.toLocaleString()}</span>
                </div>
                ` : ''}
                ${payroll.deductions.other > 0 ? `
                <div class="info-row">
                  <span class="info-label">Other Deductions:</span>
                  <span class="info-value">PKR ${payroll.deductions.other.toLocaleString()}</span>
                </div>
                ` : ''}
                <div class="info-row total-row" style="border-top-color: #e74c3c;">
                  <span class="info-label">Total Deductions:</span>
                  <span class="info-value" style="color: #e74c3c;">PKR ${payroll.totalDeductions.toLocaleString()}</span>
                </div>
              </div>
            </div>

            ${payroll.attendanceDeduction.totalWorkingDays > 0 ? `
            <div style="${detailsStyles}">
              <h3 style="margin-top: 0; color: #3498db; font-size: 18px;">📅 Attendance Summary</h3>
              <div class="info-row">
                <span class="info-label">Total Working Days:</span>
                <span class="info-value">${payroll.attendanceDeduction.totalWorkingDays}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Present Days:</span>
                <span class="info-value" style="color: #27ae60;">${payroll.attendanceDeduction.presentDays}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Absent Days:</span>
                <span class="info-value" style="color: #e74c3c;">${payroll.attendanceDeduction.absentDays}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Leave Days:</span>
                <span class="info-value" style="color: #f39c12;">${payroll.attendanceDeduction.leaveDays}</span>
              </div>
            </div>
            ` : ''}

            ${teacher.teacherProfile?.salaryDetails?.bankAccount ? `
            <div style="${detailsStyles}">
              <h3 style="margin-top: 0; color: #9b59b6; font-size: 18px;">🏦 Bank Details</h3>
              <div class="info-row">
                <span class="info-label">Bank Name:</span>
                <span class="info-value">${teacher.teacherProfile.salaryDetails.bankAccount.bankName || 'N/A'}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Account Number:</span>
                <span class="info-value">${teacher.teacherProfile.salaryDetails.bankAccount.accountNumber || 'N/A'}</span>
              </div>
              ${teacher.teacherProfile.salaryDetails.bankAccount.iban ? `
              <div class="info-row">
                <span class="info-label">IBAN:</span>
                <span class="info-value">${teacher.teacherProfile.salaryDetails.bankAccount.iban}</span>
              </div>
              ` : ''}
            </div>
            ` : ''}

            ${payroll.remarks ? `
            <div style="${detailsStyles}">
              <h3 style="margin-top: 0; color: #e67e22; font-size: 18px;">📝 Remarks</h3>
              <p style="margin: 0; font-size: 14px; color: #555;">${payroll.remarks}</p>
            </div>
            ` : ''}
            
            <div style="background: #e8f8f5; padding: 20px; border-radius: 6px; margin: 25px 0; text-align: center;">
              <p style="margin: 0; font-size: 14px; color: #16a085;">
                <strong>💡 Note:</strong> Please download the attached PDF for a complete detailed salary slip. Keep it safe for your records.
              </p>
            </div>
            
            <p style="margin: 25px 0 0 0; color: #555; font-size: 14px;">If you have any questions regarding your salary, please contact the accounts department.</p>
            
            <p style="margin: 20px 0 0 0;">Best regards,<br><strong>${coachingName} Accounts Department</strong></p>
          </div>
          
          <div class="footer">
            <p style="margin: 0;">This is an automated email from the payroll system.</p>
            <p style="margin: 10px 0 0 0;">&copy; ${new Date().getFullYear()} ${coachingName}. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  // Default template
  return `<html><body><p>Hello ${teacher.firstName},</p><p>Your payroll information has been updated.</p></body></html>`;
};
