"use client";

import React, { useState, useEffect, use, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from "@/components/ui/table";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search, Save, User, ArrowLeft, ChevronRight, AlertCircle, CheckCircle2 } from "lucide-react";
import apiClient from "@/lib/api-client";
import { toast } from "sonner";
import FullPageLoader from "@/components/ui/full-page-loader";

export default function EnterMarksPage({ params }) {
  const router = useRouter();
  const { id } = use(params);
  
  const [exam, setExam] = useState(null);
  const [students, setStudents] = useState([]);
  const [existingMarks, setExistingMarks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [localMarks, setLocalMarks] = useState({});

  useEffect(() => {
    if (id) fetchExamAndData();
  }, [id]);

  const fetchExamAndData = async () => {
    try {
      setLoading(true);
      const examRes = await apiClient.get(`/api/exams/${id}`);
      if (examRes.success) {
        setExam(examRes.data);
      }

      const studentsRes = await apiClient.get(`/api/exams/${id}/students`);
      if (studentsRes.success) {
        setStudents(studentsRes.data);
      }

      const marksRes = await apiClient.get(`/api/exams/${id}/marks`);
      if (marksRes.success) {
        setExistingMarks(marksRes.data);
        const initialMarks = {};
        marksRes.data.forEach(m => {
          if (!initialMarks[m.subject_id]) initialMarks[m.subject_id] = {};
          initialMarks[m.subject_id][m.student_id] = {
            marks_obtained: m.marks_obtained,
            is_absent: m.is_absent,
            remarks: m.remarks || ""
          };
        });
        setLocalMarks(initialMarks);
      }
    } catch (error) {
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const handleMarkChange = (studentId, subjectId, field, value) => {
    setLocalMarks(prev => ({
      ...prev,
      [subjectId]: {
        ...(prev[subjectId] || {}),
        [studentId]: {
          ...(prev[subjectId]?.[studentId] || { marks_obtained: "", is_absent: false, remarks: "" }),
          [field]: value
        }
      }
    }));
  };

  const handleSave = async () => {
    setSubmitting(true);
    try {
      let marksArray = [];
      exam.subjects.forEach(s => {
        const subjectId = s.subject_id || s.subject?.id;
        const subjectMarks = localMarks[subjectId] || {};
        
        Object.keys(subjectMarks).forEach(studentId => {
          // Only add to payload if they entered marks or checked absent
          if (subjectMarks[studentId].marks_obtained !== "" || subjectMarks[studentId].is_absent) {
            marksArray.push({
              student_id: studentId,
              subject_id: subjectId,
              marks_obtained: subjectMarks[studentId].is_absent ? 0 : parseFloat(subjectMarks[studentId].marks_obtained) || 0,
              is_absent: subjectMarks[studentId].is_absent,
              remarks: subjectMarks[studentId].remarks
            });
          }
        });
      });

      if (marksArray.length === 0) {
        toast.info("No marks entered to save");
        setSubmitting(false);
        return;
      }

      const response = await apiClient.post(`/api/exams/${id}/marks`, { marks: marksArray });
      if (response.success) {
        toast.success("Marks saved successfully");
        const marksRes = await apiClient.get(`/api/exams/${id}/marks`);
        if (marksRes.success) setExistingMarks(marksRes.data);
      }
    } catch (error) {
      toast.error(error.message || "Failed to save marks");
    } finally {
      setSubmitting(false);
    }
  };

  const filteredStudents = useMemo(() => {
    return students.filter(s => {
      return s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
             s.registration_no?.toLowerCase().includes(searchTerm.toLowerCase());
    });
  }, [students, searchTerm]);

  if (loading) return <FullPageLoader message="Loading marks sheet..." />;
  if (!exam) return <div className="p-20 text-center text-slate-500 flex flex-col items-center gap-4"><AlertCircle className="w-10 h-10" /> Exam not found.</div>;

  return (
    <div className="p-4 sm:p-6 max-w-full mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
            <button onClick={() => router.back()} className="hover:text-primary transition-colors">Exams</button>
            <ChevronRight className="h-4 w-4" />
            <span className="text-foreground font-medium">Marks Entry</span>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" size="icon" onClick={() => router.back()} className="h-9 w-9 shrink-0">
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-foreground tracking-tight">{exam.title}</h1>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="secondary" className="text-xs font-semibold">{exam.class?.name || "Class"}</Badge>
                <Badge variant="outline" className="text-xs font-semibold uppercase">{exam.exam_type || "Exam"}</Badge>
                {exam.section?.name && <Badge variant="outline" className="text-xs font-semibold">Section: {exam.section.name}</Badge>}
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder="Search students..." 
              className="pl-9 h-10 bg-background"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Button onClick={handleSave} disabled={submitting} className="h-10 px-6 w-full sm:w-auto">
            <Save className="w-4 h-4 mr-2" />
            {submitting ? "Saving..." : "Save All Marks"}
          </Button>
        </div>
      </div>

      {/* Mark Sheet Table */}
      <Card className="border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <Table className="w-full border-collapse">
            <TableHeader className="bg-muted/60">
              <TableRow className="border-b-2">
                <TableHead className="w-10 text-center font-bold text-xs py-4">#</TableHead>
                <TableHead className="min-w-[200px] font-bold text-xs py-4">Student Name</TableHead>
                <TableHead className="w-28 font-bold text-xs py-4">Reg No</TableHead>
                <TableHead className="min-w-[160px] font-bold text-xs py-4">Subject</TableHead>
                <TableHead className="w-24 text-center font-bold text-xs py-4">Total</TableHead>
                <TableHead className="w-24 text-center font-bold text-xs py-4">Pass</TableHead>
                <TableHead className="w-28 text-center font-bold text-xs py-4">Marks</TableHead>
                <TableHead className="w-24 text-center font-bold text-xs py-4">Absent</TableHead>
                <TableHead className="w-24 text-center font-bold text-xs py-4">Status</TableHead>
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
                filteredStudents.map((student, studentIndex) => {
                  const sid = student._id || student.id;

                  // Filter only enrolled subjects for this student
                  const enrolledSubjects = exam.subjects.filter(s => {
                    const subjectId = s.subject_id || s.subject?.id;
                    return !student.enrolled_subjects || 
                           student.enrolled_subjects.length === 0 || 
                           student.enrolled_subjects.includes(subjectId);
                  });

                  const rowCount = enrolledSubjects.length || 1;
                  const isLastStudent = studentIndex === filteredStudents.length - 1;

                  return enrolledSubjects.map((s, subIndex) => {
                    const subjectId = s.subject_id || s.subject?.id;
                    const marksData = localMarks[subjectId]?.[sid] || { marks_obtained: "", is_absent: false };
                    const obtained = parseFloat(marksData.marks_obtained);
                    const isPassing = marksData.marks_obtained !== "" && obtained >= (s.passing_marks || 0);
                    const isFailing = marksData.marks_obtained !== "" && obtained < (s.passing_marks || 0);

                    const isFirstRow = subIndex === 0;
                    const isLastRow = subIndex === rowCount - 1;
                    const borderClass = isLastRow && !isLastStudent ? "border-b-2 border-muted" : "border-b border-border/40";

                    return (
                      <TableRow 
                        key={`${sid}-${subjectId}`}
                        className={`transition-colors ${isFirstRow ? 'bg-background hover:bg-muted/20' : 'bg-muted/5 hover:bg-muted/20'} ${borderClass}`}
                      >
                        {/* Serial number — only on first subject row */}
                        {isFirstRow && (
                          <TableCell 
                            rowSpan={rowCount} 
                            className="text-center text-muted-foreground text-sm font-semibold align-middle border-r"
                          >
                            {studentIndex + 1}
                          </TableCell>
                        )}

                        {/* Student identity — only on first subject row */}
                        {isFirstRow && (
                          <TableCell rowSpan={rowCount} className="align-middle border-r py-3 px-4">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center shrink-0">
                                <User className="w-4 h-4 text-indigo-500" />
                              </div>
                              <span className="font-semibold text-sm text-foreground leading-snug">{student.name}</span>
                            </div>
                          </TableCell>
                        )}

                        {/* Registration number — only on first subject row */}
                        {isFirstRow && (
                          <TableCell rowSpan={rowCount} className="align-middle border-r text-xs font-medium text-muted-foreground px-4">
                            {student.registration_no || "N/A"}
                          </TableCell>
                        )}

                        {/* Subject name */}
                        <TableCell className="py-2.5 px-4 text-sm font-medium text-foreground border-r">
                          {s.subject_name || s.subject?.name}
                        </TableCell>

                        {/* Total marks */}
                        <TableCell className="text-center text-sm font-semibold text-muted-foreground border-r">
                          {s.total_marks}
                        </TableCell>

                        {/* Passing marks */}
                        <TableCell className="text-center text-sm font-semibold text-muted-foreground border-r">
                          {s.passing_marks}
                        </TableCell>

                        {/* Marks input */}
                        <TableCell className="text-center py-2 border-r">
                          <Input 
                            type="number"
                            min={0}
                            max={s.total_marks}
                            value={marksData.marks_obtained}
                            onChange={(e) => handleMarkChange(sid, subjectId, "marks_obtained", e.target.value)}
                            disabled={marksData.is_absent}
                            placeholder="--"
                            className={`h-9 w-20 mx-auto text-center text-sm font-bold transition-all
                              ${marksData.is_absent 
                                ? "bg-muted text-muted-foreground opacity-50 cursor-not-allowed" 
                                : isPassing 
                                  ? "border-emerald-300 bg-emerald-50 text-emerald-700 focus-visible:ring-emerald-500" 
                                  : isFailing 
                                    ? "border-red-300 bg-red-50 text-red-700 focus-visible:ring-red-500" 
                                    : "focus-visible:ring-indigo-500"
                              }
                            `}
                          />
                        </TableCell>

                        {/* Absent toggle */}
                        <TableCell className="text-center border-r">
                          <label className="flex items-center justify-center gap-1.5 cursor-pointer">
                            <input 
                              type="checkbox"
                              checked={marksData.is_absent}
                              onChange={(e) => handleMarkChange(sid, subjectId, "is_absent", e.target.checked)}
                              className="w-4 h-4 rounded accent-red-500 cursor-pointer"
                            />
                          </label>
                        </TableCell>

                        {/* Status badge */}
                        <TableCell className="text-center">
                          {marksData.is_absent ? (
                            <Badge className="bg-red-50 text-red-600 border-red-200 text-[10px] font-bold uppercase">Absent</Badge>
                          ) : isPassing ? (
                            <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px] font-bold uppercase flex items-center gap-1 justify-center">
                              <CheckCircle2 className="w-2.5 h-2.5" /> Pass
                            </Badge>
                          ) : isFailing ? (
                            <Badge className="bg-red-50 text-red-600 border-red-200 text-[10px] font-bold uppercase">Fail</Badge>
                          ) : (
                            <Badge variant="outline" className="text-muted-foreground text-[10px] font-bold uppercase">—</Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  });
                })
              )}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
}
