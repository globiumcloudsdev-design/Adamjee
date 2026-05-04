
// Default policy config (fallback) - Updated with Adamjee gold/brown theme
const DEFAULT_POLICY_CONFIG = {
  layout: 'vertical',
  card_type: 'student',
  show_photo: true,
  show_watermark: true,
  qr_enabled: true,
  design: {
    background_color: '#5a1885',     // Purple
    accent_color: '#f9b400',         // Yellow
    secondary_accent: '#7b2cb0',     // Lighter purple
    text_color: '#ffffff',
    border_radius: '15px',
    show_border: true,
    border_color: '#e2e8f0',
    card_shadow: true,
    photo_border_radius: '0px'
  },
  terms_list: [
    "This card is the property of the institution.",
    "Loss of card must be reported immediately.",
    "This card is non-transferable.",
    "Misuse may result in disciplinary action."
  ]
};

const looksLikeIdValue = (value) => {
  if (typeof value !== 'string') return false;
  const trimmed = value.trim();
  if (!trimmed) return false;

  // Common DB id formats we do not want to print as section names.
  return (
    /^\d+$/.test(trimmed) ||
    /^[0-9a-f]{24}$/i.test(trimmed) ||
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(trimmed)
  );
};

const resolveSectionName = (student, details, academicDetails) => {
  console.log('PDF Section resolution data:', student, details, academicDetails);
  // Sync with IDCard.jsx - enhanced resolution
  const sectionId = student?.section_id || details?.academic_info?.section_id || details?.section_id || student?.section;

  // Direct names first
  const directNames = [
    student?.section_name,
    student?.sectionName,
    student?.class_section,
    details?.section_name,
    details?.academic_info?.section_name,
  ];
  for (const name of directNames) {
    if (typeof name === 'string' && name.trim() && !looksLikeIdValue(name.trim())) {
      return name.trim();
    }
  }

  // Comprehensive candidates
  const candidates = [
    student?.section_name,
    student?.sectionName,
    student?.class_section,
    student?.section?.name,
    details?.academic_info?.section_name,
    details?.academic_info?.section?.name,
    details?.section?.name,
    academicDetails?.section_name,
    academicDetails?.section?.name,
    student?.studentProfile?.sectionName,
    student?.studentProfile?.section_name,
    student?.academic_info?.section_name,
  ];

  for (const candidate of candidates) {
    if (typeof candidate === 'string') {
      const trimmed = candidate.trim();
      if (trimmed && !looksLikeIdValue(trimmed)) {
        console.log('PDF Resolved section:', trimmed);
        return trimmed;
      }
    }
  }

  console.warn('PDF: No valid section name found');
  return 'Section A';
};

const getDefaultAvatarUrl = (student) => {
  const gender = String(student?.gender || '').toLowerCase();
  return gender === 'female' ? '/assets/avatar-female.png' : '/assets/avatar-male.png';
};

const buildStudentQrValue = (student) => {
  const id = student?.id || student?.student_id || student?.user_id || student?.roll_number || student?.roll_no || 'student';
  const regNum = student?.registration_no || student?.registrationNumber || student?.roll_number || student?.roll_no || 'REG-' + Date.now();
  const fullName = `${student?.first_name || ''} ${student?.last_name || ''}`.trim() || student?.full_name || student?.name || 'Student';

  const payload = {
    id,
    registrationNumber: regNum,
    role: 'student',
    fullName: fullName.trim(),
  };

  const qrValue = JSON.stringify(payload);
  console.log('PDF Generated QR value:', qrValue);
  return qrValue;
};

