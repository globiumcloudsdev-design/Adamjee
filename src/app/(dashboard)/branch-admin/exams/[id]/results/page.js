"use client";

import React, { useState, useEffect, use, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from "@/components/ui/table";
import {
  Search, ArrowLeft, ChevronRight, User, Download,
  FileText, CheckCircle2, XCircle, AlertCircle, Clock
} from "lucide-react";
import apiClient from "@/lib/api-client";
import { toast } from "sonner";
import FullPageLoader from "@/components/ui/full-page-loader";
import { generateResultCards } from "@/lib/generateResultCard";

export default function ExamResultsPage({ params }) {
  const router = useRouter();
  const { id } = use(params);

  const [exam,     setExam]     = useState(null);
  const [students, setStudents] = useState([]);
  const [marks,    setMarks]    = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [search,   setSearch]   = useState("");
  const [generating, setGenerating] = useState(null); // null | "all" | student_id

  useEffect(() => { if (id) load(); }, [id]);

  const load = async () => {
    try {
      setLoading(true);
      const [examRes, studentsRes, marksRes] = await Promise.all([
        apiClient.get(`/api/exams/${id}`),
        apiClient.get(`/api/exams/${id}/students`),
        apiClient.get(`/api/exams/${id}/marks`),
      ]);
      if (examRes.success)     setExam(examRes.data);
      if (studentsRes.success) setStudents(studentsRes.data);
      if (marksRes.success)    setMarks(marksRes.data);
    } catch {
      toast.error("Failed to load results data");
    } finally {
      setLoading(false);
    }
  };

  // Marks lookup: marksMap[student_id][subject_id] = mark_entry
  const marksMap = useMemo(() => {
    const m = {};
    marks.forEach(mk => {
      if (!m[mk.student_id]) m[mk.student_id] = {};
      m[mk.student_id][mk.subject_id] = mk;
    });
    return m;
  }, [marks]);

  const getStudentSummary = (student) => {
    const sid = String(student._id || student.id || '');
    const subjects = exam?.subjects || [];

    // Type-safe enrolled_subjects lookup
    const enrolledRaw = student.enrolled_subjects || [];
    const enrolledStr = enrolledRaw.map(String);
    const mySubjects = enrolledStr.length > 0
      ? subjects.filter(s => enrolledStr.includes(String(s.subject_id || s.subject?.id)))
      : subjects;

    // totalMax/totalObt only count subjects WHERE marks are entered (not absent)
    // so percentage is fair: absent subjects excluded from denominator
    let totalMax = 0, totalObt = 0, gradedMax = 0;
    let allPassed = true, hasAnyMark = false, absentCount = 0;

    mySubjects.forEach(s => {
      const subId = String(s.subject_id || s.subject?.id || '');
      const entry  = marksMap[sid]?.[subId];
      const max    = Number(s.total_marks)   || 0;
      const pass   = Number(s.passing_marks) || 0;
      totalMax += max; // grand total (for display)

      if (entry) {
        hasAnyMark = true;
        if (entry.is_absent) {
          absentCount++;
          allPassed = false;
          // Absent: don't add to gradedMax or totalObt → doesn't hurt %
        } else {
          const obt = Number(entry.marks_obtained) || 0;
          gradedMax += max;  // only non-absent subjects count toward %
          totalObt  += obt;
          if (obt < pass) allPassed = false;
        }
      } else {
        allPassed = false;
      }
    });

    const pct = gradedMax > 0 ? Math.round((totalObt / gradedMax) * 100) : 0;
    return { totalMax, totalObt, pct, allPassed, hasAnyMark, subjectCount: mySubjects.length, absentCount };
  };

  const getGrade = (pct) => {
    if (pct >= 90) return "A+";
    if (pct >= 80) return "A";
    if (pct >= 70) return "B+";
    if (pct >= 60) return "B";
    if (pct >= 50) return "C";
    if (pct >= 40) return "D";
    return "F";
  };

  const examPast = useMemo(() => {
    if (!exam?.subjects) return false;
    const dates = exam.subjects.map(s => s.date).filter(Boolean);
    if (!dates.length) return true;
    const last = new Date(Math.max(...dates.map(d => new Date(d))));
    return last < new Date();
  }, [exam]);

  const filteredStudents = useMemo(() =>
    students.filter(s =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.registration_no?.toLowerCase().includes(search.toLowerCase())
    ), [students, search]);

  const handleSingleReport = async (student) => {
    try {
      setGenerating(student.id || student._id);
      await generateResultCards({ exam, students, marks, single: student });
      toast.success(`Report card generated for ${student.name}`);
    } catch (e) {
      console.error("Report card error:", e);
      toast.error(`Failed to generate report card: ${e?.message || e}`);
    } finally {
      setGenerating(null);
    }
  };

  const handleAllReports = async () => {
    try {
      setGenerating("all");
      await generateResultCards({ exam, students, marks, single: null });
      toast.success(`Report cards generated for ${students.length} student(s)!`);
    } catch (e) {
      console.error("All reports error:", e);
      toast.error(`Failed to generate report cards: ${e?.message || e}`);
    } finally {
      setGenerating(null);
    }
  };

  if (loading) return <FullPageLoader message="Loading exam results..." />;
  if (!exam)   return (
    <div className="p-20 text-center flex flex-col items-center gap-3 text-muted-foreground">
      <AlertCircle className="w-10 h-10" /> Exam not found.
    </div>
  );

  const stats = {
    total:  students.length,
    graded: students.filter(s => getStudentSummary(s).hasAnyMark).length,
    passed: students.filter(s => { const r = getStudentSummary(s); return r.hasAnyMark && r.allPassed; }).length,
    failed: students.filter(s => { const r = getStudentSummary(s); return r.hasAnyMark && !r.allPassed; }).length,
  };

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-full mx-auto">

      {/* ── Header ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
            <button onClick={() => router.back()} className="hover:text-primary transition-colors">Exams</button>
            <ChevronRight className="h-4 w-4" />
            <span className="text-foreground font-medium">Results</span>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" size="icon" onClick={() => router.back()} className="h-9 w-9 shrink-0">
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-foreground">{exam.title}</h1>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="secondary" className="text-xs font-semibold">{exam.class?.name || "Class"}</Badge>
                <Badge variant="outline"   className="text-xs font-semibold">Section: {exam.section?.name || "—"}</Badge>
                <Badge variant="outline"   className="text-xs font-semibold uppercase">{exam.exam_type || "Exam"}</Badge>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-3 items-center">
          <div className="relative w-full sm:w-60">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search students…"
              className="pl-9 h-10"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>

          {(examPast || stats.graded > 0) && (
            <Button
              onClick={handleAllReports}
              disabled={generating === "all"}
              className="h-10 px-5 gap-2 w-full sm:w-auto"
            >
              <Download className="w-4 h-4" />
              {generating === "all" ? "Generating…" : `Download All (${students.length})`}
            </Button>
          )}
        </div>
      </div>

      {/* ── Summary Stats ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Total Students", value: stats.total,  color: "text-foreground",    bg: "bg-muted/50" },
          { label: "Marks Entered",  value: stats.graded, color: "text-blue-700",      bg: "bg-blue-50" },
          { label: "Passed",         value: stats.passed, color: "text-emerald-700",   bg: "bg-emerald-50" },
          { label: "Failed",         value: stats.failed, color: "text-red-700",       bg: "bg-red-50" },
        ].map(stat => (
          <Card key={stat.label} className={`p-4 border ${stat.bg}`}>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{stat.label}</p>
            <p className={`text-3xl font-black mt-1 ${stat.color}`}>{stat.value}</p>
          </Card>
        ))}
      </div>

      {/* ── Results Table ── */}
      <Card className="border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <Table className="w-full">
            <TableHeader className="bg-muted/60">
              <TableRow>
                <TableHead className="w-10 text-center font-bold text-xs py-4">#</TableHead>
                <TableHead className="min-w-[200px] font-bold text-xs py-4">Student</TableHead>
                <TableHead className="w-28 font-bold text-xs py-4">Reg No</TableHead>
                <TableHead className="w-24 text-center font-bold text-xs py-4">Subjects</TableHead>
                <TableHead className="w-28 text-center font-bold text-xs py-4">Score</TableHead>
                <TableHead className="w-16 text-center font-bold text-xs py-4">%</TableHead>
                <TableHead className="w-16 text-center font-bold text-xs py-4">Grade</TableHead>
                <TableHead className="w-24 text-center font-bold text-xs py-4">Result</TableHead>
                <TableHead className="w-32 text-center font-bold text-xs py-4">Report</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredStudents.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="h-32 text-center text-muted-foreground font-medium">
                    No students found.
                  </TableCell>
                </TableRow>
              ) : (
                filteredStudents.map((student, index) => {
                  const sid = student._id || student.id;
                  const { totalMax, totalObt, pct, allPassed, hasAnyMark, subjectCount, absentCount } = getStudentSummary(student);
                  const grade = hasAnyMark ? getGrade(pct) : "—";

                  return (
                    <TableRow key={sid} className="hover:bg-muted/20 transition-colors border-b">
                      <TableCell className="text-center text-muted-foreground text-sm font-semibold">{index + 1}</TableCell>

                      <TableCell className="py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center shrink-0">
                            <User className="w-4 h-4 text-indigo-500" />
                          </div>
                          <span className="font-semibold text-sm text-foreground">{student.name}</span>
                        </div>
                      </TableCell>

                      <TableCell className="text-xs font-medium text-muted-foreground">{student.registration_no || "N/A"}</TableCell>

                      <TableCell className="text-center text-sm font-semibold">
                        <span>{subjectCount}</span>
                        {absentCount > 0 && (
                          <span className="ml-1 text-[10px] text-amber-600 font-bold">({absentCount} abs)</span>
                        )}
                      </TableCell>

                      <TableCell className="text-center text-sm font-bold">
                        {hasAnyMark ? `${totalObt} / ${totalMax}` : <span className="text-muted-foreground text-xs">Pending</span>}
                      </TableCell>

                      <TableCell className="text-center">
                        {hasAnyMark ? (
                          <span className={`text-sm font-black ${pct >= 60 ? "text-emerald-700" : pct >= 40 ? "text-amber-700" : "text-red-700"}`}>
                            {pct}%
                          </span>
                        ) : <span className="text-muted-foreground text-xs">—</span>}
                      </TableCell>

                      <TableCell className="text-center">
                        {hasAnyMark ? (
                          <span className={`text-sm font-black ${pct >= 80 ? "text-emerald-700" : pct >= 50 ? "text-amber-700" : "text-red-700"}`}>
                            {grade}
                          </span>
                        ) : <span className="text-muted-foreground text-xs">—</span>}
                      </TableCell>

                      <TableCell className="text-center">
                        {!hasAnyMark ? (
                          <Badge variant="outline" className="text-[10px] gap-1">
                            <Clock className="w-3 h-3" /> Pending
                          </Badge>
                        ) : allPassed ? (
                          <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px] font-bold gap-1">
                            <CheckCircle2 className="w-3 h-3" /> Pass
                          </Badge>
                        ) : (
                          <Badge className="bg-red-50 text-red-700 border-red-200 text-[10px] font-bold gap-1">
                            <XCircle className="w-3 h-3" /> Fail
                          </Badge>
                        )}
                      </TableCell>

                      <TableCell className="text-center">
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 px-3 text-xs gap-1.5 font-semibold"
                          disabled={generating === sid}
                          onClick={() => handleSingleReport(student)}
                        >
                          <FileText className="w-3.5 h-3.5" />
                          {generating === sid ? "…" : "Report"}
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
}
