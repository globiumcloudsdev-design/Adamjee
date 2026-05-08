"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Modal from "@/components/ui/modal";
import Dropdown from "@/components/ui/dropdown";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import ButtonLoader from "@/components/ui/button-loader";
import {
  Calendar,
  BookOpen,
  Plus,
  Edit,
  Trash2,
  Save,
  Search,
  User,
  CheckCircle2,
  Eye,
} from "lucide-react";
import { format } from "date-fns";
import ExamDetailsModal from "@/components/modals/ExamDetailsModal";
import ConfirmDeleteModal from "@/components/modals/ConfirmDeleteModal";
import ExamTable from "@/components/exams/ExamTable";
import DashboardSkeleton from "@/components/teacher/DashboardSkeleton";
import { MarkSheetSkeleton } from "@/components/ui/skeleton";
import apiClient from "@/lib/api-client";
import { API_ENDPOINTS } from "@/constants/api-endpoints";
import { toast } from "sonner";

export default function TeacherExamsPage() {
  const router = useRouter();
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all"); // all, upcoming, past
  
  // Modal state
  const [showModal, setShowModal] = useState(false);
  
  // Result Modal state
  const [showResultModal, setShowResultModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedExam, setSelectedExam] = useState(null);
  const [students, setStudents] = useState([]);
  const [localMarks, setLocalMarks] = useState({}); // { subjectId: { studentId: { marks_obtained, is_absent, remarks } } }
  const [savingResults, setSavingResults] = useState(false);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [newExam, setNewExam] = useState({
    title: "",
    examType: "midterm",
    classId: "",
    subjects: [{
      subjectId: "",
      date: new Date().toISOString().split("T")[0],
      startTime: "09:00",
      endTime: "10:00",
      duration: 60,
      totalMarks: 100,
      passingMarks: 40,
      room: "",
    }],
    status: "scheduled",
  });

  const [classes, setClasses] = useState([]);
  const [availableSubjects, setAvailableSubjects] = useState([]);
  const [myClasses, setMyClasses] = useState([]); // Store teacher's class assignments with sections

  useEffect(() => {
    loadExams();
    loadClasses();
    loadMyClasses();
  }, []);

  const loadClasses = async () => {
    try {
      const response = await apiClient.get(API_ENDPOINTS.TEACHER.CLASSES.LIST);
      if (response.success) {
        setClasses(response.data);
      }
    } catch (error) {
      console.error("Error loading classes:", error);
    }
  };

  const loadMyClasses = async () => {
    try {
      const response = await apiClient.get(API_ENDPOINTS.TEACHER.MY_CLASSES.LIST);
      if (response.success) {
        setMyClasses(response.data || []);
      }
    } catch (error) {
      console.error("Error loading teacher classes:", error);
    }
  };

  const loadSubjects = async (classId) => {
    if (!classId) return;
    try {
      const response = await apiClient.get(API_ENDPOINTS.TEACHER.CLASSES.SUBJECTS.replace(':id', classId));
      if (response.success) {
        setAvailableSubjects(response.data);
      }
    } catch (error) {
      console.error("Error loading subjects:", error);
      toast.error("Failed to load subjects");
    }
  };

  useEffect(() => {
    if (newExam.classId) {
      loadSubjects(newExam.classId);
    }
  }, [newExam.classId]);

  const loadExams = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get(API_ENDPOINTS.TEACHER.EXAMS.LIST);
      if (response.success) {
        setExams(response.exams);
      }
    } catch (error) {
      console.error("Error loading exams:", error);
      toast.error("Failed to load exams");
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (id, newStatus) => {
    try {
      const response = await apiClient.patch(API_ENDPOINTS.TEACHER.EXAMS.UPDATE_STATUS.replace(':id', id), { status: newStatus });
      if (response.success) {
        toast.success(`Exam ${newStatus} successfully`);
        loadExams();
      }
    } catch (error) {
      toast.error("Failed to update status");
    }
  };

  const handleManageResults = async (exam) => {
    setSelectedExam(exam);
    setSearchTerm("");
    setLocalMarks({});
    setStudents([]);
    
    try {
      setLoadingStudents(true);
      setShowResultModal(true);
      
      // 1. Fetch students for this specific exam/section
      const studentsResponse = await apiClient.get(API_ENDPOINTS.BRANCH_ADMIN.EXAMS.STUDENTS(exam.id || exam._id));
      if (!studentsResponse.success) {
        throw new Error(studentsResponse.error || "Failed to load students");
      }
      setStudents(studentsResponse.data || []);

      // 2. Fetch existing marks for this exam (keyed as subject->student, same as branch admin)
      const marksResponse = await apiClient.get(API_ENDPOINTS.BRANCH_ADMIN.EXAMS.MARKS(exam.id || exam._id));
      const initialMarks = {};
      if (marksResponse.success && marksResponse.data) {
        marksResponse.data.forEach(m => {
          if (!initialMarks[m.subject_id]) initialMarks[m.subject_id] = {};
          initialMarks[m.subject_id][m.student_id] = {
            marks_obtained: m.marks_obtained ?? "",
            is_absent: m.is_absent || false,
            remarks: m.remarks || ""
          };
        });
      }
      setLocalMarks(initialMarks);
    } catch (error) {
      console.error("Error loading results data:", error);
      toast.error(error.message || "Failed to load students and marks");
      setShowResultModal(false);
    } finally {
      setLoadingStudents(false);
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

  const handleSaveResults = async () => {
    if (!selectedExam) return;
    try {
      setSavingResults(true);
      
      let marksArray = [];
      (selectedExam.subjects || []).forEach(s => {
        const subjectId = s.subject_id || s.subject?.id;
        const subjectMarks = localMarks[subjectId] || {};
        Object.keys(subjectMarks).forEach(studentId => {
          const entry = subjectMarks[studentId];
          if (entry.marks_obtained !== "" || entry.is_absent) {
            marksArray.push({
              student_id: studentId,
              subject_id: subjectId,
              marks_obtained: entry.is_absent ? 0 : (parseFloat(entry.marks_obtained) || 0),
              is_absent: entry.is_absent,
              remarks: entry.remarks || ""
            });
          }
        });
      });

      if (marksArray.length === 0) {
        toast.info("No marks entered to save");
        setSavingResults(false);
        return;
      }

      const response = await apiClient.post(API_ENDPOINTS.BRANCH_ADMIN.EXAMS.MARKS(selectedExam.id || selectedExam._id), { 
        marks: marksArray
      });
      
      if (response.success) {
        toast.success("Marks saved successfully!");
        // Refresh marks in modal
        const marksResponse = await apiClient.get(API_ENDPOINTS.BRANCH_ADMIN.EXAMS.MARKS(selectedExam.id || selectedExam._id));
        if (marksResponse.success && marksResponse.data) {
          const refreshed = {};
          marksResponse.data.forEach(m => {
            if (!refreshed[m.subject_id]) refreshed[m.subject_id] = {};
            refreshed[m.subject_id][m.student_id] = {
              marks_obtained: m.marks_obtained ?? "",
              is_absent: m.is_absent || false,
              remarks: m.remarks || ""
            };
          });
          setLocalMarks(refreshed);
        }
      } else {
        toast.error(response.error || "Failed to save marks");
      }
    } catch (error) {
      toast.error(error.message || "Failed to save results");
    } finally {
      setSavingResults(false);
    }
  };



  const handleDeleteExam = (id) => {
    setDeletingId(id);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    try {
      setIsDeleting(true);
      const response = await apiClient.delete(API_ENDPOINTS.TEACHER.EXAMS.DELETE.replace(':id', deletingId));
      if (response.success) {
        toast.success("Exam deleted successfully");
        setShowDeleteModal(false);
        loadExams();
      }
    } catch (error) {
      toast.error("Failed to delete exam");
    } finally {
      setIsDeleting(false);
      setDeletingId(null);
    }
  };



  const getStatusBadge = (date, status) => {
    if (status === "completed") {
      return <Badge className="bg-gray-500">Completed</Badge>;
    }

    const examDate = new Date(date);
    const today = new Date();
    const diffDays = Math.ceil((examDate - today) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return <Badge className="bg-red-500 animate-pulse">Today</Badge>;
    } else if (diffDays === 1) {
      return <Badge className="bg-orange-500">Tomorrow</Badge>;
    } else if (diffDays <= 7) {
      return <Badge className="bg-yellow-500">In {diffDays} days</Badge>;
    } else {
      return <Badge variant="outline">Upcoming</Badge>;
    }
  };

  const handleFileUpload = (studentId, files) => {
    if (!selectedSubjectId) {
      toast.error("Please select a subject first");
      return;
    }

    // Store files locally without uploading yet
    const fileArray = Array.from(files);
    setResults(prev => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        [selectedSubjectId]: {
          ...(prev[studentId]?.[selectedSubjectId] || {}),
          files: fileArray,
          attachments: prev[studentId]?.[selectedSubjectId]?.attachments || []
        }
      }
    }));
    toast.success(`${fileArray.length} file(s) selected`);
  };

  const filteredExams = exams.filter((exam) => {
    if (filter === "all") return true;
    if (filter === "upcoming") return exam.status === "scheduled";
    if (filter === "past") return exam.status === "completed";
    return true;
  });

  if (loading) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="p-6 space-y-6 max-w-[1400px] mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Exams</h1>
          <p className="text-muted-foreground mt-1">
            View scheduled exams and manage marks
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        <Button
          variant={filter === "all" ? "default" : "outline"}
          onClick={() => setFilter("all")}
        >
          All Exams ({exams.length})
        </Button>
        <Button
          variant={filter === "upcoming" ? "default" : "outline"}
          onClick={() => setFilter("upcoming")}
        >
          Upcoming ({exams.filter((e) => e.status === "scheduled").length})
        </Button>
        <Button
          variant={filter === "past" ? "default" : "outline"}
          onClick={() => setFilter("past")}
        >
          Past ({exams.filter((e) => e.status === "completed").length})
        </Button>
      </div>

      {/* Exams Table */}
      <Card className="overflow-hidden border-none shadow-xl bg-white/80 backdrop-blur-md">
        <ExamTable 
          exams={filteredExams}
          onView={(exam) => { setSelectedExam(exam); setShowViewModal(true); }}
          onResults={handleManageResults}
          onDelete={handleDeleteExam}
          userRole="teacher"
          loading={loading}
        />
      </Card>

      {/* Result Modal — Branch-Admin-style mark sheet */}
      <Modal
        open={showResultModal}
        onClose={() => setShowResultModal(false)}
        title={`Enter Marks — ${selectedExam?.title || ""}`}
        size="xl"
      >
        {loadingStudents ? (
          <MarkSheetSkeleton />
        ) : (
          <div className="space-y-4">
            {/* Exam info badges + search + save */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex flex-wrap gap-2">
                {selectedExam?.class?.name && (
                  <Badge variant="secondary" className="text-xs font-semibold">{selectedExam.class.name}</Badge>
                )}
                {selectedExam?.section?.name && (
                  <Badge variant="outline" className="text-xs font-semibold">Section: {selectedExam.section.name}</Badge>
                )}
                {selectedExam?.exam_type && (
                  <Badge variant="outline" className="text-xs font-semibold uppercase">{selectedExam.exam_type}</Badge>
                )}
                <Badge variant="outline" className="text-xs font-semibold text-indigo-600 border-indigo-200">
                  {students.length} Students
                </Badge>
              </div>
              <div className="flex gap-2 items-center">
                <div className="relative w-56">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search students..."
                    className="pl-9 h-9 bg-background text-sm"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <Button onClick={handleSaveResults} disabled={savingResults} className="h-9 px-5 shrink-0">
                  <Save className="w-4 h-4 mr-2" />
                  {savingResults ? "Saving..." : "Save All Marks"}
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
                      <TableHead className="w-20 text-center font-bold text-xs py-4">Total</TableHead>
                      <TableHead className="w-20 text-center font-bold text-xs py-4">Pass</TableHead>
                      <TableHead className="w-28 text-center font-bold text-xs py-4">Marks</TableHead>
                      <TableHead className="w-20 text-center font-bold text-xs py-4">Absent</TableHead>
                      <TableHead className="w-24 text-center font-bold text-xs py-4">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(() => {
                      const filtered = students.filter(s =>
                        s.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        s.registration_no?.toLowerCase().includes(searchTerm.toLowerCase())
                      );

                      if (filtered.length === 0) {
                        return (
                          <TableRow>
                            <TableCell colSpan={9} className="h-32 text-center text-muted-foreground font-medium">
                              {searchTerm ? "No students match your search." : "No students found for this exam."}
                            </TableCell>
                          </TableRow>
                        );
                      }

                      return filtered.map((student, studentIndex) => {
                        const sid = student.id || student._id;
                        const enrolledSubjects = (selectedExam?.subjects || []).filter(s => {
                          const subjectId = s.subject_id || s.subject?.id;
                          return !student.enrolled_subjects ||
                                 student.enrolled_subjects.length === 0 ||
                                 student.enrolled_subjects.includes(subjectId);
                        });

                        const rowCount = enrolledSubjects.length || 1;
                        const isLastStudent = studentIndex === filtered.length - 1;

                        return enrolledSubjects.map((s, subIndex) => {
                          const subjectId = s.subject_id || s.subject?.id;
                          const marksData = localMarks[subjectId]?.[sid] || { marks_obtained: "", is_absent: false, remarks: "" };
                          const obtained = parseFloat(marksData.marks_obtained);
                          const isPassing = marksData.marks_obtained !== "" && obtained >= (s.passing_marks || 0);
                          const isFailing = marksData.marks_obtained !== "" && obtained < (s.passing_marks || 0);

                          const isFirstRow = subIndex === 0;
                          const isLastRow = subIndex === rowCount - 1;
                          const borderClass = isLastRow && !isLastStudent ? "border-b-2 border-muted" : "border-b border-border/40";

                          return (
                            <TableRow
                              key={`${sid}-${subjectId}`}
                              className={`transition-colors ${isFirstRow ? "bg-background hover:bg-muted/20" : "bg-muted/5 hover:bg-muted/20"} ${borderClass}`}
                            >
                              {isFirstRow && (
                                <TableCell rowSpan={rowCount} className="text-center text-muted-foreground text-sm font-semibold align-middle border-r">
                                  {studentIndex + 1}
                                </TableCell>
                              )}
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
                              {isFirstRow && (
                                <TableCell rowSpan={rowCount} className="align-middle border-r text-xs font-medium text-muted-foreground px-4">
                                  {student.registration_no || student.roll_no || "N/A"}
                                </TableCell>
                              )}

                              {/* Subject name */}
                              <TableCell className="py-2.5 px-4 text-sm font-medium text-foreground border-r">
                                {s.subject_name || s.subject?.name || "Subject"}
                              </TableCell>

                              {/* Total marks */}
                              <TableCell className="text-center text-sm font-semibold text-muted-foreground border-r">
                                {s.total_marks ?? "—"}
                              </TableCell>

                              {/* Passing marks */}
                              <TableCell className="text-center text-sm font-semibold text-muted-foreground border-r">
                                {s.passing_marks ?? "—"}
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
                      });
                    })()}
                  </TableBody>
                </Table>
              </div>
            </Card>

            <div className="flex justify-end gap-2 pt-1">
              <Button variant="outline" onClick={() => setShowResultModal(false)}>Close</Button>
              <Button onClick={handleSaveResults} disabled={savingResults}>
                <Save className="w-4 h-4 mr-2" />
                {savingResults ? "Saving..." : "Save All Marks"}
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {showViewModal && selectedExam && (
        <ExamDetailsModal
          exam={selectedExam}
          onClose={() => { setShowViewModal(false); setSelectedExam(null); }}
        />
      )}

      {showDeleteModal && (
        <ConfirmDeleteModal
          title="Delete Exam"
          message="Are you sure you want to delete this exam? This action cannot be undone."
          onConfirm={confirmDelete}
          onCancel={() => { setShowDeleteModal(false); setDeletingId(null); }}
          isLoading={isDeleting}
        />
      )}
    </div>
  );
}