const flattenStudentData = (student) => {
  const details = student?.details || {};
  const academicDetails = details?.studentDetails || details || {};

  return {
    full_name: `${student?.first_name || ""} ${student?.last_name || ""}`.trim() || "Student Name",
    parent_name:
      student?.parent_name ||
      student?.father_name ||
      details?.guardian_name ||
      student?.guardians?.[0]?.name ||
      "Parent Name",

    roll_number:
      student?.roll_number ||
      student?.roll_no || "N/A",

    registration_no:
      student?.registration_no ||
      student?.registration_number ||
      "N/A",

    class:
      student?.class_name ||
      student?.class ||
      details?.academic_info?.class_name ||
      "N/A",

    section: resolveSectionName(student, details, academicDetails),

    branch_name:
      student?.branch_name ||
      student?.branch?.name ||
      "Main Campus",

    shift:
      student?.shift ||
      details?.academic_info?.shift ||
      "Morning",

    blood_group: student?.blood_group || details?.blood_group || "O+",
    dob: student?.date_of_birth || details?.dob || "",
    valid_upto: "AUG 2026",
    join_date: student?.join_date || student?.admission_date || "07/25/2025",

    gender: student?.gender || "male",
    phone: student?.phone || "",
    email: student?.email || "",
    address: student?.address || details?.address || "Address not provided",
    qr_code_url: student?.qr_code_url || student?.studentProfile?.qr?.url || "",
    qr_value: buildStudentQrValue(student),
    photo_url: student?.avatar_url || student?.photo_url || "",

  };
};

const generateQRCodeDataUrl = async (value) => {
  if (!value) return '';

  try {
    const QRCode = (await import('qrcode')).default;
    return await QRCode.toDataURL(value, {
      errorCorrectionLevel: 'H',
      width: 300,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF',
      },
    });
  } catch (error) {
    console.error('QR fallback generation failed:', error);
    return '';
  }
};

