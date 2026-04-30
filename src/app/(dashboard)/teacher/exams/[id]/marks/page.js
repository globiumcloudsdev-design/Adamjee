"use client";

import React, { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Search, 
  Save, 
  User, 
  ArrowLeft, 
  ChevronRight,
  BookOpen,
  GraduationCap
} from "lucide-react";
import apiClient from "@/lib/api-client";
import { toast } from "sonner";
import FullPageLoader from "@/components/ui/full-page-loader";

export default function TeacherEnterMarksPage({ params }) {
  const router = useRouter();
  const { id } = use(params);
  
  const [exam, setExam] = useState(null);
  const [students, setStudents] = useState([]);
  const [existingMarks, setExistingMarks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSubjectId, setSelectedSubjectId] = useState("");
  const [localMarks, setLocalMarks] = useState({});

  useEffect(() => {
    if (id) {
      fetchExamAndData();
    }
  }, [id]);

  const fetchExamAndData = async () => {
    try {
      setLoading(true);
      // Fetch exam details
      const examRes = await apiClient.get(`/api/exams/${id}`);
      if (examRes.success) {
        setExam(examRes.data);
        if (examRes.data.subjects?.length > 0) {
          setSelectedSubjectId(examRes.data.subjects[0].subject_id || examRes.data.subjects[0].subject?.id);
        }
      }

      // Fetch students
      const studentsRes = await apiClient.get(`/api/exams/${id}/students`);
      if (studentsRes.success) {
        setStudents(studentsRes.data);
      }

      // Fetch marks
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

  const handleMarkChange = (studentId, field, value) => {
    setLocalMarks(prev => ({
      ...prev,
      [selectedSubjectId]: {
        ...(prev[selectedSubjectId] || {}),
        [studentId]: {
          ...(prev[selectedSubjectId]?.[studentId] || { marks_obtained: "", is_absent: false, remarks: "" }),
          [field]: value
        }
      }
    }));
  };

  const handleSave = async () => {
    if (!selectedSubjectId) return;
    
    setSubmitting(true);
    try {
      const subjectMarks = localMarks[selectedSubjectId] || {};
      const marksArray = Object.keys(subjectMarks).map(studentId => ({
        student_id: studentId,
        subject_id: selectedSubjectId,
        marks_obtained: subjectMarks[studentId].is_absent ? 0 : parseFloat(subjectMarks[studentId].marks_obtained) || 0,
        is_absent: subjectMarks[studentId].is_absent,
        remarks: subjectMarks[studentId].remarks
      }));

      if (marksArray.length === 0) {
        toast.info("No marks entered to save");
        return;
      }

      const response = await apiClient.post(`/api/exams/${id}/marks`, { marks: marksArray });
      if (response.success) {
        toast.success("Marks saved successfully");
        // Refresh data to update "isSaved" status
        const marksRes = await apiClient.get(`/api/exams/${id}/marks`);
        if (marksRes.success) setExistingMarks(marksRes.data);
      }
    } catch (error) {
      toast.error(error.message || "Failed to save marks");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <FullPageLoader message="Loading examination data..." />;
  if (!exam) return <div className="p-10 text-center">Exam not found</div>;

  const currentSubject = exam.subjects.find(s => (s.subject_id || s.subject?.id) === selectedSubjectId);
  const filteredStudents = students.filter(s => {
    const matchesSearch = s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         s.registration_no?.toLowerCase().includes(searchTerm.toLowerCase());
    const isEnrolled = !s.enrolled_subjects || s.enrolled_subjects.length === 0 || s.enrolled_subjects.includes(selectedSubjectId);
    return matchesSearch && isEnrolled;
  });

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Breadcrumbs & Header */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-2 text-sm text-slate-500 font-medium">
          <button onClick={() => router.back()} className="hover:text-indigo-600 transition-colors">Exams</button>
          <ChevronRight className="h-4 w-4" />
          <span className="text-slate-900">Marks Entry</span>
        </div>
        
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" onClick={() => router.back()} className="h-10 w-10 rounded-full">
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-black text-slate-900">{exam.title}</h1>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-100 font-bold uppercase tracking-widest text-[10px]">
                  {exam.classId?.name || "Class"}
                </Badge>
                <span className="text-slate-400">•</span>
                <span className="text-sm font-bold text-slate-500 uppercase tracking-tighter">
                  {exam.examType || "Examination"}
                </span>
              </div>
            </div>
          </div>
          
          <Button 
            onClick={handleSave} 
            disabled={submitting || !selectedSubjectId}
            className="bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-200 px-8 h-11 font-bold"
          >
            {submitting ? "Saving..." : "Save Marks"}
            <Save className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar: Subjects */}
        <div className="lg:col-span-1 space-y-4">
          <Card className="border-none shadow-xl shadow-slate-200/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                <BookOpen className="h-4 w-4" />
                Select Subject
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-1.5 px-3">
              {exam.subjects.map((s) => {
                const sid = s.subject_id || s.subject?.id;
                return (
                  <button
                    key={sid}
                    onClick={() => setSelectedSubjectId(sid)}
                    className={`w-full text-left px-4 py-3 rounded-xl transition-all duration-200 flex items-center justify-between group
                      ${selectedSubjectId === sid 
                        ? "bg-indigo-600 text-white shadow-lg shadow-indigo-100" 
                        : "hover:bg-slate-50 text-slate-600 hover:text-indigo-600"}
                    `}
                  >
                    <span className="font-bold text-sm truncate pr-2">{s.subject_name || s.subject?.name}</span>
                    <ChevronRight className={`h-4 w-4 transition-transform ${selectedSubjectId === sid ? "translate-x-0" : "-translate-x-2 opacity-0 group-hover:translate-x-0 group-hover:opacity-100"}`} />
                  </button>
                );
              })}
            </CardContent>
          </Card>

          {currentSubject && (
            <Card className="bg-indigo-600 text-white border-none shadow-xl shadow-indigo-200 overflow-hidden relative">
              <div className="absolute top-0 right-0 p-4 opacity-10">
                <GraduationCap className="h-20 w-20" />
              </div>
              <CardContent className="p-6 relative z-10 space-y-4">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60">Total Marks</p>
                  <p className="text-4xl font-black">{currentSubject.total_marks}</p>
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60">Passing Marks</p>
                  <p className="text-xl font-bold">{currentSubject.passing_marks}</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Main Content: Student List */}
        <div className="lg:col-span-3 space-y-6">
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <Input 
                placeholder="Search by student name or registration number..." 
                className="pl-12 h-12 bg-white border-none shadow-xl shadow-slate-100 rounded-2xl font-medium focus:ring-2 focus:ring-indigo-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <Card className="border-none shadow-2xl shadow-slate-200/50 overflow-hidden bg-white/80 backdrop-blur-md">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-slate-50/50">
                  <TableRow>
                    <TableHead className="font-bold text-slate-700 h-14">Student Info</TableHead>
                    <TableHead className="w-32 font-bold text-slate-700">Marks</TableHead>
                    <TableHead className="w-24 text-center font-bold text-slate-700">Absent</TableHead>
                    <TableHead className="font-bold text-slate-700">Remarks</TableHead>
                    <TableHead className="w-28 text-right font-bold text-slate-700">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredStudents.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-20 text-slate-400 italic">
                        <div className="flex flex-col items-center gap-2">
                          <User className="w-10 h-10 opacity-20" />
                          <p>No students found for this subject</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredStudents.map((student) => {
                      const sid = student._id || student.id;
                      const marksData = localMarks[selectedSubjectId]?.[sid] || { marks_obtained: "", is_absent: false, remarks: "" };
                      const isPassing = marksData.marks_obtained !== "" && marksData.marks_obtained >= (currentSubject?.passing_marks || 0);

                      return (
                        <TableRow key={sid} className="hover:bg-slate-50/30 transition-colors group">
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center shrink-0 border border-white shadow-sm group-hover:scale-110 transition-transform">
                                <User className="w-5 h-5 text-slate-400" />
                              </div>
                              <div>
                                <p className="font-bold text-slate-900 leading-tight">{student.name}</p>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">{student.registration_no || "N/A"}</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Input 
                              type="number"
                              max={currentSubject?.total_marks}
                              value={marksData.marks_obtained}
                              onChange={(e) => handleMarkChange(sid, "marks_obtained", e.target.value)}
                              disabled={marksData.is_absent}
                              className={`h-10 font-bold text-center rounded-xl transition-all
                                ${!marksData.is_absent && marksData.marks_obtained !== "" && !isPassing ? "border-red-200 bg-red-50 text-red-600 focus:ring-red-500" : "bg-slate-50/50 border-slate-100 focus:bg-white"}
                              `}
                            />
                          </TableCell>
                          <TableCell className="text-center">
                            <input 
                              type="checkbox"
                              checked={marksData.is_absent}
                              onChange={(e) => handleMarkChange(sid, "is_absent", e.target.checked)}
                              className="w-5 h-5 rounded-md accent-indigo-600 cursor-pointer"
                            />
                          </TableCell>
                          <TableCell>
                            <Input 
                              placeholder="Add remarks..."
                              value={marksData.remarks}
                              onChange={(e) => handleMarkChange(sid, "remarks", e.target.value)}
                              className="h-10 border-transparent bg-transparent hover:bg-slate-50 focus:bg-white focus:border-slate-200 rounded-xl transition-all"
                            />
                          </TableCell>
                          <TableCell className="text-right">
                            {marksData.is_absent ? (
                              <Badge className="bg-red-100 text-red-700 border-none font-black uppercase text-[9px] px-2.5 py-1">Absent</Badge>
                            ) : marksData.marks_obtained !== "" ? (
                              isPassing ? (
                                <Badge className="bg-emerald-100 text-emerald-700 border-none font-black uppercase text-[9px] px-2.5 py-1">Pass</Badge>
                              ) : (
                                <Badge className="bg-rose-100 text-rose-700 border-none font-black uppercase text-[9px] px-2.5 py-1">Fail</Badge>
                              )
                            ) : (
                              <Badge className="bg-slate-100 text-slate-400 border-none font-black uppercase text-[9px] px-2.5 py-1">Pending</Badge>
                            )}
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
      </div>
    </div>
  );
}
