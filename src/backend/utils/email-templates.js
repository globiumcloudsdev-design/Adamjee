/**
 * Premium Welcome Email Template for Adamjee Coaching Center
 * Supports Branch Admins, Students, and Staff
 */
export const getWelcomeEmailTemplate = ({
  name,
  role,
  id,
  email,
  password,
  branchName,
  loginUrl = "https://adamjeecoaching.com/login"
}) => {
  const roleLabel = role?.replace('_', ' ') || 'User';
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Welcome to Adamjee Coaching</title>
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f7f9; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 20px auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; shadow: 0 4px 10px rgba(0,0,0,0.05); }
        .header { background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%); padding: 40px 20px; text-align: center; color: #ffffff; }
        .logo { font-size: 24px; font-weight: 800; letter-spacing: -1px; margin-bottom: 10px; }
        .welcome-badge { background-color: rgba(255,255,255,0.2); display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; text-transform: uppercase; margin-bottom: 20px; }
        .content { padding: 40px 30px; color: #334155; }
        .greeting { font-size: 24px; font-weight: 700; color: #0f172a; margin-bottom: 10px; }
        .intro { font-size: 16px; line-height: 1.6; color: #64748b; margin-bottom: 30px; }
        .card { background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 25px; margin-bottom: 30px; }
        .info-row { display: flex; justify-content: space-between; margin-bottom: 15px; border-bottom: 1px solid #f1f5f9; padding-bottom: 10px; }
        .info-row:last-child { margin-bottom: 0; border-bottom: none; }
        .info-label { font-size: 13px; color: #94a3b8; font-weight: 600; text-transform: uppercase; }
        .info-value { font-size: 15px; color: #1e293b; font-weight: 700; }
        .btn { display: inline-block; background: #1e40af; color: #ffffff; padding: 16px 32px; border-radius: 8px; font-weight: 700; text-decoration: none; text-align: center; margin-top: 20px; }
        .footer { background-color: #f8fafc; padding: 30px; text-align: center; font-size: 13px; color: #94a3b8; border-top: 1px solid #e2e8f0; }
        .warning { font-size: 12px; color: #f43f5e; margin-top: 20px; font-weight: 600; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="welcome-badge">Official Access Granted</div>
          <div class="logo">ADAMJEE COACHING</div>
          <p style="margin: 0; font-size: 14px; opacity: 0.9;">Excellence in Education since 1972</p>
        </div>
        
        <div class="content">
          <h1 class="greeting">Hello, ${name}!</h1>
          <p class="intro">
            Welcome to the Adamjee Coaching Center family. Your account has been officially registered as a <strong>${roleLabel}</strong> 
            ${branchName ? `for the <strong>${branchName}</strong> campus` : ''}.
          </p>
          
          <div class="card">
            <div style="margin-bottom: 20px; border-bottom: 2px solid #e2e8f0; padding-bottom: 10px;">
              <span style="font-weight: 800; color: #1e40af;">LOGIN CREDENTIALS</span>
            </div>
            
            <div class="info-row">
              <span class="info-label">Student/Staff ID</span>
              <span class="info-value">${id}</span>
            </div>
            
            <div class="info-row">
              <span class="info-label">Portal Email</span>
              <span class="info-value">${email}</span>
            </div>
            
            <div class="info-row">
              <span class="info-label">Password</span>
              <span class="info-value" style="color: #10b981;">${password}</span>
            </div>
          </div>
          
          <div style="text-align: center;">
            <p style="font-size: 14px; color: #64748b;">Please log in to your dashboard to complete your profile and access system features.</p>
            <a href="${loginUrl}" class="btn" style="color: #ffffff !important;">Access Dashboard Now</a>
            <p class="warning">⚠️ Important: Change your password immediately after your first login for security.</p>
          </div>
        </div>
        
        <div class="footer">
          <p>This is a system-generated email by Adamjee Coaching Center IT Department.</p>
          <p>Support: support@adamjeecoaching.com | Website: www.adamjeecoaching.com</p>
          <p style="margin-top: 20px;">&copy; 2026 Admin Portal. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;
};
