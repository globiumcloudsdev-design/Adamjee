/**
 * Email Templates for Administrator Management
 * Returns HTML email body based on template type
 */

export const getAdminEmailTemplate = (type, admin, coachingName = 'Adamjee Coaching') => {
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

  const adminInfo = `
    <div style="${detailsStyles}">
      <h4 style="margin-top: 0; color: #2b7a78;">Administrator Information</h4>
      <table style="width:100%; font-size:14px;">
        <tr>
          <td style="padding:6px 0; font-weight:bold; width:40%;">Name:</td>
          <td style="padding:6px 0;">${admin.fullName || `${admin.firstName || ''} ${admin.lastName || ''}`.trim()}</td>
        </tr>
        <tr>
          <td style="padding:6px 0; font-weight:bold;">Role:</td>
          <td style="padding:6px 0;">${admin.role || 'Administrator'}</td>
        </tr>
        <tr>
          <td style="padding:6px 0; font-weight:bold;">Email:</td>
          <td style="padding:6px 0;">${admin.email || 'N/A'}</td>
        </tr>
        <tr>
          <td style="padding:6px 0; font-weight:bold;">Phone:</td>
          <td style="padding:6px 0;">${admin.phone || 'N/A'}</td>
        </tr>
        <tr>
          <td style="padding:6px 0; font-weight:bold;">Branch:</td>
          <td style="padding:6px 0;">${admin.branchId?.name || 'N/A'}</td>
        </tr>
      </table>
    </div>
  `;

  if (type === 'ADMIN_CREATED') {
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
            <p style="margin:8px 0 0 0; font-size:14px;">Administrator Account Created</p>
          </div>
          <div class="content">
            <p style="margin-top:0; font-size:16px; font-weight:500;">Hello ${admin.firstName || admin.fullName || ''},</p>
            <div class="success">✅ Your administrator account has been created successfully.</div>

            ${adminInfo}

            <div style="${detailsStyles}">
              <h4 style="margin-top:0; color:#2b7a78;">Login Credentials</h4>
              <table style="width:100%; font-size:14px;">
                <tr>
                  <td style="padding:6px 0; font-weight:bold; width:40%;">Email/Username:</td>
                  <td style="padding:6px 0;">${admin.email}</td>
                </tr>
                <tr>
                  <td style="padding:6px 0; font-weight:bold;">Temporary Password:</td>
                  <td style="padding:6px 0; background:#fff3cd; padding:6px; border-radius:4px;">${admin.tempPassword || 'Admin@123'}</td>
                </tr>
              </table>
              <p style="margin:12px 0 0 0; font-size:13px; color:#555;">Please change your password after the first login for security.</p>
            </div>

            <div style="margin-top:14px;">
              <h4 style="margin:0 0 6px 0; color:#2b7a78;">Assigned Permissions</h4>
              <p style="margin:0; font-size:14px;">${(admin.adminProfile?.permissions || admin.permissions || []).length ? (admin.adminProfile?.permissions || admin.permissions).join(', ') : 'No permissions assigned'}</p>
            </div>

            <p style="margin:18px 0 0 0; color:#666; font-size:14px;">If you have any questions, contact the coaching administration.</p>

            <p style="margin:20px 0 0 0;">Best regards,<br><strong>${coachingName} Administration</strong></p>
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

  if (type === 'ADMIN_UPDATED') {
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
            <h2 style="margin:0; font-size:26px;">📝 ${coachingName}</h2>
            <p style="margin:8px 0 0 0; font-size:14px;">Administrator Profile Updated</p>
          </div>
          <div class="content">
            <p style="margin-top:0; font-size:16px; font-weight:500;">Hello ${admin.firstName || admin.fullName || ''},</p>
            <p>Your administrator profile has been updated. Please review the details below.</p>

            ${adminInfo}

            <p style="margin:18px 0 0 0; color:#666; font-size:14px;">If you did not request this change, please contact the administration immediately.</p>

            <p style="margin:20px 0 0 0;">Best regards,<br><strong>${coachingName} Administration</strong></p>
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

  if (type === 'ADMIN_STATUS_CHANGED') {
    const statusConfig = {
      active: { color: '#27ae60', icon: '✅', label: 'ACTIVE', bg: '#d4f8e8' },
      inactive: { color: '#e74c3c', icon: '⛔', label: 'INACTIVE', bg: '#fdecea' },
      suspended: { color: '#f39c12', icon: '⏸️', label: 'SUSPENDED', bg: '#fff6e6' },
    };
    const cfg = statusConfig[admin.status] || statusConfig.active;

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
          .status-badge { background: ${cfg.bg}; color: ${cfg.color}; padding:12px 16px; border-radius:6px; display:inline-block; margin:12px 0; border:1px solid ${cfg.color}; font-weight:700; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h2 style="margin:0; font-size:26px;">🔔 ${coachingName}</h2>
            <p style="margin:8px 0 0 0; font-size:14px;">Account Status Update</p>
          </div>
          <div class="content">
            <p style="margin-top:0; font-size:16px; font-weight:500;">Hello ${admin.firstName || admin.fullName || ''},</p>
            <div class="status-badge">${cfg.icon} ${cfg.label}</div>

            ${adminInfo}

            <p style="margin:18px 0 0 0; color:#666; font-size:14px;">If you have any questions or believe this is a mistake, contact the administration.</p>

            <p style="margin:20px 0 0 0;">Best regards,<br><strong>${coachingName} Administration</strong></p>
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

  if (type === 'ADMIN_PASSWORD_RESET') {
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
            <h2 style="margin:0; font-size:26px;">🔑 ${coachingName}</h2>
            <p style="margin:8px 0 0 0; font-size:14px;">Password Reset</p>
          </div>
          <div class="content">
            <p style="margin-top:0; font-size:16px; font-weight:500;">Hello ${admin.firstName || admin.fullName || ''},</p>
            <p>Your password has been reset. Use the temporary password below to sign in and update your password immediately.</p>

            <div style="${detailsStyles}">
              <h4 style="margin-top:0; color:#2b7a78;">Temporary Password</h4>
              <p style="background:#fff3cd; padding:8px; border-radius:4px; display:inline-block;">${admin.tempPassword || 'sent separately'}</p>
            </div>

            <p style="margin:18px 0 0 0; color:#666; font-size:14px;">If you did not request this reset, contact support immediately.</p>

            <p style="margin:20px 0 0 0;">Best regards,<br><strong>${coachingName} Administration</strong></p>
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

  // Default template
  return `<html><body><p>Hello ${admin.firstName || admin.fullName || ''},</p><p>Your administrator record has been updated.</p></body></html>`;
};
