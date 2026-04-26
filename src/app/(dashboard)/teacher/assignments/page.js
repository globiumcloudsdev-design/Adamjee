"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Modal from "@/components/ui/modal";
import AssignmentFormModal from "@/components/forms/AssignmentFormModal";
import {
  FileText,
  Calendar,
  Clock,
  Users,
  Plus,
  Eye,
  Edit,
  Trash2,
  X,
  Upload,
  CheckCircle,
  XCircle,
  AlertCircle,
  BookOpen,
} from "lucide-react";
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
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [assignmentDetails, setAssignmentDetails] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  useEffect(() => {
    fetchAssignments();
  }, []);

  const fetchAssignments = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get(API_ENDPOINTS.TEACHER.ASSIGNMENTS.LIST);
      if (response.success) {
        setAssignments(response.data);
      }
    } catch (error) {
      console.error("Error fetching assignments:", error);
      toast.error("Failed to load assignments");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateOrUpdate = async (formData) => {
    try {
      setIsSubmitting(true);
      let response;
      if (selectedAssignment) {
        response = await apiClient.put(
          API_ENDPOINTS.TEACHER.ASSIGNMENTS.UPDATE.replace(":id", selectedAssignment._id),
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
        API_ENDPOINTS.TEACHER.ASSIGNMENTS.DELETE.replace(":id", id)
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
        API_ENDPOINTS.TEACHER.ASSIGNMENTS.GET.replace(":id", id)
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
    fetchAssignmentDetails(assignment._id);
  };

  const handleOpenEdit = (assignment) => {
    setSelectedAssignment(assignment);
    setShowFormModal(true);
  };

  const getStatusInfo = (assignment) => {
    const dueDate = new Date(assignment.dueDate);
    const now = new Date();
    const diffDays = Math.ceil((dueDate - now) / (1000 * 60 * 60 * 24));

    if (assignment.status === "archived") {
      return { label: "Archived", color: "bg-gray-500" };
    }

    if (diffDays < 0) {
      return { label: "Overdue", color: "bg-red-500" };
    }

    if (diffDays === 0) {
      return { label: "Due Today", color: "bg-orange-500 animate-pulse" };
    }

    if (diffDays === 1) {
      return { label: "Due Tomorrow", color: "bg-yellow-500" };
    }

    return { label: `${diffDays} days left`, color: "bg-blue-500" };
  };

  const filteredAssignments = assignments.filter((assignment) => {
    if (filter === "all") return true;
    if (filter === "active") return assignment.status === "active";
    if (filter === "overdue") {
      const dueDate = new Date(assignment.dueDate);
      return dueDate < new Date();
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

      {/* Assignments List */}
      <div className="grid gap-4">
        {filteredAssignments.map((assignment, index) => {
          const statusInfo = getStatusInfo(assignment);
          const submittedCount = assignment.submissionCount || 0;
          
          return (
            <motion.div
              key={assignment._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card className="p-6 hover:shadow-lg transition-all duration-300">
                <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                  {/* Left Section */}
                  <div className="flex-1">
                    <div className="flex items-start gap-4 mb-3">
                      <div className="p-3 bg-primary/10 rounded-lg flex-shrink-0">
                        <FileText className="w-6 h-6 text-primary" />
                      </div>
                      <div className="flex-1">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <h3 className="font-bold text-lg">
                            {assignment.title}
                          </h3>
                          <Badge className={statusInfo.color}>
                            {statusInfo.label}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                          <span className="font-medium text-primary">{assignment.classId?.name}</span>
                          <span>•</span>
                          <span>{assignment.subjectId?.name}</span>
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {assignment.description}
                        </p>
                      </div>
                    </div>

                    {/* Details */}
                    <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground lg:ml-16">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        <span>
                          Due:{" "}
                          {new Date(assignment.dueDate).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        <span>{assignment.totalMarks} marks</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4" />
                        <span>{submittedCount} Submissions</span>
                      </div>
                    </div>
                  </div>

                  {/* Right Section - Stats */}
                  <div className="text-center lg:text-right flex-shrink-0">
                    <div className="mb-3">
                      <p className="text-3xl font-bold text-primary">
                        {submittedCount}
                      </p>
                      <p className="text-xs text-muted-foreground">Submissions</p>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleViewDetails(assignment)}
                  >
                    <Eye className="w-4 h-4 mr-1" />
                    View Submissions
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleOpenEdit(assignment)}
                  >
                    <Edit className="w-4 h-4 mr-1" />
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-red-600 hover:text-red-700"
                    onClick={() => handleDelete(assignment._id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </Card>
            </motion.div>
          );
        })}
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

      {/* Assignment Detail Modal */}
      {selectedAssignment && (
        <Modal
          open={showDetailModal}
          onClose={() => {
            setShowDetailModal(false);
            setSelectedAssignment(null);
            setAssignmentDetails(null);
          }}
          title="Assignment Submissions"
          size="lg"
        >
          {loadingDetails ? (
            <div className="py-12 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading submissions...</p>
            </div>
          ) : assignmentDetails ? (
            <div className="space-y-6">
              {/* Assignment Info */}
              <div className="bg-gradient-to-r from-primary/5 to-primary/10 p-5 rounded-lg border border-primary/20">
                <h3 className="font-bold text-xl mb-2">
                  {assignmentDetails.title}
                </h3>
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
                  <span className="font-medium text-primary">{assignmentDetails.classId?.name}</span>
                  <span>•</span>
                  <span>{assignmentDetails.subjectId?.name}</span>
                </div>
                <p className="text-sm mb-4">{assignmentDetails.description}</p>
                <div className="flex flex-wrap gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    <span>
                      Due:{" "}
                      {new Date(assignmentDetails.dueDate).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    <span>{assignmentDetails.totalMarks} marks</span>
                  </div>
                </div>
              </div>

              {/* Totals / Roster */}
              <div className="flex items-center justify-between mt-4">
                <div className="text-sm text-muted-foreground">
                  <p>
                    <span className="font-medium">Total Students:</span> {assignmentDetails.totalStudents ?? '—'}
                  </p>
                  <p>
                    <span className="font-medium">Submitted:</span> {assignmentDetails.submissionCount ?? (assignmentDetails.submissions?.length || 0)}
                  </p>
                </div>
                <div className="text-sm">
                  <Badge className="bg-blue-100 text-blue-700 border-blue-200">Class: {assignmentDetails.classId?.name}</Badge>
                  {assignmentDetails.sectionId ? (
                    <Badge className="ml-2 bg-gray-100 text-gray-700 border-gray-200">Section: {assignmentDetails.sectionId}</Badge>
                  ) : null}
                </div>
              </div>

              {/* Student Roster + Submissions */}
              <div>
                <h4 className="font-semibold mb-4 flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Student Roster ({assignmentDetails.totalStudents ?? (assignmentDetails.studentStats?.length || 0)})
                </h4>

                {assignmentDetails.studentStats && assignmentDetails.studentStats.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {assignmentDetails.studentStats.map((stu) => (
                      <div key={stu._id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/30 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold overflow-hidden">
                            {stu.profilePhoto ? (
                              <img src={stu.profilePhoto} alt="" className="w-full h-full object-cover" />
                            ) : (
                              stu.fullName?.split(" ").map((n) => n[0]).join("")
                            )}
                          </div>
                          <div>
                            <p className="font-medium">{stu.fullName}</p>
                            <p className="text-xs text-muted-foreground">Roll: {stu.rollNumber || 'N/A'}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          {stu.submitted ? (
                            <div className="text-right mr-4">
                              <p className="text-xs text-muted-foreground">Submitted on</p>
                              <p className="text-sm font-medium">{new Date(stu.submission.submittedAt).toLocaleDateString()}</p>
                            </div>
                          ) : null}
                          {stu.submitted ? (
                            <Badge className="bg-green-100 text-green-700 border-green-300 flex items-center">
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Submitted
                            </Badge>
                          ) : (
                            <Badge className="bg-red-50 text-red-700 border-red-100 flex items-center">
                              <XCircle className="w-3 h-3 mr-1" />
                              Not Submitted
                            </Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg">
                    <FileText className="w-12 h-12 mx-auto mb-3 opacity-40" />
                    <p className="text-sm">No students found for this class/section</p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="py-12 text-center">
              <p className="text-muted-foreground">Failed to load details</p>
            </div>
          )}
        </Modal>
      )}
    </div>
  );
}
