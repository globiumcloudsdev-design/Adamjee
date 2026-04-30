/**
 * generateResultCard.js — Adamjee Coaching Centre
 * Formal, senior-level Result Card. jsPDF v3 compatible.
 */

const fd = (d) => {
  if (!d) return '—';
  try {
    return new Date(d).toLocaleDateString('en-GB', {
      day: '2-digit', month: 'short', year: 'numeric'
    }).replace(/ /g, '-');
  } catch { return String(d); }
};

function grade(pct) {
  if (pct >= 90) return 'A+';
  if (pct >= 80) return 'A';
  if (pct >= 70) return 'B+';
  if (pct >= 60) return 'B';
  if (pct >= 50) return 'C';
  if (pct >= 40) return 'D';
  return 'F';
}

export async function generateResultCards({ exam, students, marks, single = null }) {
  const { jsPDF } = await import('jspdf');

  const PW = 148, PH = 210, ML = 12, MR = 12, CW = PW - ML - MR;

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a5' });

  // ── Exam meta ───────────────────────────────────────────
  const subjects = Array.isArray(exam?.subjects) ? exam.subjects : [];
  const cls    = exam?.class?.name     || exam?.classId?.name    || '—';
  const sec    = exam?.section?.name   || exam?.sectionId?.name  || '—';
  const ay     = exam?.academicYear?.name || exam?.academic_year?.name || '—';
  const grp    = exam?.group?.name     || exam?.groupId?.name    || '—';
  const etype  = ((exam?.exam_type || exam?.examType || 'Examination')).toUpperCase();
  const branch = exam?.branch?.name    || exam?.branchId?.name   || 'Campus';
  const title  = exam?.title || 'Examination';

  // ── Marks lookup ────────────────────────────────────────
  const mmap = {};
  if (Array.isArray(marks)) {
    marks.forEach(m => {
      const sid = String(m.student_id);
      const sub = String(m.subject_id);
      if (!mmap[sid]) mmap[sid] = {};
      mmap[sid][sub] = m;
    });
  }

  const targets = single ? [single] : (Array.isArray(students) ? students : []);

  targets.forEach((student, idx) => {
    if (idx > 0) doc.addPage();

    const sid = String(student._id || student.id || '');
    const enrolledIds = (student.enrolled_subjects || []).map(String);
    const mySubs = enrolledIds.length > 0
      ? subjects.filter(s => enrolledIds.includes(String(s.subject_id || s.subject?.id)))
      : subjects;

    // ── Calculate totals ──────────────────────────────────
    let totalMax = 0, totalObt = 0, gradedMax = 0, allPass = true, hasMarks = false;

    const rows = mySubs.map(s => {
      const subId = String(s.subject_id || s.subject?.id || '');
      const entry = mmap[sid]?.[subId] || null;
      const max   = Number(s.total_marks)   || 0;
      const pass  = Number(s.passing_marks) || 0;
      const abs   = entry?.is_absent || false;
      const obt   = entry ? (abs ? 0 : Number(entry.marks_obtained) || 0) : null;

      totalMax += max; // always for display
      if (abs) {
        // Absent: mark as failed, hasMarks = true, but DON'T add to gradedMax/totalObt
        allPass  = false;
        hasMarks = true;
      } else if (obt !== null) {
        gradedMax += max;  // only present subjects count toward %
        totalObt  += obt;
        hasMarks   = true;
        if (obt < pass) allPass = false;
      }

      const pct   = (obt !== null && max > 0 && !abs) ? Math.round((obt / max) * 100) : null;
      const pass_ = obt !== null && !abs && obt >= pass;

      return {
        name:    (s.subject_name || s.subject?.name || 'Subject').toUpperCase(),
        max, pass, obt, abs, pct,
        grd:     abs ? 'AB' : obt !== null ? grade(pct) : '—',
        passing: pass_,
        remarks: entry?.remarks || '',
      };
    });

    // % uses only attended subjects (gradedMax), so absent doesn't double-penalize
    const ovPct   = gradedMax > 0 ? Math.round((totalObt / gradedMax) * 100) : 0;
    const ovGrade = hasMarks ? grade(ovPct) : '—';

    // ═════════════════════════════════════════════════════
    // RENDER
    // ═════════════════════════════════════════════════════
    let Y = 10;

    const setBlack  = () => { doc.setTextColor(0, 0, 0); doc.setDrawColor(0, 0, 0); };
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
    doc.text('RESULT CARD / ACADEMIC TRANSCRIPT', PW / 2, Y, { align: 'center' });

    Y += 6;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text(title.toUpperCase(), PW / 2, Y, { align: 'center' });

    Y += 5;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    setGray();
    doc.text(`SESSION: ${ay}  |  EXAMINATION: ${etype}`, PW / 2, Y, { align: 'center' });

    Y += 7;

    // ── 2. CANDIDATE BOX ────────────────────────────────
    const BOX_H = 26;
    setBlack();
    doc.setLineWidth(0.4);
    doc.setFillColor(255, 255, 255);
    doc.rect(ML, Y, CW, BOX_H, 'S');

    // Inner horizontal dividers
    hline(Y + 9,  0.2);
    hline(Y + 18, 0.2);

    // Mid vertical
    vline(ML + CW / 2, Y, BOX_H);

    // Row labels & values
    const LX = ML + 2, LX2 = ML + CW / 2 + 2;
    const VX = ML + 28, VX2 = ML + CW / 2 + 24;

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

    // ── 3. MARKS TABLE ───────────────────────────────────
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    setBlack();
    doc.text('ACADEMIC RECORD', ML, Y);
    Y += 3;

    // Column definitions (total = CW = 124)
    // Subject(36) | Max(16) | Pass(14) | Obtained(17) | %(16) | Grade(11) | Status(14)
    const cols = [
      { label: 'SUBJECT',      w: 36, al: 'left'   },
      { label: 'MAX MARKS',    w: 16, al: 'center' },
      { label: 'PASSING',      w: 14, al: 'center' },
      { label: 'OBTAINED',     w: 17, al: 'center' },
      { label: 'PERCENTAGE',   w: 16, al: 'center' },
      { label: 'GRADE',        w: 11, al: 'center' },
      { label: 'STATUS',       w: 14, al: 'center' },
    ];

    // Build x positions
    let cx = ML;
    const colsWithX = cols.map(c => { const col = { ...c, x: cx }; cx += c.w; return col; });
    const RH = 8;

    // Header row
    doc.setFillColor(226, 232, 240);
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.3);
    doc.rect(ML, Y, CW, RH, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.5);
    setBlack();

    colsWithX.forEach((c, ci) => {
      const tx = c.al === 'center' ? c.x + c.w / 2 : c.x + 2;
      doc.text(c.label, tx, Y + 5.2, { align: c.al });
      if (ci > 0) vline(c.x, Y, RH);
    });
    Y += RH;

    // Data rows
    if (rows.length === 0) {
      doc.setDrawColor(0, 0, 0);
      doc.setLineWidth(0.25);
      doc.rect(ML, Y, CW, RH, 'S');
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(7);
      setGray();
      doc.text('No subjects found.', PW / 2, Y + 5.2, { align: 'center' });
      Y += RH;
    }

    rows.forEach((row) => {
      doc.setDrawColor(0, 0, 0);
      doc.setLineWidth(0.25);
      doc.rect(ML, Y, CW, RH, 'S');

      const vals = [
        row.name.substring(0, 22),
        String(row.max),
        String(row.pass),
        row.obt !== null ? String(row.obt) : '—',
        row.pct  !== null ? `${row.pct}%`  : '—',
        row.grd,
        row.abs ? 'ABS' : row.obt !== null ? (row.passing ? 'PASS' : 'FAIL') : '—',
      ];

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      setBlack();

      colsWithX.forEach((c, ci) => {
        const tx = c.al === 'center' ? c.x + c.w / 2 : c.x + 2;
        if (ci > 0) vline(c.x, Y, RH);
        doc.text(vals[ci], tx, Y + 5.5, { align: c.al });
      });
      Y += RH;
    });

    // Grand Total row
    doc.setFillColor(226, 232, 240);
    doc.rect(ML, Y, CW, RH, 'FD');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    setBlack();
    doc.text('GRAND TOTAL', ML + 2, Y + 5.5);
    vline(colsWithX[1].x, Y, RH);
    vline(colsWithX[3].x, Y, RH);
    vline(colsWithX[4].x, Y, RH);
    vline(colsWithX[5].x, Y, RH);
    vline(colsWithX[6].x, Y, RH);
    doc.text(String(totalMax), colsWithX[1].x + colsWithX[1].w / 2, Y + 5.5, { align: 'center' });
    if (hasMarks) {
      doc.text(String(totalObt), colsWithX[3].x + colsWithX[3].w / 2, Y + 5.5, { align: 'center' });
      doc.text(`${ovPct}%`,      colsWithX[4].x + colsWithX[4].w / 2, Y + 5.5, { align: 'center' });
      doc.text(ovGrade,          colsWithX[5].x + colsWithX[5].w / 2, Y + 5.5, { align: 'center' });
      doc.text(allPass ? 'PASS' : 'FAIL', colsWithX[6].x + colsWithX[6].w / 2, Y + 5.5, { align: 'center' });
    }
    Y += RH + 7;

    // ── 4. SUMMARY PANEL ────────────────────────────────
    const SR_H = 18;
    doc.setLineWidth(0.35);
    doc.setFillColor(255, 255, 255);
    doc.rect(ML, Y, CW, SR_H, 'S');

    const thirds = CW / 3;
    vline(ML + thirds,     Y, SR_H);
    vline(ML + thirds * 2, Y, SR_H);
    hline(Y + 8, 0.2);

    const sLabels = ['TOTAL PERCENTAGE', 'OVERALL GRADE', 'FINAL RESULT'];
    const sVals   = hasMarks
      ? [`${ovPct}%`, ovGrade, allPass ? 'PASSED' : 'FAILED']
      : ['—', '—', 'PENDING'];

    sLabels.forEach((lbl, i) => {
      const bx = ML + thirds * i + thirds / 2;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6.5);
      setLtGray();
      doc.text(lbl, bx, Y + 5, { align: 'center' });

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      setBlack();
      doc.text(sVals[i], bx, Y + 14, { align: 'center' });
    });

    Y += SR_H + 7;

    // ── 5. REMARKS (if any) ──────────────────────────────
    const allRemarks = rows.filter(r => r.remarks).map(r => `${r.name}: ${r.remarks}`).join(' | ');
    if (allRemarks) {
      doc.setLineWidth(0.3);
      doc.rect(ML, Y, CW, 13, 'S');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7);
      setGray();
      doc.text('REMARKS:', ML + 2, Y + 5);
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(7);
      setBlack();
      doc.text(allRemarks.substring(0, 110), ML + 20, Y + 5);
      Y += 17;
    }

    // ── 6. SIGNATURE PANELS ──────────────────────────────
    const SY = PH - 26;
    doc.setLineWidth(0.3);
    setBlack();

    const sigConfig = [
      { label: 'Class Teacher',          lx: ML,            rx: ML + 35         },
      { label: 'Controller of Exams',    lx: PW / 2 - 17.5, rx: PW / 2 + 17.5  },
      { label: 'Principal / Director',   lx: PW - MR - 35,  rx: PW - MR        },
    ];

    sigConfig.forEach(sc => {
      doc.line(sc.lx, SY, sc.rx, SY);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6.5);
      setLtGray();
      doc.text(sc.label, (sc.lx + sc.rx) / 2, SY + 4.5, { align: 'center' });
    });

    // ── 7. FOOTER ────────────────────────────────────────
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(5.5);
    setLtGray();
    doc.text(
      `System Generated Transcript  |  Printed on: ${new Date().toLocaleDateString('en-GB')}`,
      ML, PH - 6
    );
  });

  const suffix = single
    ? `_${(single.name || 'student').replace(/\s+/g, '_')}`
    : '_All_Students';
  doc.save(`Result_Card_${title.replace(/\s+/g, '_')}${suffix}.pdf`);
}
