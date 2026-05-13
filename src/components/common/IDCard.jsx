
'use client';

import { useState } from 'react';
import { Download } from 'lucide-react';
import { generateAndDownloadIdCard } from '@/lib/idCardGenerator';
import { QRCodeSVG } from 'qrcode.react';

const looksLikeIdValue = (value) => {
  if (typeof value !== 'string') return false;
  const trimmed = value.trim();
  if (!trimmed) return false;

  return (
    /^\d+$/.test(trimmed) ||
    /^[0-9a-f]{24}$/i.test(trimmed) ||
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(trimmed)
  );
};

const resolveSectionName = (studentData = {}) => {
  console.log('Section resolution data:', studentData); // Debug
  // Enhanced resolution - more data paths
  const sectionId =
    studentData.section_id ||
    studentData.studentProfile?.section ||
    studentData.details?.academic_info?.section_id ||
    studentData.details?.section_id ||
    studentData.section;

  const sections = Array.isArray(studentData.sections) ? studentData.sections : [];
  if (sectionId) {
    const section = sections.find(sec => sec.id === sectionId || sec._id === sectionId);
    if (section?.name) return section.name;

    // Direct section_name fallback
    const directNames = [
      studentData.section_name,
      studentData.sectionName,
      studentData.class_section,
      studentData.details?.section_name,
    ];
    for (const name of directNames) {
      if (typeof name === 'string' && name.trim() && !looksLikeIdValue(name.trim())) {
        return name.trim();
      }
    }

    return String(sectionId);
  }

  // Comprehensive candidates
  const candidates = [
    studentData.section_name,
    studentData.sectionName,
    studentData.class_section,
    studentData.section?.name,
    studentData.details?.academic_info?.section_name,
    studentData.details?.academic_info?.section?.name,
    studentData.details?.section?.name,
    studentData.studentProfile?.sectionName,
    studentData.studentProfile?.section_name,
    studentData.academic_info?.section_name,
  ];

  for (const candidate of candidates) {
    if (typeof candidate === 'string') {
      const trimmed = candidate.trim();
      if (trimmed && !looksLikeIdValue(trimmed)) {
        console.log('Resolved section:', trimmed);
        return trimmed;
      }
    }
  }

  console.warn('No valid section name found');
  return 'Section A'; // Better fallback
};



const buildStudentQrValue = (studentData = {}) => {
  const id = studentData.id || studentData.student_id || studentData.user_id || studentData.roll_number || 'student';
  const regNum = studentData.registration_no || studentData.registrationNumber || studentData.roll_number || 'REG-' + Date.now();
  const fullName = studentData.full_name || studentData.name || studentData.first_name + ' ' + studentData.last_name || 'Student';

  const payload = {
    id: id,
    registrationNumber: regNum,
    role: 'student',
    fullName: fullName.trim(),
  };

  const qrValue = JSON.stringify(payload);
  console.log('Generated QR value:', qrValue);
  return qrValue;
};

const resolveStudentGrNo = (studentData = {}) => (
  studentData.studentProfile?.rollNumber ||
  studentData.studentProfile?.roll_number ||
  studentData.roll_number ||
  studentData.roll_no ||
  studentData.details?.academic_info?.roll_no ||
  studentData.details?.academic_info?.roll_number ||
  'N/A'
);


// QR Code Component
const QRCodeDisplay = ({ size = 100, value = '', accentColor = '#cda080', logoUrl }) => (
  <div style={{
    width: size + 16, height: size + 16, background: '#fff', padding: 8, borderRadius: 16,
    boxShadow: '0 10px 30px rgba(0,0,0,0.08)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    border: `1px solid #f1f5f9`
  }}>
    <QRCodeSVG
      value={value || 'ADAMJEE'}
      size={size}
      level="H"
      includeMargin={false}
      imageSettings={logoUrl ? {
        src: logoUrl,
        x: undefined,
        y: undefined,
        height: size * 0.2,
        width: size * 0.2,
        excavate: true,
      } : undefined}
    />
  </div>
);

