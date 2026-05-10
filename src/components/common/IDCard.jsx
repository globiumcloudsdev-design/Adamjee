
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

// ==================== VERTICAL FRONT ====================
const CardFrontVertical = ({ institute, design, student }) => {
  return (
    <div style={{
      width: 280, height: 440,
      background: '#ffffff',
      borderRadius: 15,
      overflow: 'hidden',
      position: 'relative',
      fontFamily: "'Outfit', 'Inter', sans-serif",
      boxShadow: '0 30px 60px rgba(0,0,0,0.15)',
      color: '#000000',
      border: '2px solid #000000'
    }}>

      {/* Header */}
      <div style={{
        height: 85,
        background: '#5a1885',
        position: 'relative',
        padding: '15px 20px',
        display: 'flex',
        alignItems: 'center',
        gap: 12
      }}>
        {/* Triangle Pattern in top right */}
        <div style={{
          position: 'absolute',
          top: 0,
          right: 0,
          width: 80,
          height: 80,
          background: 'rgba(0,0,0,0.1)',
          clipPath: 'polygon(100% 0, 0 0, 100% 100%)',
          zIndex: 1
        }}></div>
        <div style={{
          position: 'absolute',
          top: 0,
          right: 0,
          width: 40,
          height: 40,
          background: 'rgba(255,255,255,0.1)',
          clipPath: 'polygon(100% 0, 0 0, 100% 100%)',
          zIndex: 2
        }}></div>

        <div style={{ background: 'white', padding: 5, borderRadius: '50%', zIndex: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid rgba(255,255,255,0.3)' }}>
          <img src={institute?.logo_url || "/logo.png"} alt="logo" style={{ width: 40, height: 40, objectFit: 'contain' }} />
        </div>
        <div style={{ zIndex: 10, flex: 1 }}>
          <div style={{ fontSize: 13, fontWeight: 900, color: 'white', textTransform: 'uppercase', lineHeight: 1.1 }}>ADAMJEE COACHING CENTRE</div>
          <div style={{ fontSize: 9, fontWeight: 700, color: '#f9b400', textTransform: 'uppercase', marginTop: 2 }}>
            {student.branch_name || institute?.name || "Campus-12"}
          </div>
        </div>
      </div>

      {/* Yellow Bar under header */}
      <div style={{ position: 'relative', height: 25, zIndex: 5 }}>
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '75%',
          height: 15,
          background: '#f9b400',
          clipPath: 'polygon(0 0, 100% 0, 85% 100%, 0 100%)'
        }}></div>
        <div style={{
          position: 'absolute',
          top: 18,
          left: 45,
          width: 40,
          height: 4,
          background: '#f9b400',
          transform: 'skewX(-30deg)'
        }}></div>
        <div style={{
          position: 'absolute',
          top: 18,
          left: 90,
          width: 30,
          height: 4,
          background: '#f9b400',
          transform: 'skewX(-30deg)'
        }}></div>
      </div>

      {/* Profile Photo */}
      <div style={{
        width: 120, height: 140, border: '1px solid #eee',
        overflow: 'hidden', margin: '10px auto 0', background: '#f8fafc',
        boxShadow: '0 10px 20px rgba(0,0,0,0.05)'
      }}>
        {student.photo_url ? (
          <img src={student.photo_url} alt={student.full_name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f1f5f9' }}>
            <img 
              src={student.gender?.toLowerCase() === 'female' 
                ? "https://cdn-icons-png.flaticon.com/512/6997/6997662.png" 
                : "https://cdn-icons-png.flaticon.com/512/6997/6997662.png"} 
              alt="avatar" 
              style={{ width: '80%', height: '80%', objectFit: 'contain', opacity: 0.7 }} 
            />
          </div>
        )}
      </div>

      <div style={{ padding: '15px 25px', display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
        <div style={{ width: '100%', marginBottom: 15 }}>
          <div style={{ fontSize: 16, fontWeight: 900, color: '#000', textTransform: 'uppercase' }}>
            {student.full_name}
          </div>
        </div>

        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ display: 'flex', alignItems: 'baseline' }}>
            <div style={{ width: 80, fontSize: 10, fontWeight: 800, color: '#000' }}>GR No</div>
            <div style={{ fontSize: 10, fontWeight: 800, color: '#000', marginRight: 8 }}>:</div>
            <div style={{ fontSize: 11, fontWeight: 800, color: '#5a1885' }}>
              {student.roll_number && student.roll_number !== 'N/A' ? student.roll_number : (student.roll_no || student.student_id || 'N/A')}
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline' }}>
            <div style={{ width: 80, fontSize: 10, fontWeight: 800, color: '#000' }}>Reg No</div>
            <div style={{ fontSize: 10, fontWeight: 800, color: '#000', marginRight: 8 }}>:</div>
            <div style={{ fontSize: 11, fontWeight: 500, color: '#333' }}>{student.registration_no}</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline' }}>
            <div style={{ width: 80, fontSize: 10, fontWeight: 800, color: '#000' }}>Class</div>
            <div style={{ fontSize: 10, fontWeight: 800, color: '#000', marginRight: 8 }}>:</div>
            <div style={{ fontSize: 11, fontWeight: 500, color: '#333' }}>{student.class}</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline' }}>
            <div style={{ width: 80, fontSize: 10, fontWeight: 800, color: '#000' }}>Section</div>
            <div style={{ fontSize: 10, fontWeight: 800, color: '#000', marginRight: 8 }}>:</div>
            <div style={{ fontSize: 11, fontWeight: 500, color: '#333' }}>{student.section_display || student.section_name || student.section}</div>
          </div>
        </div>
      </div>

      {/* Bottom Yellow Accent */}
      <div style={{ position: 'absolute', bottom: 30, right: 0, width: 100, height: 30, zIndex: 5 }}>
        <div style={{
          position: 'absolute',
          bottom: 12,
          right: 35,
          width: 40,
          height: 4,
          background: '#f9b400',
          transform: 'skewX(-30deg)'
        }}></div>
        <div style={{
          position: 'absolute',
          bottom: 12,
          right: 80,
          width: 25,
          height: 4,
          background: '#f9b400',
          transform: 'skewX(-30deg)'
        }}></div>
        <div style={{
          position: 'absolute',
          bottom: 0,
          right: 0,
          width: '100%',
          height: 10,
          background: '#f9b400',
          clipPath: 'polygon(15% 0, 100% 0, 100% 100%, 0 100%)'
        }}></div>
      </div>

      <div style={{ height: 25, background: '#5a1885', width: '100%', marginTop: 'auto', border: 'none' }}></div>
    </div>
  );
};

// ==================== VERTICAL BACK ====================
const CardBackVertical = ({ institute, design, student, termsList, showQr }) => {
  const purpleColor = '#5a1885';
  const yellowColor = '#f9b400';

  return (
    <div style={{
      width: 280, height: 440,
      background: '#ffffff',
      borderRadius: 15,
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
      fontFamily: "'Outfit', 'Inter', sans-serif",
      boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
      border: '2px solid #000000',
      color: '#000'
    }}>

      {/* Header */}
      <div style={{
        height: 95,
        background: purpleColor,
        position: 'relative',
        padding: '15px 20px',
        display: 'flex',
        alignItems: 'center',
        gap: 12
      }}>
        <div style={{
          position: 'absolute',
          top: 0,
          right: 0,
          width: 80,
          height: 80,
          background: 'rgba(0,0,0,0.1)',
          clipPath: 'polygon(100% 0, 0 0, 100% 100%)',
          zIndex: 1
        }}></div>
   
        {/* <div style={{ zIndex: 10, flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <div style={{ 
            display: 'inline-block', 
            color: 'white', 
            fontSize: 10, 
            fontWeight: 900, 
            padding: '4px 16px', 
            borderRadius: 6,
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            marginTop: 10,
            border: "2.5px solid #f9b400",
            background: 'transparent'
          }}>
            Validate: {student.valid_upto || 'AUG 2026'}
          </div>
        </div> */}
      </div>

      {/* Yellow Bar under header */}
      <div style={{ position: 'relative', height: 20, zIndex: 5 }}>
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '75%',
          height: 12,
          background: yellowColor,
          clipPath: 'polygon(0 0, 100% 0, 85% 100%, 0 100%)'
        }}></div>
      </div>

      <div style={{ flex: 1, padding: '10px 20px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {/* Terms Box */}
        <div style={{ background: '#f3e8ff', padding: '10px 12px', borderRadius: 12 }}>
          <div style={{ fontSize: 11, fontWeight: 900, color: purpleColor, marginBottom: 6, textTransform: 'uppercase', textAlign: 'center' }}>TERMS & CONDITIONS</div>
          {termsList.slice(0, 3).map((term, i) => (
            <div key={i} style={{ fontSize: 8, color: '#333', marginBottom: 3, display: 'flex', gap: 6, lineHeight: 1.2 }}>
              <span style={{ color: purpleColor }}>•</span>
              <span>{term}</span>
            </div>
          ))}
        </div>

      

        {/* QR Code Section */}
        {showQr && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{
              color: purpleColor,
              padding: '5px 20px',
              fontSize: 9,
              fontWeight: 900,
              marginBottom: 15,
              letterSpacing: '0.5px',
              textTransform: 'uppercase',
              textAlign: 'center',
              width: 'fit-content',
              border: `2px solid ${purpleColor}`,
              background: 'transparent'
            }}>SCAN FOR ATTENDANCE</div>
            
            <div style={{ background: '#fff', padding: 8, borderRadius: 12, boxShadow: '0 5px 15px rgba(0,0,0,0.05)', border: `1px solid #f1f5f9` }}>
              {student.qr_code_url ? (
                <img src={student.qr_code_url} alt="QR" style={{ width: 80, height: 80, objectFit: 'contain' }} />
              ) : (
                <QRCodeDisplay size={80} value={student.registration_no || student.roll_number} accentColor={purpleColor} />
              )}
            </div>
          </div>
        )}

        {/* Signature Area */}
        <div style={{ textAlign: 'center', padding: '10px 0' }}>
          <div style={{ height: 20, width: 140, margin: '0 auto', borderBottom: `1.5px dashed ${purpleColor}`, opacity: 0.4, marginBottom: 4 }}></div>
          <div style={{ fontSize: 10, fontWeight: 900, color: purpleColor, letterSpacing: '1px' }}>PRINCIPAL SIGNATURE</div>
        </div>

        {/* Contact Info */}
        <div style={{ textAlign: 'center', paddingBottom: 5 }}>
          <div style={{ fontSize: 9, fontWeight: 800, color: purpleColor }}>{institute?.phone || "+92 123 4567890"}</div>
          <div style={{ fontSize: 8, fontWeight: 500, color: '#666' }}>{institute?.email || "info@adamjee.edu.pk"}</div>
        </div>
      </div>

      {/* Bottom Yellow Accent */}
      <div style={{ position: 'absolute', bottom: 30, right: 0, width: 100, height: 30, zIndex: 5 }}>
        <div style={{
          position: 'absolute',
          bottom: 12,
          right: 35,
          width: 40,
          height: 4,
          background: '#f9b400',
          transform: 'skewX(-30deg)'
        }}></div>
        <div style={{
          position: 'absolute',
          bottom: 12,
          right: 80,
          width: 25,
          height: 4,
          background: '#f9b400',
          transform: 'skewX(-30deg)'
        }}></div>
        <div style={{
          position: 'absolute',
          bottom: 0,
          right: 0,
          width: '100%',
          height: 10,
          background: '#f9b400',
          clipPath: 'polygon(15% 0, 100% 0, 100% 100%, 0 100%)'
        }}></div>
      </div>

      <div style={{ height: 25, background: purpleColor, width: '100%', marginTop: 'auto', border: 'none' }}></div>
    </div>
  );
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

  const handleDownload = async () => {
    try {
      setIsDownloading(true);
      await generateAndDownloadIdCard({
        role: 'student',
        person: studentData,
        institute,
        policyConfig: policy?.config
      });
    } finally {
      setIsDownloading(false);
    }
  };

  const renderCard = () => (
    <div className="w-full flex flex-col items-center justify-center gap-6">
      <CardFrontVertical institute={institute} design={design} student={student} />
      <div className="h-px w-[220px] bg-slate-200" />
      <CardBackVertical institute={institute} design={design} student={student} termsList={termsList} showQr={true} />
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