const createCompleteCardHTML = async (student, institute, policyConfig) => {
  const design = policyConfig?.design || DEFAULT_POLICY_CONFIG.design;
  const layout = policyConfig?.layout || 'vertical';
  const watermark = policyConfig?.show_watermark !== false;
  const showQr = policyConfig?.qr_enabled !== false;
  const termsList = policyConfig?.terms_list || DEFAULT_POLICY_CONFIG.terms_list;
  const bgColor = design.background_color || '#242e46';
  const accentColor = design.accent_color || '#f5ceb0';
  const textColor = design.text_color || '#ffffff';
  const logoUrl = institute?.logo_url || '/id-logo.png';
  const instituteName = institute?.name || 'ADAMJEE COACHING CENTRE';
  const tagline = institute?.settings?.academic?.school_tagline || 'The Best in Coaching';
  const address = institute?.address || 'City Branch, Pakistan';
  const phone = institute?.phone || '+92 123 4567890';
  const email = institute?.email || 'info@adamjee.edu.pk';

  const qrFallbackDataUrl = showQr
    ? await generateQRCodeDataUrl(student.qr_value || student.roll_number)
    : '';
  const qrCodeHTML = showQr
    ? student.qr_code_url
      ? `<img src="${student.qr_code_url}" onerror="this.onerror=null; this.src='${qrFallbackDataUrl}'" style="width:120px;height:120px;border-radius:15px;background:#fff;padding:10px;box-shadow:0 10px 30px rgba(0,0,0,0.15); border:1px solid #f1f5f9;" />`
      : qrFallbackDataUrl
        ? `<img src="${qrFallbackDataUrl}" style="width:120px;height:120px;border-radius:15px;background:#fff;padding:10px;box-shadow:0 10px 30px rgba(0,0,0,0.15); border:1px solid #f1f5f9;" />`
        : ''
    : "";

  if (layout === 'horizontal') {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
          * { margin: 0; padding: 0; box-sizing: border-box; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          body { background: #f1f5f9; font-family: 'Plus Jakarta Sans', sans-serif; padding: 20px; }
          .sheet { display: flex; flex-direction: column; justify-content: flex-start; align-items: center; gap: 18px; }
          .card { width: 340px; height: 215px; border-radius: 24px; overflow: hidden; position: relative; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.2); border: 1px solid rgba(255,255,255,0.3); background: white; margin: 15px; }
          .front { background: ${bgColor}; color: ${textColor}; display: flex; }
          .front::before { content: ''; position: absolute; top: 0; left: 0; right: 0; bottom: 0; background-image: radial-gradient(circle at 2px 2px, rgba(255,255,255,0.05) 1px, transparent 0); background-size: 15px 15px; pointer-events: none; }
          .accent-strip { width: 135px; background: linear-gradient(165deg, ${accentColor} 0%, ${bgColor} 100%); display: flex; flex-direction: column; align-items: center; padding: 20px 12px; position: relative; border-right: 1px solid rgba(255,255,255,0.15); z-index: 1; }
          .photo-box { width: 90px; height: 105px; border-radius: 16px; border: 4px solid white; overflow: hidden; margin-top: 10px; background: #1e293b; box-shadow: 0 12px 24px rgba(0,0,0,0.25); position: relative; }
          .info-box { flex: 1; padding: 22px 25px; display: flex; flex-direction: column; justify-content: space-between; position: relative; z-index: 1; }
          .student-name { font-size: 19px; font-weight: 800; letter-spacing: -0.02em; margin-bottom: 6px; text-transform: uppercase; color: white; }
          .detail-label { font-size: 8px; font-weight: 700; opacity: 0.5; text-transform: uppercase; margin-bottom: 3px; letter-spacing: 0.5px; }
          .detail-value { font-size: 11.5px; font-weight: 700; color: white; }
          .back { background: white; }
          .back::before { content: ''; position: absolute; top: 0; left: 0; right: 0; bottom: 0; background-image: radial-gradient(circle at 2px 2px, rgba(0,0,0,0.02) 1px, transparent 0); background-size: 20px 20px; pointer-events: none; }
          .back-header { background: ${bgColor}; padding: 14px 22px; color: white; display: flex; justify-content: space-between; align-items: center; position: relative; overflow: hidden; }
          .back-header::after { content: ''; position: absolute; bottom: 0; left: 0; width: 100%; height: 3px; background: ${accentColor}; }
          .terms { padding: 18px 22px; font-size: 8.5px; color: #334155; line-height: 1.6; flex: 1; position: relative; }
          .qr-section { padding: 15px 22px; display: flex; align-items: center; justify-content: space-between; background: #f8fafc; border-top: 1px solid #e2e8f0; position: relative; }
          .contact-mini { font-size: 8.5px; color: #64748b; font-weight: 500; flex: 1; }
          .attendance-label { background: ${accentColor}; color: white; padding: 5px 12px; border-radius: 20px; font-size: 8.5px; font-weight: 900; text-transform: uppercase; margin-bottom: 10px; display: inline-block; box-shadow: 0 4px 12px ${accentColor}44; letter-spacing: 0.5px; }
          @media print { body { background: white; padding: 0; } .card { box-shadow: none; border: 1px solid #eee; } }
        </style>
      </head>
      <body>
        <div class="sheet">
        <div class="card front">
          <div class="accent-strip">
            <div style="background: white; padding: 0px; border-radius: 12px; margin-bottom: 12px; box-shadow: 0 6px 15px rgba(0,0,0,0.15);">
               <img src="${logoUrl}" style="width:42px; height:42px; object-fit:contain;" />
            </div>
               <div class="photo-box" style="display:flex; align-items:center; justify-content:center; background:#334155;">
              ${student.photo_url
        ? `<img src="${student.photo_url}" style="width:100%; height:100%; object-fit:cover;" />`
        : `<span style="font-size:40px;">${student.gender?.toLowerCase() === 'female' ? '👧' : '👦'}</span>`
      }
            </div>
            <div style="margin-top: 15px; text-align: center;">
              <div class="detail-label" style="color: white; opacity: 0.7;">ROLL NO</div>
              <div class="detail-value" style="color: ${accentColor}; font-size: 15px; font-weight: 900;">${student.roll_number}</div>
            </div>
          </div>
          <div class="info-box">
            <div>
              <div class="detail-label">STUDENT NAME</div>
              <div class="student-name">${student.full_name}</div>
            </div>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 14px;">
              <div>
                <div class="detail-label">REG NO</div>
                <div class="detail-value">${student.registration_no}</div>
              </div>
              <div>
                <div class="detail-label">CLASS</div>
                <div class="detail-value">${student.class}</div>
              </div>
            </div>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 14px;">
              <div>
                <div class="detail-label">GUARDIAN</div>
                <div class="detail-value" style="font-size: 9.5px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${student.parent_name}</div>
              </div>
              <div>
                <div class="detail-label">BLOOD</div>
                <div class="detail-value" style="color: ${accentColor}; font-weight:900;">${student.blood_group}</div>
              </div>
            </div>
            <div style="display: flex; justify-content: space-between; align-items: flex-end; margin-top: 8px;">
               <div>
                  <div class="detail-label">BRANCH</div>
                  <div class="detail-value" style="font-size: 10px; opacity: 0.9;">${student.branch_name}</div>
               </div>
               <div style="text-align: right;">
                  <div class="detail-label">CATEGORY</div>
                  <div class="detail-value" style="color: ${accentColor}; letter-spacing: 1.5px; font-weight: 900; font-size: 10px;">STUDENT</div>
               </div>
            </div>
          </div>
        </div>

        <div class="card back">
          <div class="back-header">
           
            <div style="background: ${accentColor}; color:white; padding: 4px 12px; border-radius: 20px; font-size: 6.5px; font-weight: 500; letter-spacing: 0.5px;">OFFICIAL ID</div>
          </div>
          <div class="terms">
            <div style="font-weight: 900; color: ${bgColor}; margin-bottom: 10px; font-size: 11px; border-left: 4px solid ${accentColor}; padding-left: 8px; letter-spacing: 0.5px;">RULES & POLICIES</div>
            ${termsList.map(term => `<div style="display:flex; gap:8px; margin-bottom:6px;"><span style="color:${accentColor}; font-size: 10px;">★</span><span>${term}</span></div>`).join('')}
          </div>
          <div class="qr-section">
            <div class="contact-mini">
              <div style="margin-bottom: 6px; font-weight: 700; color: #1e293b;">📍 ${address}</div>
              <div style="display: flex; flex-direction: column; gap: 2px;">
                 <span>📞 ${phone}</span>
                 <span>✉️ ${email}</span>
              </div>
              <div style="margin-top: 15px; border-top: 1px solid #e2e8f0; padding-top: 8px;">
                 <div style="font-size: 9px; font-weight: 900; color: ${bgColor}; letter-spacing: 1px;">PRINCIPAL SIGNATURE</div>
                 <div style="height: 25px; border-bottom: 2px solid ${bgColor}; width: 120px; opacity: 0.15; margin-top: 5px;"></div>
              </div>
            </div>
            <div style="text-align: center; margin-left: 20px;">
              <div class="attendance-label">SCAN FOR ATTENDANCE</div>
              <div class="qr-container">${qrCodeHTML}</div>
            </div>
          </div>
        </div>
        </div>
      </body>
      </html>
    `;
  }

  // Default: Vertical Card
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;700;900&display=swap');
        * { margin: 0; padding: 0; box-sizing: border-box; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        body { background: #f1f5f9; font-family: 'Outfit', sans-serif; padding: 30px; }
        .sheet { display: flex; flex-direction: row; justify-content: center; align-items: flex-start; gap: 40px; padding: 20px; }
        .card { width: 280px; height: 440px; border-radius: 15px; overflow: hidden; position: relative; box-shadow: 0 35px 70px rgba(0,0,0,0.15); background: white; border: none; }
        
        .header { height: 85px; background: #5a1885; position: relative; padding: 15px 20px; display: flex; align-items: center; gap: 12px; }
        .header-pattern { position: absolute; top: 0; right: 0; width: 80px; height: 80px; background: rgba(0,0,0,0.1); clip-path: polygon(100% 0, 0 0, 100% 100%); z-index: 1; }
        .header-pattern-2 { position: absolute; top: 0; right: 0; width: 40px; height: 40px; background: rgba(255,255,255,0.1); clip-path: polygon(100% 0, 0 0, 100% 100%); z-index: 2; }
        .logo-box { background: transparent; padding: 5px; border-radius: 50%; z-index: 10; display: flex; align-items: center; justify-content: center; }
        .inst-name { font-size: 13px; font-weight: 900; color: white; text-transform: uppercase; line-height: 1.1; z-index: 10; }
        
        .yellow-bar { position: relative; height: 25px; z-index: 5; }
        .yellow-bar-main { position: absolute; top: 0; left: 0; width: 75%; height: 15px; background: #f9b400; clip-path: polygon(0 0, 100% 0, 85% 100%, 0 100%); }
        .yellow-bar-accent-1 { position: absolute; top: 18px; left: 45px; width: 40px; height: 4px; background: #f9b400; transform: skewX(-30deg); }
        .yellow-bar-accent-2 { position: absolute; top: 18px; left: 90px; width: 30px; height: 4px; background: #f9b400; transform: skewX(-30deg); }
        
        .photo-container { width: 120px; height: 140px; border: 1px solid #eee; overflow: hidden; margin: 10px auto 0; background: #f8fafc; box-shadow: 0 10px 20px rgba(0,0,0,0.05); }
        
        .student-body { padding: 15px 25px; display: flex; flex-direction: column; align-items: flex-start; }
        .student-name { font-size: 16px; font-weight: 900; color: #000; text-transform: uppercase; width: 100%; margin-bottom: 15px; }
        
        .info-list { width: 100%; display: flex; flex-direction: column; gap: 8px; }
        .info-row { display: flex; align-items: baseline; }
        .info-label { width: 80px; font-size: 10px; font-weight: 800; color: #000; text-transform: uppercase; }
        .info-sep { font-size: 10px; font-weight: 800; color: #000; margin-right: 8px; }
        .info-value { font-size: 11px; font-weight: 500; color: #333; }
        
        .footer-accent { position: absolute; bottom: 30px; right: 0; width: 100px; height: 30px; z-index: 5; }
        .footer-accent-line-1 { position: absolute; bottom: 12px; right: 35px; width: 40px; height: 4px; background: #f9b400; transform: skewX(-30deg); }
        .footer-accent-line-2 { position: absolute; bottom: 12px; right: 80px; width: 25px; height: 4px; background: #f9b400; transform: skewX(-30deg); }
        .footer-accent-bar { position: absolute; bottom: 0; right: 0; width: 100%; height: 10px; background: #f9b400; clip-path: polygon(15% 0, 100% 0, 100% 100%, 0 100%); }
        
        .footer-solid { height: 50px; background: #5a1885; width: 100%; margin-top: auto; border: none; }
        
        .back-body { flex: 1; padding: 15px 20px; display: flex; flexDirection: column; }
        .terms-box { background: #f3e8ff; padding: 12px; border-radius: 12px; margin-bottom: 15px; }
        .dates-row { display: flex; justify-content: center; gap: 20px; margin-bottom: 15px; }
        .contact-box { background: #f3e8ff; padding: 12px; border-radius: 12px; text-align: center; margin-bottom: 15px; }
        .qr-center { display: flex; justify-content: center; margin-top: auto; }
        
        @media print { body { background: white; } .card { box-shadow: none; border: 1px solid #eee; } }
      </style>
    </head>
    <body>
      <div class="sheet">
        <!-- FRONT SIDE -->
        <div class="card">
          <div class="header">
            <div class="header-pattern"></div>
            <div class="header-pattern-2"></div>
            <div class="logo-box">
              <img src="${logoUrl}" style="width:40px; height:40px; object-fit:contain;" />
            </div>
            <div style="z-index: 10; flex: 1;">
              <div class="inst-name" style="font-size: 13px; font-weight: 900; color: white; text-transform: uppercase; line-height: 1.1;">ADAMJEE COACHING CENTRE</div>
              <div style="font-size: 9px; font-weight: 700; color: #f9b400; text-transform: uppercase; margin-top: 2px;">
                ${student.branch_name || instituteName || "Campus-12"}
              </div>
            </div>
          </div>
          <div class="yellow-bar">
            <div class="yellow-bar-main"></div>
            <div class="yellow-bar-accent-1"></div>
            <div class="yellow-bar-accent-2"></div>
          </div>
          <div class="photo-container">
            ${student.photo_url
        ? `<img src="${student.photo_url}" style="width:100%; height:100%; object-fit:cover;" />`
        : `<div style="width:100%; height:100%; display:flex; align-items:center; justify-content:center; background:#f1f5f9;">
              <img src="${student.gender?.toLowerCase() === 'male'
          ? 'https://cdn-icons-png.flaticon.com/512/6997/6997674.png'
          : 'https://cdn-icons-png.flaticon.com/512/6997/6997662.png'}" 
              style="width:80%; height:80%; object-fit:contain; opacity:0.7;" />
           </div>`
      }
          </div>
          <div class="student-body">
            <div class="student-name">${student.full_name}</div>
            <div class="info-list">
              <div class="info-row">
                <div class="info-label">Roll No</div>
                <div class="info-sep">:</div>
                <div class="info-value" style="font-weight:800; color:#5a1885;">
                  ${student.roll_number && student.roll_number !== 'N/A' ? student.roll_number : (student.roll_no || student.student_id || 'N/A')}
                </div>
              </div>
              <div class="info-row">
                <div class="info-label">Reg No</div>
                <div class="info-sep">:</div>
                <div class="info-value">${student.registration_no}</div>
              </div>
              <div class="info-row">
                <div class="info-label">Class</div>
                <div class="info-sep">:</div>
                <div class="info-value">${student.class}</div>
              </div>
              <div class="info-row">
                <div class="info-label">Section</div>
                <div class="info-sep">:</div>
                <div class="info-value">${student.section}</div>
              </div>
            </div>
          </div>
          <div class="footer-accent">
          <div class="footer-accent-line-1"></div>
            <div class="footer-accent-line-2"></div>
            <div class="footer-accent-bar"></div>
          </div>
          <div class="footer-solid"></div>
        </div>

        <!-- BACK SIDE -->
        <div class="card" style="display:flex; flex-direction:column;">
          <div class="header" style="height: 95px; display: flex; justify-content: center; align-items: center;">
            <div class="header-pattern"></div>
           
          </div>
          <div class="yellow-bar" style="height:20px;">
            <div class="yellow-bar-main" style="height:12px;"></div>
          </div>
          <div class="back-body" style="padding: 10px 20px; flex: 1; display: flex; flex-direction: column; gap: 10px;">
            <div class="terms-box" style="background: #f3e8ff; padding: 10px 12px; border-radius: 12px;">
              <div style="font-size:11px; font-weight:900; color:#5a1885; margin-bottom:6px; text-transform:uppercase; text-align:center;">TERMS & CONDITIONS</div>
              ${termsList.slice(0, 3).map(term => `<div style="font-size:8px; color:#333; margin-bottom:3px; display:flex; gap:6px; line-height:1.2;"><span style="color:#5a1885">•</span><span>${term}</span></div>`).join('')}
            </div>

            <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; margin-top: 5px;">
              <div style="color: #5a1885; padding: 5px 20px; border-radius: 20px; font-size: 9px; font-weight: 900; margin-bottom: 15px; letter-spacing: 0.5px; text-transform: uppercase; width: fit-content;  background: transparent;">SCAN FOR ATTENDANCE</div>
              <div style="background: #fff; padding: 6px; border-radius: 12px; border: 1px solid #f1f5f9; display: inline-block;">
                <div style="width: 80px; height: 80px; display: flex; align-items: center; justify-content: center;">
                  ${qrCodeHTML}
                </div>
              </div>
            </div>

            <div style="text-align: center; padding: 10px 0; margin-top: auto;">
              <div style="height: 20px; width: 140px; margin: 0 auto; border-bottom: 1.5px dashed #5a1885; opacity: 0.4; margin-bottom: 2px;"></div>
              <div style="font-size: 10px; font-weight: 900; color: #5a1885; letter-spacing: 1px;">PRINCIPAL SIGNATURE</div>
            </div>

            <div style="text-align: center; padding-bottom: 5px;">
              <div style="font-size: 9px; font-weight: 800; color: #5a1885;">${phone}</div>
              <div style="font-size: 8px; fontWeight: 500; color: #666;">${email}</div>
            </div>
          </div>
          
          <div class="footer-solid" style="height: 25px; background: #5a1885; width: 100%;"></div>
        </div>
      </div>
    </body>
    </html>
  `;
};

export const generateAndDownloadIdCard = async ({ role, person, institute, policyConfig }) => {
  let iframe = null;

  try {
    const { jsPDF } = await import('jspdf');
    const html2canvas = (await import('html2canvas')).default;

    const student = flattenStudentData(person);
    const finalPolicyConfig = { ...DEFAULT_POLICY_CONFIG, ...policyConfig };
    const completeHTML = await createCompleteCardHTML(student, institute, finalPolicyConfig);

    // Render inside a hidden iframe to isolate from app-level CSS color functions (e.g. lab/oklch).
    iframe = document.createElement('iframe');
    iframe.setAttribute('aria-hidden', 'true');
    iframe.style.position = 'fixed';
    iframe.style.top = '-10000px';
    iframe.style.left = '-10000px';
    iframe.style.width = '1400px';
    iframe.style.height = '2000px';
    iframe.style.border = '0';
    iframe.style.opacity = '0';
    document.body.appendChild(iframe);

    const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
    if (!iframeDoc) {
      throw new Error('Could not initialize isolated render document');
    }

    iframeDoc.open();
    iframeDoc.write(completeHTML);
    iframeDoc.close();

    // Wait for images to load
    const images = iframeDoc.querySelectorAll('img');
    const imagePromises = Array.from(images).map(img => {
      return new Promise((resolve) => {
        if (img.complete) {
          resolve();
        } else {
          img.onload = resolve;
          img.onerror = resolve;
        }
      });
    });

    await Promise.all(imagePromises);

    // Capture both card sides together as a single sheet.
    const sheet = iframeDoc.querySelector('.sheet') || iframeDoc.body;
    const canvas = await html2canvas(sheet, {
      allowTaint: true,
      useCORS: true,
      backgroundColor: '#f1f5f9',
      scale: 2,
      logging: false,
      imageTimeout: 0,
      windowWidth: Math.max(sheet.scrollWidth, 1200),
      windowHeight: Math.max(sheet.scrollHeight, 900),
    });

    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
      compress: true
    });

    const imgData = canvas.toDataURL('image/jpeg', 0.95);
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const maxWidth = pageWidth - 10;
    const maxHeight = pageHeight - 10;
    const scale = Math.min(maxWidth / canvas.width, maxHeight / canvas.height);
    const imgWidth = canvas.width * scale;
    const imgHeight = canvas.height * scale;
    const x = (pageWidth - imgWidth) / 2;
    const y = (pageHeight - imgHeight) / 2;

    pdf.addImage(imgData, 'JPEG', x, y, imgWidth, imgHeight);

    // Download the PDF
    const fileName = `${student.full_name.replace(/\s+/g, '-')}-ID-Card.pdf`;
    pdf.save(fileName);

    return { success: true, message: 'ID Card downloaded successfully' };
  } catch (error) {
    console.error('Error generating ID card:', error);
    throw new Error('Failed to generate ID card: ' + error.message);
  } finally {
    if (iframe && iframe.parentNode) {
      iframe.parentNode.removeChild(iframe);
    }
  }
};

export default generateAndDownloadIdCard;
