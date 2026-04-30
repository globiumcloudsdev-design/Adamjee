"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import FullPageLoader from "@/components/ui/full-page-loader";
import { toast } from "sonner";
import apiClient from "@/lib/api-client";
import {
  Search, Building2, BookOpen, Users, BarChart2,
  ChevronDown, ChevronRight, TrendingUp, TrendingDown,
  Award, AlertCircle, CheckCircle2, XCircle, Clock,
  RefreshCw, Eye
} from "lucide-react";
import ExamDetailsModal from "@/components/modals/ExamDetailsModal";

// ─── helpers ──────────────────────────────────────────────────────────────────
const fd = (d) => {
  if (!d) return "—";
  try {
    return new Date(d).toLocaleDateString("en-PK", {
      day: "2-digit", month: "short", year: "numeric"
    });
  } catch { return "—"; }
};

const statusColor = (s) => {
  switch (s?.toLowerCase()) {
    case "completed": return "bg-emerald-100 text-emerald-700 border-emerald-200";
    case "ongoing":
    case "active":    return "bg-blue-100   text-blue-700   border-blue-200";
    case "scheduled": return "bg-amber-100  text-amber-700  border-amber-200";
    default:          return "bg-slate-100  text-slate-600  border-slate-200";
  }
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

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function SuperAdminExamsPage() {
  const router = useRouter();
  const [exams, setExams]         = useState([]);
  const [marks, setMarks]         = useState({}); // examId → marks[]
  const [students, setStudents]   = useState({}); // examId → students[]
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState("");
  const [branchFilter, setBranchFilter] = useState("all");
  const [expandedBranch, setExpandedBranch] = useState(null);
  const [viewExam, setViewExam]   = useState(null);
  const [loadingDetails, setLoadingDetails] = useState({}); // examId → bool

  useEffect(() => { fetchExams(); }, []);

  // ── Fetch all exams ─────────────────────────────────────────────────────────
  const fetchExams = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get("/api/exams");
      if (res.success) setExams(res.data || []);
    } catch {
      toast.error("Failed to fetch exams");
    } finally {
      setLoading(false);
    }
  };

  // ── Lazy-load marks + students for a single exam when expanded ──────────────
  const loadExamDetails = async (exam) => {
    const eid = exam.id;
    if (marks[eid] !== undefined) return; // already loaded

    setLoadingDetails(p => ({ ...p, [eid]: true }));
    try {
      const [mRes, sRes] = await Promise.all([
        apiClient.get(`/api/exams/${eid}/marks`),
        apiClient.get(`/api/exams/${eid}/students`),
      ]);
      setMarks(p    => ({ ...p, [eid]: mRes.success    ? (mRes.data    || []) : [] }));
      setStudents(p => ({ ...p, [eid]: sRes.success ? (sRes.data || []) : [] }));
    } catch {
      setMarks(p    => ({ ...p, [eid]: [] }));
      setStudents(p => ({ ...p, [eid]: [] }));
    } finally {
      setLoadingDetails(p => ({ ...p, [eid]: false }));
    }
  };

  // ── Compute per-exam performance summary ────────────────────────────────────
  const getExamPerf = (exam) => {
    const eid       = exam.id;
    const mList     = marks[eid];
    const sList     = students[eid];
    if (!mList || !sList) return null;

    const subjects  = exam.subjects || [];
    const mmap      = {};
    mList.forEach(m => {
      if (!mmap[m.student_id]) mmap[m.student_id] = {};
      mmap[m.student_id][m.subject_id] = m;
    });

    let passed = 0, failed = 0, absent = 0, totalPct = 0, graded = 0;

    sList.forEach(student => {
      const sid        = student.id;
      const enrolled   = (student.enrolled_subjects || []).map(String);
      const mySubs     = enrolled.length > 0
        ? subjects.filter(s => enrolled.includes(String(s.subject_id)))
        : subjects;

      let sTotalMax = 0, sTotalObt = 0, sAllPass = true, sHasMark = false, sAbsent = false;

      mySubs.forEach(s => {
        const subId  = String(s.subject_id || "");
        const entry  = mmap[String(sid)]?.[subId];
        const max    = Number(s.total_marks)   || 0;
        const pass   = Number(s.passing_marks) || 0;
        sTotalMax += max;
        if (entry) {
          sHasMark = true;
          if (entry.is_absent) { sAbsent = true; sAllPass = false; }
          else {
            const obt = Number(entry.marks_obtained) || 0;
            sTotalObt += obt;
            if (obt < pass) sAllPass = false;
          }
        } else { sAllPass = false; }
      });

      if (sAbsent)         absent++;
      else if (!sHasMark)  { /* pending */ }
      else if (sAllPass)   { passed++; graded++; totalPct += sTotalMax > 0 ? Math.round((sTotalObt / sTotalMax) * 100) : 0; }
      else                 { failed++; graded++; totalPct += sTotalMax > 0 ? Math.round((sTotalObt / sTotalMax) * 100) : 0; }
    });

    const avgPct = graded > 0 ? Math.round(totalPct / graded) : 0;
    return {
      total:   sList.length,
      passed, failed, absent,
      graded:  graded + absent,
      avgPct,
      grade:   graded > 0 ? getGrade(avgPct) : "—",
      pending: sList.length - graded - absent,
    };
  };

  // ── Group exams by branch ────────────────────────────────────────────────────
  const byBranch = useMemo(() => {
    const filtered = exams.filter(e =>
      (branchFilter === "all" || (e.branch?.id || e.branch_id) === branchFilter) &&
      (search === "" || e.title.toLowerCase().includes(search.toLowerCase()))
    );

    const map = {};
    filtered.forEach(e => {
      const bid   = e.branch?.id   || e.branch_id   || "unknown";
      const bname = e.branch?.name || "Unknown Branch";
      if (!map[bid]) map[bid] = { id: bid, name: bname, exams: [] };
      map[bid].exams.push(e);
    });
    return Object.values(map).sort((a, b) => a.name.localeCompare(b.name));
  }, [exams, branchFilter, search]);

  // ── All unique branches for filter dropdown ──────────────────────────────────
  const branches = useMemo(() => {
    const seen = new Map();
    exams.forEach(e => {
      const bid   = e.branch?.id   || e.branch_id;
      const bname = e.branch?.name;
      if (bid && bname && !seen.has(bid)) seen.set(bid, bname);
    });
    return [...seen.entries()].map(([id, name]) => ({ id, name }));
  }, [exams]);

  // ── Top-level stats ──────────────────────────────────────────────────────────
  const topStats = useMemo(() => ({
    branches:  branches.length,
    total:     exams.length,
    completed: exams.filter(e => e.status === "completed").length,
    scheduled: exams.filter(e => e.status === "scheduled").length,
    ongoing:   exams.filter(e => e.status === "ongoing" || e.status === "active").length,
  }), [exams, branches]);

  if (loading) return <FullPageLoader message="Loading exam overview..." />;

  return (
    <div className="p-4 sm:p-6 space-y-6">

      {/* ── Page Header ─────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Exam Overview</h1>
          <p className="text-sm text-slate-500 mt-0.5">Branch-wise examination monitoring dashboard</p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchExams} className="self-start sm:self-auto">
          <RefreshCw className="w-4 h-4 mr-2" /> Refresh
        </Button>
      </div>

      {/* ── Summary KPI Cards ────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {[
          { label: "Branches",  value: topStats.branches,  icon: Building2,    bg: "bg-indigo-50",   ic: "text-indigo-600" },
          { label: "Total Exams", value: topStats.total,    icon: BookOpen,     bg: "bg-slate-50",    ic: "text-slate-600"  },
          { label: "Scheduled", value: topStats.scheduled, icon: Clock,        bg: "bg-amber-50",    ic: "text-amber-600"  },
          { label: "Ongoing",   value: topStats.ongoing,   icon: TrendingUp,   bg: "bg-blue-50",     ic: "text-blue-600"   },
          { label: "Completed", value: topStats.completed, icon: CheckCircle2, bg: "bg-emerald-50",  ic: "text-emerald-600"},
        ].map(stat => (
          <Card key={stat.label} className={`${stat.bg} border-0 shadow-none`}>
            <CardContent className="p-4 flex items-center gap-3">
              <stat.icon className={`w-5 h-5 ${stat.ic} shrink-0`} />
              <div>
                <p className="text-2xl font-black text-slate-900">{stat.value}</p>
                <p className="text-xs text-slate-500 font-medium leading-tight">{stat.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ── Filters ─────────────────────────────────────────────── */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          <input
            placeholder="Search exams…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full h-10 pl-9 pr-3 text-sm text-slate-800 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400"
          />
        </div>
        <select
          value={branchFilter}
          onChange={e => setBranchFilter(e.target.value)}
          className="h-10 px-3 text-sm text-slate-800 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400"
        >
          <option value="all">All Branches</option>
          {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
        </select>
      </div>

      {/* ── Branch-wise Accordion ────────────────────────────────── */}
      {byBranch.length === 0 ? (
        <div className="py-20 text-center text-slate-400 flex flex-col items-center gap-2">
          <BookOpen className="w-10 h-10 opacity-20" />
          <p>No exams found</p>
        </div>
      ) : (
        <div className="space-y-4">
          {byBranch.map(branch => {
            const isOpen = expandedBranch === branch.id;
            const branchExamCount = branch.exams.length;
            const branchCompleted = branch.exams.filter(e => e.status === "completed").length;

            return (
              <Card key={branch.id} className="overflow-hidden border shadow-sm">
                {/* Branch Header — click to expand */}
                <button
                  onClick={() => {
                    const next = isOpen ? null : branch.id;
                    setExpandedBranch(next);
                    if (next) branch.exams.forEach(e => loadExamDetails(e));
                  }}
                  className="w-full text-left"
                >
                  <div className="flex items-center justify-between p-4 hover:bg-slate-50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-lg bg-indigo-100 flex items-center justify-center shrink-0">
                        <Building2 className="w-5 h-5 text-indigo-600" />
                      </div>
                      <div>
                        <p className="font-bold text-slate-900">{branch.name}</p>
                        <p className="text-xs text-slate-500">
                          {branchExamCount} exam{branchExamCount !== 1 ? "s" : ""}
                          {branchCompleted > 0 && <span className="ml-2 text-emerald-600 font-semibold">· {branchCompleted} completed</span>}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {/* Mini status pills */}
                      <div className="hidden sm:flex gap-1.5">
                        {["scheduled","ongoing","completed"].map(st => {
                          const cnt = branch.exams.filter(e => e.status === st || (st === "ongoing" && e.status === "active")).length;
                          if (!cnt) return null;
                          return (
                            <span key={st} className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${statusColor(st)}`}>
                              {st}: {cnt}
                            </span>
                          );
                        })}
                      </div>
                      {isOpen
                        ? <ChevronDown className="w-4 h-4 text-slate-400" />
                        : <ChevronRight className="w-4 h-4 text-slate-400" />
                      }
                    </div>
                  </div>
                </button>

                {/* Exams Table (expanded) */}
                {isOpen && (
                  <div className="border-t">
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="bg-slate-50 border-b">
                            <th className="text-left px-4 py-3 font-bold text-slate-600 text-xs uppercase tracking-wide">Exam</th>
                            <th className="text-left px-4 py-3 font-bold text-slate-600 text-xs uppercase tracking-wide">Class / Section</th>
                            <th className="text-center px-4 py-3 font-bold text-slate-600 text-xs uppercase tracking-wide">Subjects</th>
                            <th className="text-center px-4 py-3 font-bold text-slate-600 text-xs uppercase tracking-wide">Students</th>
                            <th className="text-center px-4 py-3 font-bold text-slate-600 text-xs uppercase tracking-wide">Performance</th>
                            <th className="text-center px-4 py-3 font-bold text-slate-600 text-xs uppercase tracking-wide">Status</th>
                            <th className="text-right px-4 py-3 font-bold text-slate-600 text-xs uppercase tracking-wide">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {branch.exams.map(exam => {
                            const eid  = exam.id;
                            const perf = getExamPerf(exam);
                            const isLoadingThis = loadingDetails[eid];
                            const subjectCount = (exam.subjects || []).length;
                            const studentList = students[eid];

                            return (
                              <tr key={eid} className="hover:bg-slate-50/60 transition-colors">
                                {/* Exam name */}
                                <td className="px-4 py-3">
                                  <p className="font-semibold text-slate-900 leading-tight">{exam.title}</p>
                                  <p className="text-[10px] text-slate-400 uppercase tracking-widest mt-0.5 font-bold">
                                    {exam.exam_type || "Exam"}
                                  </p>
                                </td>

                                {/* Class / Section */}
                                <td className="px-4 py-3">
                                  <span className="font-semibold text-slate-700">
                                    {exam.class?.name || "—"}
                                  </span>
                                  {exam.section?.name && (
                                    <span className="text-slate-400 text-xs ml-1">· {exam.section.name}</span>
                                  )}
                                </td>

                                {/* Subject count */}
                                <td className="px-4 py-3 text-center">
                                  <span className="inline-flex items-center gap-1 text-slate-700 font-semibold">
                                    <BookOpen className="w-3.5 h-3.5 text-slate-400" /> {subjectCount}
                                  </span>
                                </td>

                                {/* Student count */}
                                <td className="px-4 py-3 text-center">
                                  {isLoadingThis ? (
                                    <span className="text-slate-400 text-xs animate-pulse">Loading…</span>
                                  ) : studentList !== undefined ? (
                                    <span className="inline-flex items-center gap-1 text-slate-700 font-semibold">
                                      <Users className="w-3.5 h-3.5 text-slate-400" /> {studentList.length}
                                    </span>
                                  ) : (
                                    <span className="text-slate-300 text-xs">—</span>
                                  )}
                                </td>

                                {/* Performance */}
                                <td className="px-4 py-3">
                                  {isLoadingThis ? (
                                    <div className="h-4 w-20 bg-slate-100 rounded animate-pulse mx-auto" />
                                  ) : perf ? (
                                    <div className="flex flex-col items-center gap-1">
                                      {/* Pass / Fail / Absent counts */}
                                      <div className="flex gap-1.5 justify-center">
                                        {perf.passed > 0 && (
                                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700">
                                            ✓ {perf.passed}
                                          </span>
                                        )}
                                        {perf.failed > 0 && (
                                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-red-100 text-red-700">
                                            ✗ {perf.failed}
                                          </span>
                                        )}
                                        {perf.absent > 0 && (
                                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-700">
                                            A {perf.absent}
                                          </span>
                                        )}
                                        {perf.pending > 0 && (
                                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-500">
                                            ? {perf.pending}
                                          </span>
                                        )}
                                      </div>
                                      {/* Avg % */}
                                      {perf.graded > 0 && (
                                        <span className={`text-xs font-black ${perf.avgPct >= 60 ? "text-emerald-600" : perf.avgPct >= 40 ? "text-amber-600" : "text-red-600"}`}>
                                          Avg {perf.avgPct}% · {perf.grade}
                                        </span>
                                      )}
                                    </div>
                                  ) : (
                                    <span className="text-slate-300 text-xs block text-center">—</span>
                                  )}
                                </td>

                                {/* Status */}
                                <td className="px-4 py-3 text-center">
                                  <Badge className={`text-[10px] font-bold uppercase border ${statusColor(exam.status)}`}>
                                    {exam.status || "Scheduled"}
                                  </Badge>
                                </td>

                                {/* Actions */}
                                <td className="px-4 py-3 text-right">
                                  <button
                                    onClick={() => setViewExam(exam)}
                                    className="inline-flex items-center gap-1 h-8 px-3 text-xs font-semibold rounded-md border border-indigo-200 text-indigo-600 hover:bg-indigo-50 transition-colors"
                                  >
                                    <Eye className="w-3.5 h-3.5" /> Details
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {/* ── Exam Details Modal ──────────────────────────────────── */}
      {viewExam && (
        <ExamDetailsModal
          exam={viewExam}
          onClose={() => setViewExam(null)}
        />
      )}
    </div>
  );
}
