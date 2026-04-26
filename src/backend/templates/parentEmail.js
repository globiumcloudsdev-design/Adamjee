/**
 * Email Templates for Parent Management
 * Returns HTML email body based on template type
 */

export const getParentEmailTemplate = (type, parent, coachingName = 'Adamjee Coaching') => {
  const baseStyles = `
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    color: #333;
    line-height: 1.6;
  `;

  const headerStyles = `
    background: linear-gradient(135deg, #2b7a78 0%, #1f8a70 100%);
    color: white;
    padding: 28px;
    text-align: center;
    border-radius: 8px 8px 0 0;
  `;

  const containerStyles = `
    max-width: 600px;
    margin: 0 auto;
    border: 1px solid #ddd;
    border-radius: 8px;
    overflow: hidden;
    box-shadow: 0 2px 8px rgba(0,0,0,0.06);
  `;

  const contentStyles = `
    padding: 26px;
    background: #f9f9f9;
  `;

  const detailsStyles = `
    background: white;
    padding: 18px;
    border-radius: 4px;
    margin: 16px 0;
    border-left: 4px solid #2b7a78;
  `;

  const footerStyles = `
    background: #f0f0f0;
    padding: 18px;
    text-align: center;
    font-size: 12px;
    color: #666;
    border-top: 1px solid #ddd;
  `;

  const parentInfo = `
    <div style="${detailsStyles}">
      <h4 style="margin-top: 0; color: #2b7a78;">Parent Information</h4>
      <table style="width:100%; font-size:14px;">
        <tr>
          <td style="padding:6px 0; font-weight:bold; width:40%;">Name:</td>
          <td style="padding:6px 0;">${parent.fullName || `${parent.firstName || ''} ${parent.lastName || ''}`.trim()}</td>
        </tr>
        <tr>
          <td style="padding:6px 0; font-weight:bold;">Email:</td>
          <td style="padding:6px 0;">${parent.email || 'N/A'}</td>
        </tr>
        <tr>
          <td style="padding:6px 0; font-weight:bold;">Phone:</td>
          <td style="padding:6px 0;">${parent.phone || 'N/A'}</td>
        </tr>
      </table>
    </div>
  `;

  if (type === 'PARENT_APPROVED') {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { ${baseStyles} }
          .container { ${containerStyles} }
          .header { ${headerStyles} }
          .content { ${contentStyles} }
          .details { ${detailsStyles} }
          .footer { ${footerStyles} }
          .success { background:#e6fffa; color:#065f46; padding:10px 14px; border-radius:4px; margin:12px 0; border:1px solid #b7f5e6; font-weight:600; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h2 style="margin:0; font-size:26px;">🛡️ ${coachingName}</h2>
            <p style="margin:8px 0 0 0; font-size:14px;">Account Approved</p>
          </div>
          <div class="content">
            <p style="margin-top:0; font-size:16px; font-weight:500;">Dear ${parent.firstName || parent.fullName || ''},</p>
            <div class="success">✅ Your account has been approved successfully!</div>

            ${parentInfo}

            <p style="margin:18px 0 0 0; color:#666; font-size:14px;">You can now access your parent dashboard to view your children's academic progress, attendance, announcements, and more.</p>

            <div style="${detailsStyles}">
              <h4 style="margin-top:0; color:#2b7a78;">Getting Started</h4>
              <ul style="margin:8px 0; padding-left:20px;">
                <li>Login to your account using your email and password</li>
                <li>View your children's profiles and academic records</li>
                <li>Check attendance and performance reports</li>
                <li>Receive important announcements and notifications</li>
                <li>Communicate with teachers and coaching administration</li>
              </ul>
            </div>

            <p style="margin:20px 0 0 0;">Welcome to the ${coachingName} family!</p>
            <p style="margin:8px 0 0 0;">Best regards,<br><strong>${coachingName} Administration</strong></p>
          </div>
          <div class="footer">
            <p style="margin:0;">This is an automated email. Please do not reply to this message.</p>
            <p style="margin:6px 0 0 0;">&copy; ${new Date().getFullYear()} ${coachingName}. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  // Fee Voucher Generated for Child
  if (type === 'CHILD_FEE_VOUCHER') {
    const { childName, voucherNumber, amount, dueDate, month, year, category, discountAmount, lateFeeAmount, totalAmount, className } = parent;
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { ${baseStyles} }
          .container { ${containerStyles} }
          .header { ${headerStyles} }
          .content { ${contentStyles} }
          .details { ${detailsStyles} }
          .footer { ${footerStyles} }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h2 style="margin:0; font-size:26px;">💳 Fee Voucher - ${coachingName}</h2>
            <p style="margin:8px 0 0 0; font-size:14px;">Payment Due Notification</p>
          </div>
          <div class="content">
            <p style="margin-top:0; font-size:16px; font-weight:500;">Dear ${parent.firstName || parent.fullName || 'Parent/Guardian'},</p>
            
            <div style="background:#e3f2fd; padding:12px 16px; border-radius:4px; margin:14px 0; border-left:4px solid #2196f3;">
              <strong style="color:#1565c0;">A fee voucher has been generated for your child.</strong>
            </div>

            <div class="details">
              <h4 style="margin-top:0; color:#2b7a78;">Student Details</h4>
              <table style="width:100%; font-size:14px;">
                <tr>
                  <td style="padding:6px 0; font-weight:bold; width:40%;">Student Name:</td>
                  <td style="padding:6px 0;"><strong>${childName}</strong></td>
                </tr>
                ${className ? `
                <tr>
                  <td style="padding:6px 0; font-weight:bold;">Class:</td>
                  <td style="padding:6px 0;">${className}</td>
                </tr>
                ` : ''}
              </table>
            </div>

            <div class="details">
              <h4 style="margin-top:0; color:#2b7a78;">Voucher Details</h4>
              <table style="width:100%; font-size:14px;">
                <tr>
                  <td style="padding:8px 0; font-weight:bold; width:40%;">Voucher Number:</td>
                  <td style="padding:8px 0;"><strong style="color:#2b7a78;">${voucherNumber}</strong></td>
                </tr>
                <tr>
                  <td style="padding:8px 0; font-weight:bold;">Fee Category:</td>
                  <td style="padding:8px 0;">${category || 'Monthly Fee'}</td>
                </tr>
                <tr>
                  <td style="padding:8px 0; font-weight:bold;">Month/Year:</td>
                  <td style="padding:8px 0;">${month}/${year}</td>
                </tr>
                <tr>
                  <td style="padding:8px 0; font-weight:bold;">Base Amount:</td>
                  <td style="padding:8px 0;">Rs. ${amount?.toLocaleString()}</td>
                </tr>
                ${discountAmount > 0 ? `
                <tr>
                  <td style="padding:8px 0; font-weight:bold; color:#27ae60;">Discount:</td>
                  <td style="padding:8px 0; color:#27ae60;">- Rs. ${discountAmount?.toLocaleString()}</td>
                </tr>
                ` : ''}
                ${lateFeeAmount > 0 ? `
                <tr>
                  <td style="padding:8px 0; font-weight:bold; color:#e74c3c;">Late Fee:</td>
                  <td style="padding:8px 0; color:#e74c3c;">+ Rs. ${lateFeeAmount?.toLocaleString()}</td>
                </tr>
                ` : ''}
                <tr style="border-top:2px solid #2b7a78;">
                  <td style="padding:12px 0; font-weight:bold; font-size:16px;">Total Payable:</td>
                  <td style="padding:12px 0; font-weight:bold; font-size:16px; color:#2b7a78;">Rs. ${totalAmount?.toLocaleString()}</td>
                </tr>
                <tr>
                  <td style="padding:8px 0; font-weight:bold;">Due Date:</td>
                  <td style="padding:8px 0; color:#e74c3c;"><strong>${new Date(dueDate).toLocaleDateString()}</strong></td>
                </tr>
              </table>
            </div>

            <div style="text-align:center; margin:20px 0;">
              <a href="${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/super-admin/fee-vouchers/${voucherId}/download" 
                 style="display:inline-block; background:#2b7a78; color:#ffffff; padding:12px 24px; text-decoration:none; border-radius:6px; font-weight:bold; font-size:16px; box-shadow:0 2px 4px rgba(0,0,0,0.1);">
                📄 Download Voucher
              </a>
            </div>

            ${lateFeeAmount > 0 ? `
            <div style="background:#fff3cd; padding:14px; border-radius:4px; margin:16px 0; border-left:4px solid #ffc107;">
              <strong style="color:#856404;">⚠️ Late Fee Applied:</strong>
              <p style="margin:6px 0 0 0; color:#856404;">A late fee of Rs. ${lateFeeAmount?.toLocaleString()} has been added due to previous unpaid fees. Please clear dues promptly to avoid additional charges.</p>
            </div>
            ` : ''}

            <div style="background:#d1ecf1; padding:14px; border-radius:4px; margin:16px 0; border-left:4px solid#17a2b8;">
              <strong style="color:#0c5460;">💡 Payment Instructions:</strong>
              <ul style="margin:10px 0; padding-left:20px; color:#0c5460;">
                <li>Please pay before the due date to avoid late fees</li>
                <li>Quote voucher number <strong>${voucherNumber}</strong> when making payment</li>
                <li>Payment can be made at coaching office or online portal</li>
                <li>Keep the payment receipt for your records</li>
              </ul>
            </div>

            <p style="margin:18px 0 0 0; color:#666; font-size:14px;">For any queries regarding this fee voucher, please contact the coaching accounts department.</p>
            <p style="margin:12px 0 0 0;">Thank you for your cooperation.</p>
            <p style="margin:8px 0 0 0;">Best regards,<br><strong>${coachingName} Accounts Department</strong></p>
          </div>
          <div class="footer">
            <p style="margin:0;">This is an automated email. Please do not reply to this message.</p>
            <p style="margin:6px 0 0 0;">&copy; ${new Date().getFullYear()} ${coachingName}. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  // Child Exam Scheduled
  if (type === 'CHILD_EXAM_SCHEDULED') {
    const { firstName, childName, examTitle, examType, examDate, subjectNames, className, coachingName } = parent;
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { ${baseStyles} }
          .container { ${containerStyles} }
          .header { ${headerStyles} }
          .content { ${contentStyles} }
          .details { ${detailsStyles} }
          .footer { ${footerStyles} }
          .exam-alert { background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 4px; margin: 15px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h2 style="margin: 0; font-size: 26px;">📚 ${coachingName}</h2>
            <p style="margin: 8px 0 0 0; font-size: 14px;">Exam Schedule Notification</p>
          </div>

          <div class="content">
            <p style="margin-top: 0; font-size: 16px; font-weight: 500;">Dear ${firstName},</p>

            <div class="exam-alert">
              <strong>📅 Exam Scheduled for ${childName}</strong>
            </div>

            <p>A new examination has been scheduled for your child <strong>${childName}</strong>. Please find the details below:</p>

            <div style="${detailsStyles}">
              <h4 style="margin-top: 0; color: #2b7a78;">Exam Details</h4>
              <table style="width: 100%; font-size: 14px;">
                <tr>
                  <td style="padding: 8px 0; font-weight: bold; width: 40%;">Student Name:</td>
                  <td style="padding: 8px 0;">${childName}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; font-weight: bold;">Class:</td>
                  <td style="padding: 8px 0;">${className}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; font-weight: bold;">Exam Title:</td>
                  <td style="padding: 8px 0;">${examTitle}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; font-weight: bold;">Exam Type:</td>
                  <td style="padding: 8px 0;">${examType.replace('_', ' ').toUpperCase()}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; font-weight: bold;">Exam Date:</td>
                  <td style="padding: 8px 0;"><strong style="color: #e74c3c;">${examDate}</strong></td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; font-weight: bold;">Subjects:</td>
                  <td style="padding: 8px 0;">${subjectNames}</td>
                </tr>
              </table>
            </div>

            <div style="${detailsStyles}">
              <h4 style="margin-top: 0; color: #2b7a78;">Parent Guidelines</h4>
              <ul style="margin: 8px 0; padding-left: 20px;">
                <li>Ensure your child arrives at coaching on time for the examination</li>
                <li>Help your child prepare necessary stationery and admit card</li>
                <li>Monitor your child's preparation and provide necessary support</li>
                <li>Contact the class teacher if your child needs special assistance</li>
                <li>Check coaching communications regularly for any updates</li>
              </ul>
            </div>

            <p style="margin: 20px 0; color: #666; font-size: 14px;">We wish ${childName} the very best for the upcoming examination. Your support and encouragement play a crucial role in your child's success.</p>

            <p style="margin: 20px 0 0 0;">Best regards,<br><strong>${coachingName} Administration</strong></p>
          </div>

          <div class="footer">
            <p style="margin: 0;">This is an automated email. Please do not reply to this message.</p>
            <p style="margin: 6px 0 0 0;">&copy; ${new Date().getFullYear()} ${coachingName}. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  // Default template
  return `<html><body><p>Hello ${parent.firstName || parent.fullName || ''},</p><p>Your parent account has been updated.</p></body></html>`;
};
