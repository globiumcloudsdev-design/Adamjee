/**
 * Email Templates for Teacher Management
 * Returns HTML email body based on template type
 */

export const getTeacherEmailTemplate = (type, teacher, coachingName = 'Adamjee Coaching') => {
  const baseStyles = `
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    color: #333;
    line-height: 1.6;
  `;

  const headerStyles = `
    background: linear-gradient(135deg, #4a90e2 0%, #357abd 100%);
    color: white;
    padding: 30px;
    text-align: center;
    border-radius: 8px 8px 0 0;
  `;

  const containerStyles = `
    max-width: 600px;
    margin: 0 auto;
    border: 1px solid #ddd;
    border-radius: 8px;
    overflow: hidden;
    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  `;

  const contentStyles = `
    padding: 30px;
    background: #f9f9f9;
  `;

  const detailsStyles = `
    background: white;
    padding: 20px;
    border-radius: 4px;
    margin: 20px 0;
    border-left: 4px solid #4a90e2;
  `;

  const footerStyles = `
    background: #f0f0f0;
    padding: 20px;
    text-align: center;
    font-size: 12px;
    color: #666;
    border-top: 1px solid #ddd;
  `;

  const teacherInfo = `
    <div style="${detailsStyles}">
      <h4 style="margin-top: 0; color: #4a90e2;">Teacher Information</h4>
      <table style="width: 100%; font-size: 14px;">
        <tr>
          <td style="padding: 8px 0; font-weight: bold; width: 40%;">Name:</td>
          <td style="padding: 8px 0;">${teacher.fullName || `${teacher.firstName} ${teacher.lastName}`}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; font-weight: bold;">Employee ID:</td>
          <td style="padding: 8px 0;">${teacher.teacherProfile?.employeeId || 'Pending'}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; font-weight: bold;">Email:</td>
          <td style="padding: 8px 0;">${teacher.email}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; font-weight: bold;">Phone:</td>
          <td style="padding: 8px 0;">${teacher.phone}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; font-weight: bold;">Designation:</td>
          <td style="padding: 8px 0;">${teacher.teacherProfile?.designation || 'Teacher'}</td>
        </tr>
      </table>
    </div>
  `;

  if (type === 'TEACHER_CREATED') {
    const totalSalary = (teacher.teacherProfile?.salaryDetails?.basicSalary || 0) +
      (teacher.teacherProfile?.salaryDetails?.allowances?.houseRent || 0) +
      (teacher.teacherProfile?.salaryDetails?.allowances?.medical || 0) +
      (teacher.teacherProfile?.salaryDetails?.allowances?.transport || 0);

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
          .success-badge { 
            background: #d4edda; 
            color: #155724; 
            padding: 10px 15px; 
            border-radius: 4px; 
            display: inline-block; 
            margin: 15px 0; 
            border: 1px solid #c3e6cb;
            font-weight: 600;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h2 style="margin: 0; font-size: 28px;">👨‍🏫 ${coachingName}</h2>
            <p style="margin: 10px 0 0 0; font-size: 14px;">Welcome to Our Teaching Faculty</p>
          </div>
          
          <div class="content">
            <p style="margin-top: 0; font-size: 16px; font-weight: 500;">Dear ${teacher.firstName} ${teacher.lastName},</p>
            
            <div class="success-badge">
              ✅ Your account has been successfully created!
            </div>
            
            <p>We are pleased to welcome you to ${coachingName} as a member of our esteemed teaching faculty. Your profile has been created and you can now access the coaching management system.</p>
            
            ${teacherInfo}
            
            <div style="${detailsStyles}">
              <h4 style="margin-top: 0; color: #4a90e2;">Academic Assignment</h4>
              <table style="width: 100%; font-size: 14px;">
                <tr>
                  <td style="padding: 8px 0; font-weight: bold; width: 40%;">Branch:</td>
                  <td style="padding: 8px 0;">${teacher.branchId?.name || 'N/A'}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; font-weight: bold;">Department:</td>
                  <td style="padding: 8px 0;">${teacher.teacherProfile?.departmentId?.name || 'General'}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; font-weight: bold;">Joining Date:</td>
                  <td style="padding: 8px 0;">${new Date(teacher.teacherProfile?.joiningDate || new Date()).toLocaleDateString()}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; font-weight: bold;">Classes Assigned:</td>
                  <td style="padding: 8px 0;">${teacher.teacherProfile?.classes?.length || 0} Classes</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; font-weight: bold;">Subjects:</td>
                  <td style="padding: 8px 0;">${teacher.teacherProfile?.subjects?.length || 0} Subjects</td>
                </tr>
              </table>
            </div>

            ${teacher.teacherProfile?.salaryDetails?.basicSalary ? `
            <div style="${detailsStyles}">
              <h4 style="margin-top: 0; color: #4a90e2;">Salary Information</h4>
              <table style="width: 100%; font-size: 14px;">
                <tr>
                  <td style="padding: 8px 0; font-weight: bold; width: 40%;">Basic Salary:</td>
                  <td style="padding: 8px 0;">PKR ${teacher.teacherProfile.salaryDetails.basicSalary.toLocaleString()}</td>
                </tr>
                ${teacher.teacherProfile.salaryDetails.allowances?.houseRent ? `
                <tr>
                  <td style="padding: 8px 0; font-weight: bold;">House Rent:</td>
                  <td style="padding: 8px 0;">PKR ${teacher.teacherProfile.salaryDetails.allowances.houseRent.toLocaleString()}</td>
                </tr>
                ` : ''}
                ${teacher.teacherProfile.salaryDetails.allowances?.medical ? `
                <tr>
                  <td style="padding: 8px 0; font-weight: bold;">Medical Allowance:</td>
                  <td style="padding: 8px 0;">PKR ${teacher.teacherProfile.salaryDetails.allowances.medical.toLocaleString()}</td>
                </tr>
                ` : ''}
                <tr style="border-top: 2px solid #4a90e2;">
                  <td style="padding: 12px 0 8px 0; font-weight: bold; font-size: 16px;">Gross Salary:</td>
                  <td style="padding: 12px 0 8px 0; font-weight: bold; font-size: 16px; color: #27ae60;">PKR ${totalSalary.toLocaleString()}</td>
                </tr>
              </table>
            </div>
            ` : ''}
            
            <div style="${detailsStyles}">
              <h4 style="margin-top: 0; color: #4a90e2;">Login Credentials</h4>
              <table style="width: 100%; font-size: 14px;">
                <tr>
                  <td style="padding: 8px 0; font-weight: bold; width: 40%;">Email/Username:</td>
                  <td style="padding: 8px 0;">${teacher.email}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; font-weight: bold;">Default Password:</td>
                  <td style="padding: 8px 0; background: #fff3cd; padding: 8px; border-radius: 4px;"><strong>Teacher@123</strong></td>
                </tr>
              </table>
              <p style="margin: 15px 0 0 0; font-size: 13px; color: #856404; background: #fff3cd; padding: 10px; border-radius: 4px;">
                ⚠️ <strong>Important:</strong> Please change your password after first login for security purposes.
              </p>
            </div>
            
            <p style="margin: 25px 0; color: #666; font-size: 14px;">If you have any questions or need assistance, please don't hesitate to contact the coaching administration.</p>
            
            <p style="margin: 20px 0 0 0;">Best regards,<br><strong>${coachingName} Administration</strong></p>
          </div>
          
          <div class="footer">
            <p style="margin: 0;">This is an automated email. Please do not reply to this message.</p>
            <p style="margin: 5px 0 0 0;">&copy; ${new Date().getFullYear()} ${coachingName}. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  if (type === 'TEACHER_UPDATED') {
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
          .alert { background: #fff3cd; padding: 15px; border-radius: 4px; margin: 15px 0; border-left: 4px solid #ffc107; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h2 style="margin: 0; font-size: 28px;">📝 ${coachingName}</h2>
            <p style="margin: 10px 0 0 0; font-size: 14px;">Profile Updated Successfully</p>
          </div>
          
          <div class="content">
            <p style="margin-top: 0; font-size: 16px; font-weight: 500;">Dear ${teacher.firstName} ${teacher.lastName},</p>
            
            <p>Your profile information has been updated in our system. Please review the details below to ensure everything is correct.</p>
            
            <div class="alert">
              <strong>⚠️ Important:</strong> If you did not request this change or notice any discrepancies, please contact the administration immediately.
            </div>
            
            ${teacherInfo}
            
            <div style="${detailsStyles}">
              <h4 style="margin-top: 0; color: #4a90e2;">Updated Details</h4>
              <table style="width: 100%; font-size: 14px;">
                <tr>
                  <td style="padding: 8px 0; font-weight: bold; width: 40%;">Branch:</td>
                  <td style="padding: 8px 0;">${teacher.branchId?.name || 'N/A'}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; font-weight: bold;">Designation:</td>
                  <td style="padding: 8px 0;">${teacher.teacherProfile?.designation || 'Teacher'}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; font-weight: bold;">Classes Assigned:</td>
                  <td style="padding: 8px 0;">${teacher.teacherProfile?.classes?.length || 0} Classes</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; font-weight: bold;">Subjects:</td>
                  <td style="padding: 8px 0;">${teacher.teacherProfile?.subjects?.length || 0} Subjects</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; font-weight: bold;">Status:</td>
                  <td style="padding: 8px 0;"><strong style="color: ${teacher.status === 'active' ? '#27ae60' : teacher.status === 'on_leave' ? '#f39c12' : '#e74c3c'};">${(teacher.status || 'active').toUpperCase().replace('_', ' ')}</strong></td>
                </tr>
              </table>
            </div>
            
            <p style="margin: 20px 0; color: #666; font-size: 14px;">If you have any questions about these updates, please contact the coaching administration.</p>
            
            <p style="margin: 20px 0 0 0;">Best regards,<br><strong>${coachingName} Administration</strong></p>
          </div>
          
          <div class="footer">
            <p style="margin: 0;">This is an automated email. Please do not reply to this message.</p>
            <p style="margin: 5px 0 0 0;">&copy; ${new Date().getFullYear()} ${coachingName}. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  if (type === 'TEACHER_STATUS_CHANGED') {
    const statusConfig = {
      active: { color: '#27ae60', icon: '✅', label: 'ACTIVE', bg: '#d4edda' },
      on_leave: { color: '#f39c12', icon: '🏖️', label: 'ON LEAVE', bg: '#fff3cd' },
      terminated: { color: '#e74c3c', icon: '⛔', label: 'TERMINATED', bg: '#f8d7da' },
      resigned: { color: '#95a5a6', icon: '📝', label: 'RESIGNED', bg: '#e2e3e5' },
    };
    
    const config = statusConfig[teacher.status] || statusConfig.active;

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
          .status-badge { 
            background: ${config.bg}; 
            color: ${config.color}; 
            padding: 15px 20px; 
            border-radius: 4px; 
            display: inline-block; 
            margin: 15px 0; 
            border: 2px solid ${config.color};
            font-weight: 700;
            font-size: 18px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h2 style="margin: 0; font-size: 28px;">🔔 ${coachingName}</h2>
            <p style="margin: 10px 0 0 0; font-size: 14px;">Employment Status Update</p>
          </div>
          
          <div class="content">
            <p style="margin-top: 0; font-size: 16px; font-weight: 500;">Dear ${teacher.firstName} ${teacher.lastName},</p>
            
            <p>This is to inform you that your employment status has been updated.</p>
            
            <div class="status-badge">
              ${config.icon} ${config.label}
            </div>
            
            ${teacherInfo}
            
            <div style="${detailsStyles}">
              <h4 style="margin-top: 0; color: ${config.color};">Current Employment Status</h4>
              <table style="width: 100%; font-size: 14px;">
                <tr>
                  <td style="padding: 8px 0; font-weight: bold; width: 40%;">Status:</td>
                  <td style="padding: 8px 0;"><strong style="color: ${config.color};">${config.label}</strong></td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; font-weight: bold;">Effective Date:</td>
                  <td style="padding: 8px 0;">${new Date().toLocaleDateString()}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; font-weight: bold;">Branch:</td>
                  <td style="padding: 8px 0;">${teacher.branchId?.name || 'N/A'}</td>
                </tr>
              </table>
            </div>

            ${teacher.status === 'on_leave' ? `
            <div style="background: #fff3cd; padding: 15px; border-radius: 4px; margin: 15px 0; border-left: 4px solid #ffc107;">
              <p style="margin: 0; color: #856404;"><strong>Note:</strong> Your classes have been temporarily reassigned during your leave period. You will be notified when you're expected to return.</p>
            </div>
            ` : ''}

            ${teacher.status === 'terminated' || teacher.status === 'resigned' ? `
            <div style="background: #f8d7da; padding: 15px; border-radius: 4px; margin: 15px 0; border-left: 4px solid #e74c3c;">
              <p style="margin: 0; color: #721c24;"><strong>Important:</strong> Your access to the coaching management system will be revoked within 24 hours. Please contact HR for final settlement and clearance procedures.</p>
            </div>
            ` : ''}
            
            <p style="margin: 25px 0; color: #666; font-size: 14px;">If you have any questions or concerns about this status change, please contact the coaching administration or HR department immediately.</p>
            
            <p style="margin: 20px 0 0 0;">Best regards,<br><strong>${coachingName} Administration</strong></p>
          </div>
          
          <div class="footer">
            <p style="margin: 0;">This is an automated email. Please do not reply to this message.</p>
            <p style="margin: 5px 0 0 0;">&copy; ${new Date().getFullYear()} ${coachingName}. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  // Default template
  return `<html><body><p>Hello ${teacher.firstName},</p><p>Your teacher record has been updated.</p></body></html>`;
};
