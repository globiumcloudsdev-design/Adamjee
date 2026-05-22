

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
    id
  };

  const qrValue = JSON.stringify(payload);
  console.log('PDF Generated QR value:', qrValue);
  return qrValue;
};

const resolveStudentGrNumber = (student, details = {}) => {
  return (
    student?.studentProfile?.rollNumber ||
    student?.studentProfile?.roll_number ||
    student?.roll_number ||
    student?.roll_no ||
    details?.academic_info?.roll_no ||
    details?.academic_info?.roll_number ||
    "N/A"
  );
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

    roll_number: resolveStudentGrNumber(student, details),

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
      ? `<img src="${student.qr_code_url}" onerror="this.onerror=null; this.src='${qrFallbackDataUrl}'" style="width:0.7in;height:0.7in;border-radius:4px;background:#fff;" />`
      : qrFallbackDataUrl
        ? `<img src="${qrFallbackDataUrl}" style="width:0.7in;height:0.7in;border-radius:4px;background:#fff;" />`
        : ''
    : "";

  // Redesigned card: 3 inches width × 4 inches height
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    @page {
      size: 2.91in 4.13in;
      margin: 0;
    }

    *{
      margin:0;
      padding:0;
      box-sizing:border-box;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
      font-family: 'Segoe UI', Arial, sans-serif;
    }

    html, body {
      width: 2.91in;
      height: 4.13in;
    }

    body{
      background:#fff;
    }

    .card {
      position:relative;
      width:2.91in;
      height:4.13in;
      background:linear-gradient(135deg, #f5f5f5 0%, #ffffff 100%);
      border:1px solid #e0e0e0;
      padding:0;
      overflow:hidden;
    }

  

 .photo-section {
  position:absolute;
  top:0.15in;
  left:1.4in;
  width:0.79in;
  height:0.79in;
}

    .photo-box {
      width:0.79in;
      height:0.79in;
      border:1px solid #1f3a93;
      overflow:hidden;
      background:#fff;
      display:flex;
      align-items:center;
      justify-content:center;
      border-radius:2px;
      box-shadow:0 1px 4px rgba(0,0,0,0.1);
    }

    .photo-box img {
      width:100%;
      height:100%;
      object-fit:cover;
    }

    .avatar-placeholder {
      width:100%;
      height:100%;
      background:#ffffff;
    }

    .info-section {
      position:absolute;
      left:1in;
      top:0.5in;
      right:0.15in;
      color:#1f2937;
      font-size:10px;
    }

.info-field {
      display: grid;
      grid-template-columns: 0.4in 1.1in;
      column-gap: 0.1in;
      row-gap: 0in;
      margin-bottom: 0.1in;
      line-height: 1.2;
      align-items: start;
    }

    .field-label {
      font-size:11px;
      font-weight:700;
      color:#1f3a93;
      text-transform:uppercase;
      letter-spacing:0.1px;
    }

    .field-value {
      font-size:12px;
      font-weight:600;
      color:#111827;
      line-height:1.5;
    }

    .subject-value {
      line-height:1.2;
      max-height:0.28in;
      font-size:12px;
      font-weight:600;
      color:#111827;
      word-break:break-word;
      margin-left:0.1in;
    }

    .contact-value {
      font-size:8px;
      font-weight:600;
      color:#111827;
      word-break:break-word;
      line-height:1.2;
    }

    .qr-section {
      position:absolute;
      left:1.4in;
      bottom:0.2in;
      width:1in;
      height:1in;
      display:flex;
      align-items:center;
      justify-content:center;
      border:none;
      border-radius:0;
    }

    .qr-section img {
      width:100%;
      height:100%;
      object-fit:contain;
    }

    .footer-text {
      position:absolute;
      right:0.15in;
      bottom:0.15in;
      font-size:7px;
      color:#999;
      text-align:right;
      font-weight:600;
    }

    @media print {
      body {
        margin:0;
        padding:0;
      }
      .card {
        box-shadow:none;
      }
    }
  </style>
</head>
<body>
  <div class="card">

    <div class="photo-section">
      <div class="photo-box">
        ${student.photo_url
      ? `<img src="${student.photo_url}" />`
      : `<div class="avatar-placeholder"></div>`
    }
      </div>
    </div>

    <div class="info-section">
      <div class="info-field">
        <div class="field-label">Name:</div>
        <div class="field-value">${student.full_name}</div>
      </div>

      <div class="info-field">
        <div class="field-label">GR No.:</div>
        <div class="field-value">${student.roll_number}</div>
      </div>

      <div class="info-field">
        <div class="field-label">Class:</div>
        <div class="field-value">${student.class} - ${student.section}</div>
      </div>

      <div class="info-field">
        <div class="field-label">Subject:</div>
        <div class="field-value subject-value">${student.subjects && student.subjects.length > 0 ? student.subjects.join(', ') : 'N/A'}</div>
      </div>

  
    </div>

    <div class="qr-section">
      ${qrCodeHTML}
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
    iframe.style.width = '280px';
    iframe.style.height = '397px';
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
    const sheet = iframeDoc.querySelector('.card') || iframeDoc.body;
    const PRINT_DPI = 600;
    const CSS_DPI = 96;
    const renderScale = Math.min(PRINT_DPI / CSS_DPI, 4);

    const canvas = await html2canvas(sheet, {
      allowTaint: true,
      useCORS: true,
      backgroundColor: '#ffffff',
      scale: renderScale,
      logging: false,
      imageTimeout: 0,
      windowWidth: 280,
      windowHeight: 397,
    });

    const CR100_MM = { width: 102, height: 76 }; // CR100 card size in mm
    const A7_MM = { width: 74, height: 105 }; // A7 size: 74mm × 105mm

    const cardDimensions = (finalPolicyConfig?.cardSize === 'CR100')
      ? [CR100_MM.width, CR100_MM.height]
      : [A7_MM.width, A7_MM.height]; // Default to A7 size

    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: cardDimensions,
      compress: true
    });

    const imgData = canvas.toDataURL('image/png');
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();

    // Add image filling entire page
    pdf.addImage(imgData, 'PNG', 0, 0, pageWidth, pageHeight);

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