// ==================== NEW COMPACT CARD (3" x 4") ====================
const StudentIDCard = ({ institute, design, student }) => {
  return (
    <div style={{
      width: 228, // 3 inches at 96 DPI
      height: 304, // 4 inches at 96 DPI
      background: 'linear-gradient(135deg, #f5f5f5 0%, #ffffff 100%)',
      borderRadius: 4,
      overflow: 'hidden',
      position: 'relative',
      fontFamily: "'Segoe UI', Arial, sans-serif",
      boxShadow: '0 10px 30px rgba(0,0,0,0.15)',
      color: '#1f2937',
      border: '1px solid #e0e0e0'
    }}>

      {/* Header */}
      <div style={{
        background: 'linear-gradient(90deg, #1f3a93 0%, #2d5aa8 100%)',
        color: '#fff',
        padding: '6px 12px',
        textAlign: 'center',
        fontSize: 9,
        fontWeight: 700,
        letterSpacing: '0.5px',
        overflow: 'hidden',
        whiteSpace: 'nowrap',
        textOverflow: 'ellipsis'
      }}>
        {institute?.name || 'ADAMJEE COACHING CENTRE'}
      </div>

      {/* Photo Section - positioned at 1.4" from left */}
      <div style={{
        position: 'absolute',
        left: 106, // 1.4 inches in pixels
        top: 24,
        width: 60, // 0.79 inches (2cm)
        height: 60,
        border: '1px solid #1f3a93',
        overflow: 'hidden',
        background: '#fff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 2,
        boxShadow: '0 1px 4px rgba(0,0,0,0.1)'
      }}>
        {student.photo_url ? (
          <img src={student.photo_url} alt={student.full_name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <div style={{ width: '100%', height: '100%', background: '#f0f0f0', border: '1px dashed #ccc' }} />
        )}
      </div>

      {/* Info Section - starts at 1" from left */}
      <div style={{
        position: 'absolute',
        left: 76, // 1 inch
        top: 122,
        right: 11,
        fontSize: 10,
        color: '#1f2937'
      }}>

        {/* Name Field */}
        <div style={{ display: 'grid', gridTemplateColumns: '55px 75px', gap: 6, marginBottom: 8, lineHeight: 1.2, alignItems: 'start' }}>
          <div style={{ fontSize: 7, fontWeight: 700, color: '#1f3a93', textTransform: 'uppercase', letterSpacing: '0.3px' }}>
            Name:
          </div>
          <div style={{ fontSize: 8, fontWeight: 600, color: '#111827', wordBreak: 'break-word', lineHeight: 1.25 }}>
            {student.full_name}
          </div>
        </div>

        {/* GR No. Field */}
        <div style={{ display: 'grid', gridTemplateColumns: '55px 75px', gap: 6, marginBottom: 8, lineHeight: 1.2, alignItems: 'start' }}>
          <div style={{ fontSize: 7, fontWeight: 700, color: '#1f3a93', textTransform: 'uppercase', letterSpacing: '0.3px' }}>
            GR No.:
          </div>
          <div style={{ fontSize: 8, fontWeight: 600, color: '#111827' }}>
            {resolveStudentGrNo(student)}
          </div>
        </div>

        {/* Class Field */}
        <div style={{ display: 'grid', gridTemplateColumns: '55px 75px', gap: 6, marginBottom: 8, lineHeight: 1.2, alignItems: 'start' }}>
          <div style={{ fontSize: 7, fontWeight: 700, color: '#1f3a93', textTransform: 'uppercase', letterSpacing: '0.3px' }}>
            Class:
          </div>
          <div style={{ fontSize: 8, fontWeight: 600, color: '#111827' }}>
            {student.class} - {student.section_display || student.section || 'N/A'}
          </div>
        </div>

        {/* Subject Field */}
        <div style={{ display: 'grid', gridTemplateColumns: '55px 75px', gap: 6, marginBottom: 6, lineHeight: 1.2, alignItems: 'start' }}>
          <div style={{ fontSize: 7, fontWeight: 700, color: '#1f3a93', textTransform: 'uppercase', letterSpacing: '0.3px' }}>
            Subject:
          </div>
          <div style={{ fontSize: 7, fontWeight: 600, color: '#111827', lineHeight: 1.25, maxHeight: 22, overflow: 'hidden', wordBreak: 'break-word' }}>
            {student.subjects && student.subjects.length > 0 ? student.subjects.join(', ') : 'N/A'}
          </div>
        </div>

        {/* Contact Field */}
        <div style={{ display: 'grid', gridTemplateColumns: '55px 75px', gap: 6, marginBottom: 0, lineHeight: 1.2, alignItems: 'start' }}>
          <div style={{ fontSize: 7, fontWeight: 700, color: '#1f3a93', textTransform: 'uppercase', letterSpacing: '0.3px' }}>
            Contact:
          </div>
          <div style={{ fontSize: 8, fontWeight: 600, color: '#111827', lineHeight: 1.2, wordBreak: 'break-word' }}>
            {student.phone || 'N/A'}
          </div>
        </div>
      </div>

      {/* QR Code Section - positioned at bottom left, 1" from left */}
      <div style={{
        position: 'absolute',
        left: 76,
        bottom: 11,
        width: 53,
        height: 53,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'transparent',
        border: 'none',
        borderRadius: 0
      }}>
        {student.qr_code_url ? (
          <img src={student.qr_code_url} alt="QR" style={{ width: '100%', height: '100%', objectFit: 'contain', padding: 2 }} />
        ) : (
          <QRCodeDisplay size={50} value={student.registration_no || student.roll_number || 'N/A'} accentColor="#1f3a93" />
        )}
      </div>

      {/* Footer text */}
      <div style={{
        position: 'absolute',
        right: 11,
        bottom: 11,
        fontSize: 6,
        color: '#999',
        textAlign: 'right',
        fontWeight: 600
      }}>
        ID Card
      </div>
    </div>
  );
};

// ==================== BACK CARD (No longer needed - kept for reference) ====================
const CardBackVertical = ({ institute, design, student, termsList, showQr }) => {
  // Back card is integrated into front for compact 3x4 design
  return null;
};


const IDCardViewer = ({ studentData = {}, institute: instituteProp = null, policyOverride = null, hideControls = false }) => {
  const [isDownloading, setIsDownloading] = useState(false);

  const defaultInstitute = {
    name: "ADAMJEE COACHING CENTRE",
    logo_url: "/logo.png",
    address: "City Branch, Pakistan",
    phone: "+92 123 4567890",
    email: "info@adamjee.edu.pk"
  };

  const institute = instituteProp || defaultInstitute;

  const policy = policyOverride || {
    config: {
      design: {
        background_color: '#0f172a',
        accent_color: '#f97316',
        text_color: '#ffffff',
      },
      terms_list: [
        "This card is the property of the institution.",
        "Loss of card must be reported immediately.",
        "This card is non-transferable."
      ]
    }
  };

  const design = policy?.config?.design || {
    background_color: '#0f172a',
    accent_color: '#f97316',
    text_color: '#ffffff',
  };
  const termsList = policy?.config?.terms_list || [
    "This card is the property of the institution.",
    "Loss of card must be reported immediately.",
    "This card is non-transferable."
  ];

  const student = {
    full_name: 'Student Name',
    parent_name: 'Parent Name',
    roll_number: 'N/A',
    registration_no: 'N/A',
    class: 'Class',
    section: 'N/A',
    section_name: 'N/A',
    section_display: resolveSectionName(studentData),
    branch_name: 'Main Campus',
    shift: 'Morning',
    blood_group: 'O+',
    valid_upto: 'AUG 2026',
    join_date: studentData.join_date || studentData.admission_date || '07/25/2025',
    photo_url: null,

    qr_code_url:
      studentData.qr_code_url ||
      studentData.qrCodeUrl ||
      studentData.studentProfile?.qr?.url ||
      studentData.qr?.url ||
      '',
    qr_value: studentData.qr_value || buildStudentQrValue(studentData),
    ...studentData
  };

  student.roll_number = resolveStudentGrNo(studentData);

  const handleDownload = async () => {
    try {
      setIsDownloading(true);
      await generateAndDownloadIdCard({
        role: 'student',
        person: student,
        institute,
        policyConfig: policy?.config
      });
    } finally {
      setIsDownloading(false);
    }
  };

  const renderCard = () => (
    <div className="w-full flex flex-col items-center justify-center gap-4">
      <StudentIDCard institute={institute} design={design} student={student} />
    </div>
  );

  if (hideControls) return renderCard();

  return (
    <div className="flex flex-col items-center w-full">
      <div className="w-full pb-2">
        <div className="w-full flex justify-center">{renderCard()}</div>
      </div>

      <div className="flex gap-2 mt-6">
        <button
          onClick={handleDownload}
          disabled={isDownloading}
          className="flex items-center gap-2 px-6 py-2.5 rounded-xl border-2 border-slate-900 text-slate-900 text-xs font-bold hover:bg-slate-50 transition-all active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          <Download size={14} /> {isDownloading ? 'Generating...' : 'Download PDF'}
        </button>
      </div>
    </div>
  );
};

export default IDCardViewer;
