

// export default generateAndDownloadIdCard;
const DEFAULT_POLICY_CONFIG = {
  layout: 'vertical',
  card_type: 'student',
  show_photo: true,
  show_watermark: true,
  qr_enabled: true,
  design: {
    background_color: '#ffffff',     // Purple
    accent_color: '#ffffff',         // Yellow
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
  const academicInfo = details?.academic_info || {};
  
  // Extract subjects from enrollment data
  const subjects = Array.isArray(academicInfo?.subjects) 
    ? academicInfo.subjects.map(s => s?.name || s).filter(Boolean)
    : [];

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
      "NORTH NIZAMUDDIN CAMPUS-12",

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
    subjects: subjects,

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
  const bgColor = design.background_color || '#ffffff';
  const accentColor = design.accent_color || '#ffffff';
  const textColor = design.text_color || '#ffffff';
  const logoUrl = institute?.logo_url || '/id-logo.png';
  const instituteName = institute?.name || 'ADAMJEE COACHING CENTRE';
  const tagline = institute?.settings?.academic?.school_tagline || 'The Best in Coaching';
  const address = institute?.address || 'North Nazimabad, Karachi, Pakistan';
  const phone = institute?.phone || '+92 123 4567890';
  const email = institute?.email || 'info@adamjee.edu.pk';

  const qrFallbackDataUrl = showQr
    ? await generateQRCodeDataUrl(student.qr_value || student.roll_number)
    : '';
  const qrCodeHTML = showQr
    ? student.qr_code_url
      ? `<img src="${student.qr_code_url}" onerror="this.onerror=null; this.src='${qrFallbackDataUrl}'" style="width:100px;height:100px;border-radius:12px;background:#fff;padding:8px;box-shadow:0 5px 15px rgba(0,0,0,0.1);" />`
      : qrFallbackDataUrl
        ? `<img src="${qrFallbackDataUrl}" style="width:100px;height:100px;border-radius:12px;background:#fff;padding:8px;box-shadow:0 5px 15px rgba(0,0,0,0.1);" />`
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
          .sheet { display: flex; flex-direction: column; justify-content: flex-start; align-items: center; gap: 20px; margin-left: 20px; }
.card { width: 340px; height: 215px; border-radius: 24px; overflow: hidden; position: relative; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.2); border: 1px solid rgba(255,255,255,0.3); background: white; margin: 15px; box-sizing: border-box; }
          .front { background: ${bgColor}; color: ${textColor}; display: flex; height: 100%; overflow: hidden; }
          .back { background: white; height: 100%; overflow: hidden; display: flex; flex-direction: column; }
          .front::before { content: ''; position: absolute; top: 0; left: 0; right: 0; bottom: 0; background-image: radial-gradient(circle at 2px 2px, rgba(255,255,255,0.05) 1px, transparent 0); background-size: 15px 15px; pointer-events: none; }
          .info-box { flex: 1; min-height: 0; overflow: hidden; display: flex; flex-direction: column; justify-content: space-between; }
          .back-body { flex: 1; min-height: 0; overflow: hidden; display: flex; flex-direction: column; }
          .terms { flex: 0 0 auto; }
          .qr-section { flex: 1; min-height: 0; overflow: hidden; }
          .qr-container { display: flex; align-items: center; justify-content: center; height: 100%; }
          .contact-mini { flex: 0 0 auto; }
          .accent-strip { width: 135px; background: linear-gradient(165deg, ${accentColor} 0%, ${bgColor} 100%); display: flex; flex-direction: column; align-items: center; padding: 20px 12px; position: relative; border-right: 1px solid rgba(255,255,255,0.15); z-index: 1; }
          .photo-box { width: 90px; height: 105px; border-radius: 16px; border: 4px solid white; overflow: hidden; margin-top: 0px; background: #1e293b; box-shadow: 0 12px 24px rgba(0,0,0,0.25); position: fixed; }
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
          <div class="back-body">
            <!-- Photo on top -->
            <div style="width:100%; display:flex; justify-content:center; margin-top:0px;">
              <div class="photo-box" style="width:90px; height:105px; margin-top:0;">
                ${student.photo_url
                  ? `<img src="${student.photo_url}" style="width:100%; height:100%; object-fit:cover;" />`
                  : `<span style="font-size:40px;">${student.gender?.toLowerCase() === 'female' ? '👧' : '👦'}</span>`
                }
              </div>
            </div>

            <!-- Student info block (left margin 20px) -->
            <div class="student-info" style="margin-top:8px; padding: 0 16px; margin-left:20px;">
              <div style="font-size:9px; font-weight:800; opacity:0.6; text-transform:uppercase; margin-bottom:3px;">STUDENT INFO</div>
              <div style="font-size:11px; font-weight:900; color:#111; line-height:1.6;">
                <div><span style="color:${accentColor}; font-weight:900;">Name:</span> ${student.full_name}</div>
                <div><span style="color:${accentColor}; font-weight:900;">Reg:</span> ${student.registration_no}</div>
                <div><span style="color:${accentColor}; font-weight:900;">Class:</span> ${student.class}</div>
                <div><span style="color:${accentColor}; font-weight:900;">Section:</span> ${student.section}</div>
                ${
                  student.subjects && student.subjects.length > 0
                    ? `<div style="margin-top: 8px; border-top: 1px dashed ${accentColor}; padding-top: 5px;">
                        <span style="color:${accentColor}; font-weight:900;">Subjects:</span> ${student.subjects.join(', ')}
                      </div>`
                    : ''
                }
              </div>
            </div>

            <!-- QR at bottom -->
            <div class="qr-section">
              <div style="text-align:center; margin-left:20px; margin-right:8px;">
                <div class="attendance-label">SCAN FOR ATTENDANCE</div>
                <div class="qr-container">${qrCodeHTML}</div>
              </div>
            </div>
          </div>
        </div>
        </div>
      </body>
      </html>
    `;
  }

  // Default: Coaching Card with enhanced sidebar matching the image template
return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    *{
      margin:0;
      padding:0;
      box-sizing:border-box;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
      font-family: 'Segoe UI', 'Poppins', Arial, sans-serif;
    }

    body{
      background:#f0f0f0;
      padding:30px;
    }

    .sheet{
      display:flex;
      justify-content:center;
      align-items:flex-start;
      gap:40px;
      flex-wrap:wrap;
    }

    .card{
      width:370px;
      min-height:580px;
      background:#fff;
      border:8px solid ${bgColor};
      border-radius:12px;
      overflow:hidden;
      box-shadow:0 15px 35px rgba(0,0,0,.2);
      transition: transform 0.3s ease;
    }

    .card:hover {
      transform: translateY(-5px);
    }

    /* FRONT STYLES */
    .header{
      background:${bgColor};
      color:${accentColor};
      text-align:center;
      padding:16px;
      font-size:26px;
      font-weight:900;
      text-transform:uppercase;
      letter-spacing:1px;
    }

    .sub{
      color:#fff;
      font-size:13px;
      margin-top:6px;
      font-weight:600;
      letter-spacing:0.5px;
    }

    .months{
      display:grid;
      grid-template-columns:repeat(3,1fr);
    }

    .month{
      border:2px solid #222;
      height:88px;
      display:flex;
      justify-content:center;
      align-items:flex-start;
      padding-top:14px;
      text-align:center;
      font-weight:800;
      font-size:16px;
      color:#222;
      background:#fafafa;
      transition: all 0.2s ease;
    }

    .month:hover {
      background:${accentColor}20;
    }

    .footer{
      background:${bgColor};
      color:white;
      text-align:center;
      padding:20px;
    }

    .footer h3{
      color:${accentColor};
      margin-bottom:10px;
      font-size:22px;
      font-weight:800;
    }

    .footer p{
      font-size:13px;
      margin:5px 0;
      line-height:1.4;
    }

    .website{
      color:${accentColor};
      font-weight:800;
      margin-top:12px;
      font-size:16px;
      letter-spacing:0.5px;
    }

    /* BACK STYLES - Enhanced Sidebar */
    .back{
      display:flex;
      min-height:580px;
      padding-left:0;
    }

.side-strip{
      width:100px;
      transform: translateX(-20%);
      background:${bgColor};
      display:flex;
      flex-direction:column;
      align-items:center;
      justify-content:space-between;
      padding:20px 0;
      gap:1px;
      position:relative;
    }

    .side-strip::after {
      content: '';
      position: absolute;
      bottom: 0;
      right: 0;
      width: 100%;
      height: 3px;
      background: ${accentColor};
    }

    .side-logo{
      width:32px;
      height:32px;
      background:white;
      border-radius:50%;
      display:flex;
      align-items:center;
      justify-content:center;
      padding:5px;
      box-shadow:0 4px 10px rgba(0,0,0,.2);
    }

    .side-logo img{
      width:100%;
      height:100%;
      object-fit:contain;
    }

.vertical-block{
      writing-mode:horizontal-tb;
      transform:rotate(270deg);
      text-align:right;
      font-weight:700;
      line-height:1.1;
      letter-spacing:0.4px;
    }

    .vertical-block.campus-name {
      color:${accentColor};
      font-size:10px;
      font-weight:600;
    }

    .vertical-block.campus-name span {
      display:block;
      color:white;
      font-size:9px;
      margin-top:3px;
      font-weight:500;
    }

    .vertical-block.coaching-name {
      color:white;
      font-size:13px;
      font-weight:900;
    }

    .vertical-block.coaching-name span {
      display:block;
      color:${accentColor};
      font-size:10px;
      margin-top:3px;
    }

    .vertical-block.class-info {
      color:${accentColor};
      font-size:9px;
      font-weight:700;
    }

    .vertical-block.class-info span {
      display:block;
      color:rgba(255,255,255,0.7);
      font-size:8px;
      margin-top:2px;
    }

    .vertical-block.subjects {
      color:white;
      font-size:8px;
      font-weight:600;
      opacity:0.8;
    }

    .vertical-block.subjects span {
      display:block;
      margin-top:2px;
    }

    .vertical-block.package-title {
      color:${accentColor};
      font-size:9px;
      font-weight:800;
      letter-spacing:1px;
    }

    .vertical-block.months {
      color:white;
      font-size:9px;
      font-weight:600;
      display:flex;
      flex-direction:column;
      gap:6px;
    }

    .month-item {
      background:rgba(255,215,0,0.2);
      padding:3px 0;
      border-radius:10px;
      font-weight:800;
      font-size:8px;
    }

    .back-content{
      flex:1;
      padding:25px 20px;
      display:flex;
      flex-direction:column;
      align-items:center;
      background: linear-gradient(135deg, #ffffff 0%, #fefefe 100%);
      margin-left:0px;
    }

    .photo-box{
      width:140px;
      height:160px;
      border:#000000;
      border-radius:12px;
      overflow:hidden;
      margin-bottom:20px;
      background:#fff;
      box-shadow:0 8px 20px rgba(0,0,0,0.1);
    }

    .photo-box img{
      width:100%;
      height:100%;
      object-fit:cover;
    }

    .avatar-placeholder{
      width:100%;
      height:100%;
      display:flex;
      align-items:center;
margin-top:-10px;  
font-size:50px;
border-radius:12px;
border-color:#000000;
      background:#fff;
      color:${bgColor};
      box-shadow:0 8px 20px rgba(0,0,0,0.1);
   }

.info-container{     width:100%;       border-radius:12px;      padding:15px;      background:#fff;     margin-bottom:15px;      margin-left:20px;    }

    .student-info{
      line-height:2;
      font-size:13px;
      color:#333;
      margin-left:50px;
    }

    .student-info b{
      color:${bgColor};
      display:inline-block;
      width:70px;
      font-size:12px;
    }

    .info-row {
      display: flex;
      margin-bottom: 8px;
      border-bottom: 1px dashed #eee;
      padding-bottom: 5px;
    }

    .info-label {
      font-weight: 800;
      color: #000000;
      width: 75px;
      font-size: 11px;
      text-transform: uppercase;
    }

    .info-value {
      color: #333;
      font-size: 12px;
      font-weight: 500;
      flex: 1;
      max-width: 50%;
      word-wrap: break-word;
      word-break: break-word;
      overflow-wrap: break-word;
    }

    .qr-wrap{
      margin-top:10px;
      display:flex;
      justify-content:center;
    }

    .qr-wrap img{
      width:85px;
      height:85px;
      border-radius:10px;
    }

    .badge {
      background: ${accentColor};
      color: ${bgColor};
      padding: 4px 12px;
      border-radius: 20px;
      font-size: 9px;
      font-weight: 800;
      text-transform: uppercase;
      margin-bottom: 12px;
      display: inline-block;
    }

    @media print{
      body{
        background:#fff;
        padding:0;
      }
      .card{
        box-shadow:none;
        break-inside: avoid;
      }
      .card:hover {
        transform: none;
      }
    }
  </style>
</head>
<body>

<div class="sheet">

  <!-- FRONT SIDE - Months Layout -->
  <div class="card">
    <div class="header">
      ${instituteName}
      <div class="sub">${student.branch_name}</div>
    </div>

    <div class="months">
      <div class="month">JANUARY</div>
      <div class="month">FEBRUARY</div>
      <div class="month">MARCH</div>
      <div class="month">APRIL</div>
      <div class="month">MAY</div>
      <div class="month">JUNE</div>
      <div class="month">JULY</div>
      <div class="month">AUGUST</div>
      <div class="month">SEPTEMBER</div>
      <div class="month">OCTOBER</div>
      <div class="month">NOVEMBER</div>
      <div class="month">DECEMBER</div>
    </div>

    <div class="footer">
      <h3>${student.branch_name}</h3>
   
      <div class="website">${instituteName}</div>
    </div>
  </div>

  <!-- BACK SIDE - Enhanced with Sidebar Text (Matching your image) -->
  <div class="card back">
    

    <div class="back-content">
      
      <div class="photo-box">
        ${
          student.photo_url
            ? `<img src="${student.photo_url}" />`
            : `<div class="avatar-placeholder">
                ${student.gender?.toLowerCase() === 'female' ? '👧' : '👦'}
              </div>`
        }
      </div>

      <div class="info-container">
        <div class="student-info">
          <div class="info-row">
            <div class="info-label">Name:</div>
            <div class="info-value">${student.full_name}</div>
          </div>
      
          <div class="info-row">
            <div class="info-label">Reg No:</div>
            <div class="info-value">${student.registration_no}</div>
          </div>
          <div class="info-row">
            <div class="info-label">Class:</div>
            <div class="info-value">${student.class} - ${student.section}</div>
          </div>
          <div class="info-row">
            <div class="info-label">Parent:</div>
            <div class="info-value">${student.parent_name}</div>
          </div>
          <div class="info-row">
            <div class="info-label">Blood:</div>
            <div class="info-value">${student.blood_group}</div>
          </div>
          ${
            student.subjects && student.subjects.length > 0
              ? `<div class="info-row">
                  <div class="info-label">Subjects:</div>
                  <div class="info-value">${student.subjects.join(', ')}</div>
                </div>`
              : ''
          }
        </div>

        ${
          qrCodeHTML
            ? `<div class="qr-wrap">${qrCodeHTML}</div>`
            : ""
        }
      </div>
   
    </div>
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

    const CR100_MM = { width: 102, height: 76 }; // default sensible CR100 card size in mm

    const formatOption = (finalPolicyConfig?.cardSize === 'CR100')
      ? [CR100_MM.width, CR100_MM.height]
      : 'a4';

    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: formatOption,
      compress: true
    });

    const imgData = canvas.toDataURL('image/jpeg', 0.95);
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();

    // Fit canvas into the target card/page size
    const maxWidth = pageWidth;
    const maxHeight = pageHeight;
    const scale = Math.min(maxWidth / canvas.width, maxHeight / canvas.height);
    const imgWidth = canvas.width * scale;
    const imgHeight = canvas.height * scale;

    // For CR100 we remove extra margins; for A4 keep slight centering
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