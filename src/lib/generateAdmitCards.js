/**
 * generateAdmitCards.js — Adamjee Coaching Centre
 * Formal Admit Card. jsPDF v3 compatible — no unsupported methods.
 */

const fd = (d) => {
  if (!d) return '—';
  try {
    return new Date(d).toLocaleDateString('en-GB', {
      day: '2-digit', month: 'short', year: 'numeric'
    }).replace(/ /g, '-');
  } catch { return String(d); }
};

const ft = (t) => {
  if (!t) return '';
  if (/^\d{1,2}:\d{2}$/.test(t)) {
    const [h, m] = t.split(':').map(Number);
    return `${String(h % 12 || 12).padStart(2, '0')}:${String(m).padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`;
  }
  return t;
};

export async function generateAdmitCards({ exam, students }) {
  const { jsPDF } = await import('jspdf');

  const PW = 148, PH = 210, ML = 12, MR = 12, CW = PW - ML - MR;

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a5' });

  // ── Exam meta ───────────────────────────────────────────
  const subjects = Array.isArray(exam?.subjects) ? exam.subjects : [];
  const cls    = exam?.class?.name    || exam?.classId?.name    || '—';
  const sec    = exam?.section?.name  || exam?.sectionId?.name  || '—';
  const ay     = exam?.academicYear?.name || exam?.academic_year?.name || '—';
  const grp    = exam?.group?.name    || exam?.groupId?.name    || '—';
  const etype  = ((exam?.exam_type || exam?.examType || 'Examination')).toUpperCase();
  const branch = exam?.branch?.name   || exam?.branchId?.name   || 'Campus';
  const title  = exam?.title || 'Examination';

  const allDates  = subjects.map(s => s.date).filter(Boolean).sort();
  const dateRange = allDates.length === 0 ? 'TBA'
    : allDates.length === 1 ? fd(allDates[0])
    : `${fd(allDates[0])} to ${fd(allDates[allDates.length - 1])}`;

  const targetStudents = Array.isArray(students) ? students : [];

  targetStudents.forEach((student, idx) => {
    if (idx > 0) doc.addPage();

    let Y = 10;

    const setBlack  = () => { doc.setTextColor(0, 0, 0);     doc.setDrawColor(0, 0, 0); };
    const setGray   = () => { doc.setTextColor(80, 80, 80); };
    const setLtGray = () => { doc.setTextColor(130, 130, 130); };
    const hline     = (y, lw = 0.3) => {
      doc.setDrawColor(0, 0, 0);
      doc.setLineWidth(lw);
      doc.line(ML, y, PW - MR, y);
    };
    const vline     = (x, y, h) => {
      doc.setDrawColor(0, 0, 0);
      doc.setLineWidth(0.25);
      doc.line(x, y, x, y + h);
    };

    // ── 1. INSTITUTE HEADER ──────────────────────────────
    doc.setFont('times', 'bold');
    doc.setFontSize(17);
    setBlack();
    doc.text('ADAMJEE COACHING CENTRE', PW / 2, Y, { align: 'center' });

    Y += 5;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    setGray();
    doc.text(`${branch} Campus`, PW / 2, Y, { align: 'center' });

    Y += 6;
    hline(Y, 0.6);
    Y += 1;
    hline(Y, 0.3);

    Y += 7;
    doc.setFont('times', 'bold');
    doc.setFontSize(12);
    setBlack();
    doc.text('ADMIT CARD', PW / 2, Y, { align: 'center' });

    Y += 6;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text(title.toUpperCase(), PW / 2, Y, { align: 'center' });

    Y += 5;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    setGray();
    doc.text(`SESSION: ${ay}  |  EXAMINATION: ${etype}  |  ${dateRange}`, PW / 2, Y, { align: 'center' });

    Y += 7;

    // ── 2. CANDIDATE BOX ────────────────────────────────
    const BOX_H = 26;
    setBlack();
    doc.setLineWidth(0.4);
    doc.setFillColor(255, 255, 255);
    doc.rect(ML, Y, CW, BOX_H, 'S');

    hline(Y + 9, 0.2);
    hline(Y + 18, 0.2);
    vline(ML + CW / 2, Y, BOX_H);

    const LX = ML + 2, LX2 = ML + CW / 2 + 2;
    const VX = ML + 28, VX2 = ML + CW / 2 + 22;

    const drawRow = (label1, val1, label2, val2, rowY) => {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7);
      setLtGray();
      doc.text(label1, LX, rowY + 3.5);
      if (label2) doc.text(label2, LX2, rowY + 3.5);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      setBlack();
      doc.text(val1 ? String(val1).substring(0, 22) : '—', VX, rowY + 3.5);
      if (val2 !== undefined) doc.text(val2 ? String(val2).substring(0, 14) : '—', VX2, rowY + 3.5);
    };

    drawRow(
      'CANDIDATE NAME:',  (student.name || '—').toUpperCase(),
      'REGISTRATION NO:', (student.registration_no || '—').toUpperCase(),
      Y
    );
    drawRow(
      'CLASS / GRADE:',   `${cls}${sec && sec !== '—' ? ' (' + sec + ')' : ''}`.toUpperCase(),
      'ROLL NO:',         String(student.roll_no || '—'),
      Y + 9
    );
    drawRow(
      'GROUP:',           grp.toUpperCase(),
      null,               undefined,
      Y + 18
    );

    Y += BOX_H + 8;

    // ── 3. SCHEDULE TABLE ────────────────────────────────
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    setBlack();
    doc.text('EXAMINATION SCHEDULE', ML, Y);
    Y += 3;

    // Columns: S.No(8) Subject(36) Date(22) Time(28) Room(14) Max(16)
    const cols = [
      { label: 'S.NO',      w: 8,  al: 'center' },
      { label: 'SUBJECT',   w: 36, al: 'left'   },
      { label: 'DATE',      w: 22, al: 'center' },
      { label: 'TIME',      w: 28, al: 'center' },
      { label: 'ROOM',      w: 14, al: 'center' },
      { label: 'MAX M.',    w: 16, al: 'center' },
    ];

    let cx2 = ML;
    const colsX = cols.map(c => { const col = { ...c, x: cx2 }; cx2 += c.w; return col; });
    const RH = 8;

    // Header
    doc.setFillColor(226, 232, 240);
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.3);
    doc.rect(ML, Y, CW, RH, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.5);
    setBlack();

    colsX.forEach((c, ci) => {
      const tx = c.al === 'center' ? c.x + c.w / 2 : c.x + 2;
      doc.text(c.label, tx, Y + 5.2, { align: c.al });
      if (ci > 0) vline(c.x, Y, RH);
    });
    Y += RH;

    // Rows
    const enrolledIds = (student.enrolled_subjects || []).map(String);
    const mySubs = enrolledIds.length > 0
      ? subjects.filter(s => enrolledIds.includes(String(s.subject_id || s.subject?.id)))
      : subjects;

    if (mySubs.length === 0) {
      doc.setDrawColor(0, 0, 0);
      doc.rect(ML, Y, CW, RH, 'S');
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(7);
      setGray();
      doc.text('No subjects enrolled.', PW / 2, Y + 5.5, { align: 'center' });
      Y += RH;
    }

    mySubs.forEach((sub, i) => {
      doc.setDrawColor(0, 0, 0);
      doc.setLineWidth(0.25);
      doc.rect(ML, Y, CW, RH, 'S');

      const sTime = ft(sub.start_time || sub.time);
      const eTime = ft(sub.end_time);
      const timeStr = sTime && eTime ? `${sTime}–${eTime}` : (sTime || '—');

      const vals = [
        String(i + 1),
        (sub.subject_name || sub.subject?.name || `Subject ${i + 1}`).toUpperCase().substring(0, 20),
        fd(sub.date),
        timeStr.substring(0, 18),
        String(sub.room || '—').substring(0, 8),
        String(sub.total_marks || '—'),
      ];

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      setBlack();

      colsX.forEach((c, ci) => {
        const tx = c.al === 'center' ? c.x + c.w / 2 : c.x + 2;
        if (ci > 0) vline(c.x, Y, RH);
        doc.text(vals[ci], tx, Y + 5.5, { align: c.al });
      });
      Y += RH;
    });

    Y += 8;

    // ── 4. INSTRUCTIONS ──────────────────────────────────
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    setBlack();
    doc.text('INSTRUCTIONS TO CANDIDATES:', ML, Y);
    Y += 5;

    const instructions = [
      'Candidates must produce this Admit Card for verification at the examination hall.',
      'Report to the examination centre at least 15 minutes before the commencement of the exam.',
      'Mobile phones, smart watches, and electronic devices are strictly prohibited in the hall.',
      'Any use of unfair means will lead to immediate disqualification from the examination.',
      'Ensure your Registration No. and Roll No. are correctly written on the answer script.',
    ];

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    setBlack();
    instructions.forEach((ln, i) => {
      doc.text(`${i + 1}.  ${ln}`, ML, Y);
      Y += 5;
    });

    // ── 5. SIGNATURES ────────────────────────────────────
    const SY = PH - 26;
    setBlack();
    doc.setLineWidth(0.3);

    const sigConfig = [
      { label: "Student's Signature",    lx: ML,            rx: ML + 35         },
      { label: 'Invigilator',            lx: PW / 2 - 17.5, rx: PW / 2 + 17.5  },
      { label: 'Controller of Exams',    lx: PW - MR - 35,  rx: PW - MR        },
    ];

    sigConfig.forEach(sc => {
      doc.line(sc.lx, SY, sc.rx, SY);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6.5);
      setLtGray();
      doc.text(sc.label, (sc.lx + sc.rx) / 2, SY + 4.5, { align: 'center' });
    });

    // ── 6. FOOTER ────────────────────────────────────────
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(5.5);
    setLtGray();
    doc.text(
      `System Generated Document  |  Printed on: ${new Date().toLocaleDateString('en-GB')}  |  Valid for ${title} only`,
      ML, PH - 6
    );
  });

  doc.save(`Admit_Cards_${title.replace(/\s+/g, '_')}_${new Date().getFullYear()}.pdf`);
}
