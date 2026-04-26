"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
  Clock,
  MapPin,
  BookOpen,
  Plus,
  Edit,
  Trash2,
  FileText,
  Upload,
  CheckCircle,
  XCircle,
} from "lucide-react";
import DashboardSkeleton from "@/components/teacher/DashboardSkeleton";
import apiClient from "@/lib/api-client";
import { API_ENDPOINTS } from "@/constants/api-endpoints";
import { toast } from "sonner";

export default function TeacherExamsPage() {
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all"); // all, upcoming, past
  
  // Modal state used for both Create and Edit
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState("create"); // 'create' | 'edit'
  const [editingId, setEditingId] = useState(null);
  
  // Result Modal state
  const [showResultModal, setShowResultModal] = useState(false);
  const [selectedExam, setSelectedExam] = useState(null);
  const [selectedSubjectId, setSelectedSubjectId] = useState("");
  const [students, setStudents] = useState([]);
  const [results, setResults] = useState({}); // { studentId: { marks, grade, remarks, files } }
  const [savingResults, setSavingResults] = useState(false);

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
    // Default to first subject if available
    if (exam.subjects && exam.subjects.length > 0) {
      setSelectedSubjectId(exam.subjects[0].subjectId._id || exam.subjects[0].subjectId);
    }
    
    try {
      // Get students from teacher's assigned classes (already filtered by section)
      const classId = exam.classId._id || exam.classId;
      
      // Find matching classes from myClasses
      const matchingClasses = myClasses.filter(c => 
        (c.classId === classId || c.classId?._id === classId)
      );
      
      // Collect all students from matching classes
      let filteredStudents = [];
      matchingClasses.forEach(classItem => {
        if (classItem.students && Array.isArray(classItem.students)) {
          filteredStudents.push(...classItem.students);
        }
      });
      
      // Remove duplicate students (if any)
      const uniqueStudents = [];
      const seenIds = new Set();
      filteredStudents.forEach(student => {
        const studentId = student._id || student.id;
        if (!seenIds.has(studentId)) {
          seenIds.add(studentId);
          uniqueStudents.push(student);
        }
      });
      
      setStudents(uniqueStudents);
      
      // Initialize results from exam.results if they exist
      const initialResults = {};
      exam.results?.forEach(r => {
        const studentId = r.studentId._id || r.studentId;
        const subjectId = r.subjectId._id || r.subjectId;
        
        if (!initialResults[studentId]) initialResults[studentId] = {};
        initialResults[studentId][subjectId] = {
          marksObtained: r.marksObtained,
          grade: r.grade,
          remarks: r.remarks,
          isAbsent: r.isAbsent,
          attachments: r.attachments || []
        };
      });
      setResults(initialResults);
      setShowResultModal(true);
    } catch (error) {
      console.error("Error loading students:", error);
      toast.error("Failed to load students");
    }
  };

  const handleSaveResults = async () => {
    if (!selectedSubjectId) {
      toast.error("Please select a subject");
      return;
    }

    try {
      setSavingResults(true);
      
      // Upload files for each student first
      const resultsArray = [];
      for (const student of students) {
        const studentResult = results[student._id]?.[selectedSubjectId] || {};
        let uploadedAttachments = studentResult.attachments || [];
        
        // Upload new files if any
        if (studentResult.files && studentResult.files.length > 0) {
          const formData = new FormData();
          studentResult.files.forEach(file => {
            formData.append('attachments', file);
          });
          
          try {
            const uploadResponse = await apiClient.post(API_ENDPOINTS.COMMON.UPLOADS.MULTIPLE, formData);
            if (uploadResponse.success && uploadResponse.urls) {
              uploadedAttachments = [...uploadedAttachments, ...uploadResponse.urls];
            }
          } catch (uploadError) {
            console.error('File upload error:', uploadError);
            toast.error(`Failed to upload files for ${student.fullName}`);
          }
        }
        
        resultsArray.push({
          studentId: student._id,
          marksObtained: studentResult.marksObtained,
          grade: studentResult.grade,
          remarks: studentResult.remarks,
          isAbsent: studentResult.isAbsent,
          attachments: uploadedAttachments
        });
      }

      const response = await apiClient.post(`${API_ENDPOINTS.TEACHER.EXAMS.RESULTS.replace(':id', selectedExam._id)}`, { 
        results: resultsArray,
        subjectId: selectedSubjectId 
      });
      
      if (response.success) {
        toast.success("Results saved successfully");
        setShowResultModal(false);
        loadExams();
      }
    } catch (error) {
      toast.error("Failed to save results");
    } finally {
      setSavingResults(false);
    }
  };

  const handleCreateExam = async (e) => {
    e.preventDefault();
    try {
      const response = await apiClient.post(API_ENDPOINTS.TEACHER.EXAMS.CREATE, newExam);
      if (response.success) {
        toast.success("Exam created successfully");
        setShowModal(false);
        loadExams();
        setNewExam({
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
      }
    } catch (error) {
      toast.error(error.message || "Failed to create exam");
    }
  };

  const handleUpdateExam = async (e) => {
    e.preventDefault();
    try {
      const response = await apiClient.put(API_ENDPOINTS.TEACHER.EXAMS.UPDATE.replace(':id', editingId), newExam);
      if (response.success) {
        toast.success("Exam updated successfully");
        setShowModal(false);
        loadExams();
      }
    } catch (error) {
      toast.error(error.message || "Failed to update exam");
    }
  };

  const handleDeleteExam = async (id) => {
    if (!window.confirm("Are you sure you want to delete this exam?")) return;
    try {
      const response = await apiClient.delete(API_ENDPOINTS.TEACHER.EXAMS.DELETE.replace(':id', id));
      if (response.success) {
        toast.success("Exam deleted successfully");
        loadExams();
      }
    } catch (error) {
      toast.error("Failed to delete exam");
    }
  };

  const openEditModal = (exam) => {
    setModalMode("edit");
    setEditingId(exam._id);
    setNewExam({
      title: exam.title,
      examType: exam.examType,
      classId: exam.classId._id || exam.classId,
      subjects: exam.subjects.map(s => ({
        subjectId: s.subjectId._id || s.subjectId,
        date: new Date(s.date).toISOString().split("T")[0],
        startTime: s.startTime,
        endTime: s.endTime,
        duration: s.duration,
        totalMarks: s.totalMarks,
        passingMarks: s.passingMarks,
        room: s.room,
      })),
      status: exam.status,
    });
    setShowModal(true);
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
          <h1 className="text-3xl font-bold">Exams Management</h1>
          <p className="text-muted-foreground mt-1">
            Schedule and manage exams
          </p>
        </div>
        <Button
          onClick={() => {
            setModalMode("create");
            setEditingId(null);
            setNewExam({
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
            setShowModal(true);
          }}
        >
          <Plus className="w-4 h-4 mr-2" />
          Create New Exam
        </Button>
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

      {/* Exams Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filteredExams.map((exam, index) => (
          <motion.div
            key={exam._id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className="p-6 hover:shadow-lg transition-all duration-300 group relative overflow-hidden">
              {/* Status Badge */}
              <div className="absolute top-4 right-4">
                <Badge variant={exam.status === 'completed' ? 'secondary' : 'default'}>
                  {exam.status.toUpperCase()}
                </Badge>
              </div>

              {/* Exam Header */}
              <div className="mb-4 pr-24">
                <h3 className="font-bold text-lg group-hover:text-primary transition-colors mb-1">
                  {exam.title}
                </h3>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <BookOpen className="w-4 h-4" />
                  <span>{exam.classId?.name} ({exam.examType})</span>
                </div>
              </div>

              {/* Subjects List */}
              <div className="space-y-3 mb-4">
                {exam.subjects.map((sub, idx) => (
                  <div key={idx} className="p-3 bg-muted/50 rounded-lg text-sm">
                    <div className="font-medium mb-1">{sub.subjectId?.name}</div>
                    <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(sub.date).toLocaleDateString()}
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {sub.startTime}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Actions */}
              <div className="flex flex-wrap gap-2 pt-4 border-t border-border">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => openEditModal(exam)}
                >
                  <Edit className="w-4 h-4 mr-1" />
                  Edit
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => handleManageResults(exam)}
                >
                  <FileText className="w-4 h-4 mr-1" />
                  Results
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className={exam.status === 'active' ? 'text-red-600' : 'text-green-600'}
                  onClick={() => handleStatusChange(exam._id, exam.status === 'active' ? 'scheduled' : 'active')}
                >
                  {exam.status === 'active' ? <XCircle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-red-600 hover:text-red-700"
                  onClick={() => handleDeleteExam(exam._id)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Result Modal */}
      <Modal
        open={showResultModal}
        onClose={() => setShowResultModal(false)}
        title={`Manage Results - ${selectedExam?.title}`}
        size="xl"
      >
        <div className="space-y-4">
          {/* Subject Selector for Results */}
          <div className="flex items-center gap-4 p-4 bg-muted/30 rounded-lg">
            <label className="text-sm font-medium">Select Subject:</label>
            <div className="w-64">
              <Dropdown
                value={selectedSubjectId}
                onChange={(e) => setSelectedSubjectId(e.target.value)}
                options={selectedExam?.subjects.map(sub => ({
                  value: sub.subjectId._id || sub.subjectId,
                  label: sub.subjectId.name
                })) || []}
                placeholder="Select Subject"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>Marks</TableHead>
                  <TableHead>Grade</TableHead>
                  <TableHead>Remarks</TableHead>
                  <TableHead>Attachments</TableHead>
                  <TableHead>Absent</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {students.map(student => (
                  <TableRow key={student._id}>
                    <TableCell>
                      <div className="font-medium">{student.fullName || student.name}</div>
                      <div className="text-xs text-muted-foreground">{student.studentProfile?.rollNumber || student.rollNumber}</div>
                    </TableCell>
                    <TableCell>
                      <input
                        type="number"
                        className="w-20 p-1 border rounded bg-background"
                        value={results[student._id]?.[selectedSubjectId]?.marksObtained || ""}
                        onChange={(e) => setResults(prev => ({
                          ...prev,
                          [student._id]: {
                            ...prev[student._id],
                            [selectedSubjectId]: {
                              ...(prev[student._id]?.[selectedSubjectId] || {}),
                              marksObtained: Number(e.target.value)
                            }
                          }
                        }))}
                        disabled={results[student._id]?.[selectedSubjectId]?.isAbsent}
                      />
                    </TableCell>
                    <TableCell>
                      <input
                        type="text"
                        className="w-16 p-1 border rounded bg-background"
                        value={results[student._id]?.[selectedSubjectId]?.grade || ""}
                        onChange={(e) => setResults(prev => ({
                          ...prev,
                          [student._id]: {
                            ...prev[student._id],
                            [selectedSubjectId]: {
                              ...(prev[student._id]?.[selectedSubjectId] || {}),
                              grade: e.target.value
                            }
                          }
                        }))}
                        disabled={results[student._id]?.[selectedSubjectId]?.isAbsent}
                      />
                    </TableCell>
                    <TableCell>
                      <input
                        type="text"
                        className="w-full p-1 border rounded bg-background"
                        value={results[student._id]?.[selectedSubjectId]?.remarks || ""}
                        onChange={(e) => setResults(prev => ({
                          ...prev,
                          [student._id]: {
                            ...prev[student._id],
                            [selectedSubjectId]: {
                              ...(prev[student._id]?.[selectedSubjectId] || {}),
                              remarks: e.target.value
                            }
                          }
                        }))}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <label className="cursor-pointer p-1 bg-primary/10 rounded hover:bg-primary/20">
                          <Upload className="w-4 h-4" />
                          <input
                            type="file"
                            multiple
                            className="hidden"
                            onChange={(e) => handleFileUpload(student._id, e.target.files)}
                          />
                        </label>
                        {(results[student._id]?.[selectedSubjectId]?.files?.length > 0 || results[student._id]?.[selectedSubjectId]?.attachments?.length > 0) && (
                          <span className="text-xs">
                            {results[student._id][selectedSubjectId].files?.length || 0} new + {results[student._id][selectedSubjectId].attachments?.length || 0} uploaded
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <input
                        type="checkbox"
                        checked={results[student._id]?.[selectedSubjectId]?.isAbsent || false}
                        onChange={(e) => setResults(prev => ({
                          ...prev,
                          [student._id]: {
                            ...prev[student._id],
                            [selectedSubjectId]: {
                              ...(prev[student._id]?.[selectedSubjectId] || {}),
                              isAbsent: e.target.checked
                            }
                          }
                        }))}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowResultModal(false)}>Cancel</Button>
            <Button onClick={handleSaveResults} disabled={savingResults}>
              {savingResults ? <ButtonLoader /> : "Save Results"}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Create/Edit Exam Modal */}
      <Modal
        open={showModal}
        onClose={() => setShowModal(false)}
        title={modalMode === "create" ? "Create Exam" : "Edit Exam"}
        size="lg"
      >
        <form onSubmit={modalMode === "create" ? handleCreateExam : handleUpdateExam} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Exam Title</label>
              <input
                className="w-full p-2 border rounded"
                value={newExam.title}
                onChange={(e) => setNewExam({ ...newExam, title: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Exam Type</label>
              <Dropdown
                value={newExam.examType}
                onChange={(e) => setNewExam({ ...newExam, examType: e.target.value })}
                options={[
                  { value: "midterm", label: "Midterm" },
                  { value: "final", label: "Final" },
                  { value: "quiz", label: "Quiz" },
                  { value: "monthly", label: "Monthly Test" },
                ]}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Class</label>
            <Dropdown
              value={newExam.classId}
              onChange={(e) => setNewExam({ ...newExam, classId: e.target.value })}
              options={classes.map(c => ({ value: c._id, label: c.name }))}
              placeholder="Select Class"
              required
            />
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Subjects & Schedule</label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setNewExam({
                  ...newExam,
                  subjects: [...newExam.subjects, {
                    subjectId: "",
                    date: new Date().toISOString().split("T")[0],
                    startTime: "09:00",
                    endTime: "10:00",
                    duration: 60,
                    totalMarks: 100,
                    passingMarks: 40,
                    room: "",
                  }]
                })}
              >
                Add Subject
              </Button>
            </div>

            {newExam.subjects.map((sub, index) => (
              <div key={index} className="p-4 border rounded-lg space-y-3 relative">
                {index > 0 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    className="absolute top-2 right-2 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                    onClick={() => {
                      const subs = [...newExam.subjects];
                      subs.splice(index, 1);
                      setNewExam({ ...newExam, subjects: subs });
                    }}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-medium">Subject</label>
                    <Dropdown
                      value={sub.subjectId}
                      onChange={(e) => {
                        const subs = [...newExam.subjects];
                        subs[index].subjectId = e.target.value;
                        setNewExam({ ...newExam, subjects: subs });
                      }}
                      options={availableSubjects.map(s => ({ value: s._id, label: s.name }))}
                      placeholder="Select Subject"
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium">Date</label>
                    <input
                      type="date"
                      className="w-full p-2 border rounded text-sm"
                      value={sub.date}
                      onChange={(e) => {
                        const subs = [...newExam.subjects];
                        subs[index].date = e.target.value;
                        setNewExam({ ...newExam, subjects: subs });
                      }}
                      required
                    />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-medium">Start Time</label>
                    <input
                      type="time"
                      className="w-full p-2 border rounded text-sm"
                      value={sub.startTime}
                      onChange={(e) => {
                        const subs = [...newExam.subjects];
                        subs[index].startTime = e.target.value;
                        setNewExam({ ...newExam, subjects: subs });
                      }}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium">End Time</label>
                    <input
                      type="time"
                      className="w-full p-2 border rounded text-sm"
                      value={sub.endTime}
                      onChange={(e) => {
                        const subs = [...newExam.subjects];
                        subs[index].endTime = e.target.value;
                        setNewExam({ ...newExam, subjects: subs });
                      }}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium">Room</label>
                    <input
                      className="w-full p-2 border rounded text-sm"
                      value={sub.room}
                      onChange={(e) => {
                        const subs = [...newExam.subjects];
                        subs[index].room = e.target.value;
                        setNewExam({ ...newExam, subjects: subs });
                      }}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-medium">Total Marks</label>
                    <input
                      type="number"
                      className="w-full p-2 border rounded text-sm"
                      value={sub.totalMarks}
                      onChange={(e) => {
                        const subs = [...newExam.subjects];
                        subs[index].totalMarks = Number(e.target.value);
                        setNewExam({ ...newExam, subjects: subs });
                      }}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium">Passing Marks</label>
                    <input
                      type="number"
                      className="w-full p-2 border rounded text-sm"
                      value={sub.passingMarks}
                      onChange={(e) => {
                        const subs = [...newExam.subjects];
                        subs[index].passingMarks = Number(e.target.value);
                        setNewExam({ ...newExam, subjects: subs });
                      }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button type="submit">{modalMode === "create" ? "Create Exam" : "Save Changes"}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

