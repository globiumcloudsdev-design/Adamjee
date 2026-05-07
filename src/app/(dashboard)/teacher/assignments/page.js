"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Modal from "@/components/ui/modal";
import AssignmentFormModal from "@/components/forms/AssignmentFormModal";
import {
  Eye,
  Edit,
  FileText,
  Calendar,
  Clock,
  Users,
  Plus,
  Upload,
  CheckCircle,
  XCircle,
  AlertCircle,
  BookOpen,
  Trash2,
  MoreVertical,
} from "lucide-react";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import DashboardSkeleton from "@/components/teacher/DashboardSkeleton";
import apiClient from "@/lib/api-client";
import { API_ENDPOINTS } from "@/constants/api-endpoints";
import { toast } from "sonner";

export default function TeacherAssignmentsPage() {
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [showFormModal, setShowFormModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [assignmentDetails, setAssignmentDetails] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  useEffect(() => {
    fetchAssignments();
  }, []);

  const fetchAssignments = useCallback(async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const response = await apiClient.get(API_ENDPOINTS.TEACHER.ASSIGNMENTS.LIST);
      if (response.success) {
        setAssignments(response.data.map(a => ({
          ...a,
          id: a.id || a._id,
          classId: a.class,
          subjectId: a.subject,
          dueDate: a.due_date,
          totalMarks: a.total_marks,
          isActive: a.is_active,
          // Explicitly coerce to number — Postgres returns strings for COUNT()
          submissionCount: Number(a.submission_count ?? 0),
          totalStudents: Number(a.total_students ?? 0),
        })));
      }
    } catch (error) {
      console.error("Error fetching assignments:", error);
      if (!silent) toast.error("Failed to load assignments");
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    const refreshAssignments = () => {
      fetchAssignments(true);
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        refreshAssignments();
      }
    };

    window.addEventListener("focus", refreshAssignments);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    const intervalId = window.setInterval(refreshAssignments, 30000);

    return () => {
      window.removeEventListener("focus", refreshAssignments);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.clearInterval(intervalId);
    };
  }, [fetchAssignments]);

  const handleCreateOrUpdate = async (formData) => {
    try {
      setIsSubmitting(true);
      let response;
      if (selectedAssignment) {
        response = await apiClient.put(
          API_ENDPOINTS.TEACHER.ASSIGNMENTS.UPDATE(selectedAssignment.id || selectedAssignment._id),
          formData
        );
      } else {
        response = await apiClient.post(API_ENDPOINTS.TEACHER.ASSIGNMENTS.CREATE, formData);
      }

      if (response.success) {
        toast.success(selectedAssignment ? "Assignment updated" : "Assignment created");
        setShowFormModal(false);
        setSelectedAssignment(null);
        fetchAssignments();
      }
    } catch (error) {
      console.error("Error saving assignment:", error);
      toast.error(error.message || "Failed to save assignment");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this assignment?")) return;

    try {
      const response = await apiClient.delete(
        API_ENDPOINTS.TEACHER.ASSIGNMENTS.DELETE(id)
      );
      if (response.success) {
        toast.success("Assignment deleted");
        fetchAssignments();
      }
    } catch (error) {
      console.error("Error deleting assignment:", error);
      toast.error("Failed to delete assignment");
    }
  };

  const fetchAssignmentDetails = async (id) => {
    try {
      setLoadingDetails(true);
      const response = await apiClient.get(
        API_ENDPOINTS.TEACHER.ASSIGNMENTS.GET(id)
      );
      if (response.success) {
        setAssignmentDetails(response.data);
      }
    } catch (error) {
      console.error("Error fetching details:", error);
      toast.error("Failed to load assignment details");
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleViewDetails = (assignment) => {
    setSelectedAssignment(assignment);
    setAssignmentDetails(null);
    setShowDetailModal(true);
    fetchAssignmentDetails(assignment.id || assignment._id);
  };

  // When submission modal closes, silently refresh counts
  const handleCloseDetailModal = () => {
    setShowDetailModal(false);
    fetchAssignments(true); // silent refresh to update counts
  };

  const handleViewInfo = (assignment) => {
    setSelectedAssignment(assignment);
    setShowInfoModal(true);
  };

  const handleOpenEdit = (assignment) => {
    setSelectedAssignment(assignment);
    setShowFormModal(true);
  };

  const getStatusInfo = (assignment) => {
    if (assignment.isActive === false) {
      return { label: "Inactive", color: "bg-red-500" };
    }
    
    const dueDate = new Date(assignment.dueDate);
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const due = new Date(dueDate);
    due.setHours(0, 0, 0, 0);
    
    if (due < now) {
      return { label: "Overdue", color: "bg-orange-500" };
    }

    return { label: "Active", color: "bg-green-500" };
  };

  const filteredAssignments = assignments.filter((assignment) => {
    if (filter === "all") return true;
    if (filter === "active") return assignment.isActive === true;
    if (filter === "overdue") {
      const dueDate = new Date(assignment.dueDate);
      const now = new Date();
      now.setHours(0, 0, 0, 0);
      dueDate.setHours(0, 0, 0, 0);
      return dueDate < now;
    }
    return true;
  });

  if (loading) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="p-6 space-y-6 max-w-[1400px] mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Assignments</h1>
          <p className="text-muted-foreground mt-1">
            Create and manage student assignments
          </p>
        </div>
        <Button
          onClick={() => {
            setSelectedAssignment(null);
            setShowFormModal(true);
          }}
          className="w-full md:w-auto"
        >
          <Plus className="w-4 h-4 mr-2" />
          Create Assignment
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <Button
          variant={filter === "all" ? "default" : "outline"}
          onClick={() => setFilter("all")}
          size="sm"
        >
          All ({assignments.length})
        </Button>
        <Button
          variant={filter === "active" ? "default" : "outline"}
          onClick={() => setFilter("active")}
          size="sm"
        >
          Active ({assignments.filter((a) => a.status === "active").length})
        </Button>
        <Button
          variant={filter === "overdue" ? "default" : "outline"}
          onClick={() => setFilter("overdue")}
          size="sm"
        >
          Overdue (
          {assignments.filter((a) => new Date(a.dueDate) < new Date()).length})
        </Button>
      </div>

      {/* Assignments Table */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow>
              <TableHead className="font-bold">Assignment Title</TableHead>
              <TableHead className="font-bold">Class & Subject</TableHead>
              <TableHead className="font-bold text-center">Due Date</TableHead>
              <TableHead className="font-bold text-center">Marks</TableHead>
              <TableHead className="font-bold text-center">Submissions</TableHead>
              <TableHead className="font-bold text-center">Status</TableHead>
              <TableHead className="font-bold text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredAssignments.map((assignment, index) => {
              const statusInfo = getStatusInfo(assignment);
              const submittedCount = assignment.submissionCount || 0;
              const totalStudents = assignment.totalStudents || 0;

              return (
                <TableRow key={assignment.id || assignment._id} className="hover:bg-muted/30 transition-colors">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <FileText className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-bold text-sm">{assignment.title}</p>
                        <p className="text-xs text-muted-foreground line-clamp-1 max-w-[200px]">
                          {assignment.description || "No description"}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-0.5">
                      <p className="text-sm font-medium">{assignment.classId?.name}</p>
                      <p className="text-xs text-muted-foreground">{assignment.subjectId?.name}</p>
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <p className="text-sm font-medium">
                      {new Date(assignment.dueDate).toLocaleDateString()}
                    </p>
                  </TableCell>
                  <TableCell className="text-center font-medium">
                    {assignment.totalMarks}
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge
                      variant="outline"
                      className={`font-bold ${
                        submittedCount > 0
                          ? "border-green-500 text-green-700 bg-green-50"
                          : "border-gray-300 text-gray-500"
                      }`}
                    >
                      {submittedCount} / {totalStudents}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge className={statusInfo.color}>
                      {statusInfo.label}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => handleViewInfo(assignment)}
                        title="View Assignment Info"
                        className="h-8 w-8 text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50"
                      >
                        <FileText className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => handleViewDetails(assignment)}
                        title="View Submissions"
                        className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                      >
                        <Users className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => handleOpenEdit(assignment)}
                        title="Edit Assignment"
                        className="h-8 w-8 text-amber-600 hover:text-amber-700 hover:bg-amber-50"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => handleDelete(assignment.id || assignment._id)}
                        title="Delete Assignment"
                        className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* Empty State */}
      {filteredAssignments.length === 0 && (
        <Card className="p-12 text-center">
          <FileText className="w-16 h-16 mx-auto mb-4 text-muted-foreground/50" />
          <p className="text-muted-foreground font-medium">
            No assignments found
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            {filter === "all"
              ? "Create your first assignment"
              : `No ${filter} assignments`}
          </p>
        </Card>
      )}

      {/* Create/Edit Assignment Modal */}
      <AssignmentFormModal
        isOpen={showFormModal}
        onClose={() => {
          setShowFormModal(false);
          setSelectedAssignment(null);
        }}
        onSubmit={handleCreateOrUpdate}
        editingAssignment={selectedAssignment}
        isSubmitting={isSubmitting}
      />

      {/* Assignment Submissions Modal */}
      {selectedAssignment && (
      <Modal
          open={showDetailModal}
          onClose={() => {
            handleCloseDetailModal();
            setSelectedAssignment(null);
            setAssignmentDetails(null);
          }}
          title="Student Submissions"
          size="lg"
        >
          {loadingDetails ? (
            <div className="py-12 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading submissions...</p>
            </div>
          ) : assignmentDetails ? (
            <div className="space-y-6">
              {/* Totals / Roster Info */}
              <div className="flex items-center justify-between bg-muted/30 p-4 rounded-lg">
                <div className="text-sm">
                  <p className="text-muted-foreground">Class Statistics</p>
                  <div className="flex gap-4 mt-1">
                    <p><span className="font-bold">{assignmentDetails.totalStudents ?? '—'}</span> Total Students</p>
                    <p><span className="font-bold text-primary">{assignmentDetails.submissionCount ?? 0}</span> Submissions</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Badge className="bg-primary/10 text-primary border-primary/20">{assignmentDetails.classId?.name}</Badge>
                  {assignmentDetails.subjectId?.name && (
                    <Badge variant="outline">{assignmentDetails.subjectId?.name}</Badge>
                  )}
                </div>
              </div>

              {/* Student Roster + Submissions */}
              <div>
                <h4 className="font-semibold mb-4 flex items-center gap-2 px-1">
                  <Users className="w-5 h-5 text-primary" />
                  Student Roster
                </h4>

                {assignmentDetails.studentStats && assignmentDetails.studentStats.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {assignmentDetails.studentStats.map((stu) => (
                      <div key={stu._id} className="flex items-center justify-between p-3 border rounded-xl hover:shadow-sm transition-all bg-white">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold overflow-hidden">
                            {stu.profilePhoto ? (
                              <img src={stu.profilePhoto} alt="" className="w-full h-full object-cover" />
                            ) : (
                              stu.fullName?.split(" ").map((n) => n[0]).join("")
                            )}
                          </div>
                          <div>
                            <p className="font-bold text-sm">{stu.fullName}</p>
                            <p className="text-xs text-muted-foreground">Roll: {stu.rollNumber || 'N/A'}</p>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          {stu.submitted ? (
                            <Badge className="bg-green-100 text-green-700 border-green-300">
                              Submitted
                            </Badge>
                          ) : (
                            <Badge className="bg-red-50 text-red-700 border-red-100">
                              Missing
                            </Badge>
                          )}
                          {stu.submitted && stu.submission.submittedAt && (
                            <p className="text-[10px] text-muted-foreground">
                              {new Date(stu.submission.submittedAt).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-muted-foreground border-2 border-dashed rounded-xl">
                    <Users className="w-12 h-12 mx-auto mb-3 opacity-20" />
                    <p className="text-sm">No students found for this class</p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="py-12 text-center">
              <p className="text-muted-foreground">Failed to load submissions</p>
            </div>
          )}
        </Modal>
      )}

      {/* Assignment Info Modal */}
      {selectedAssignment && (
        <Modal
          open={showInfoModal}
          onClose={() => {
            setShowInfoModal(false);
            setSelectedAssignment(null);
          }}
          title="Assignment Details"
          size="md"
        >
          <div className="space-y-6 py-2">
            <div className="bg-primary/5 p-6 rounded-2xl border border-primary/10">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-2xl font-bold text-primary">{selectedAssignment.title}</h3>
                  <div className="flex items-center gap-2 mt-1 text-muted-foreground">
                    <span className="font-medium">{selectedAssignment.classId?.name}</span>
                    <span>•</span>
                    <span>{selectedAssignment.subjectId?.name}</span>
                  </div>
                </div>
                <Badge className={getStatusInfo(selectedAssignment).color}>
                  {getStatusInfo(selectedAssignment).label}
                </Badge>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center gap-3 text-sm">
                  <Calendar className="w-5 h-5 text-primary/60" />
                  <div>
                    <p className="text-xs text-muted-foreground">Due Date</p>
                    <p className="font-semibold">{new Date(selectedAssignment.dueDate).toLocaleDateString()}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Clock className="w-5 h-5 text-primary/60" />
                  <div>
                    <p className="text-xs text-muted-foreground">Total Marks</p>
                    <p className="font-semibold">{selectedAssignment.totalMarks} Points</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="text-sm font-bold flex items-center gap-2 px-1">
                <FileText className="w-4 h-4 text-primary" />
                Instructions
              </h4>
              <div className="bg-muted/30 p-4 rounded-xl text-sm leading-relaxed whitespace-pre-wrap min-h-[100px]">
                {selectedAssignment.description || "No instructions provided."}
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button onClick={() => setShowInfoModal(false)} className="w-full sm:w-auto">
                Close
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}




