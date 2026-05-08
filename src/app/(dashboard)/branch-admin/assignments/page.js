"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Modal from "@/components/ui/modal";
import BranchAdminAssignmentFormModal from "@/components/forms/BranchAdminAssignmentFormModal";
import ConfirmDeleteModal from "@/components/modals/ConfirmDeleteModal";
import {
  Eye,
  Edit,
  FileText,
  Calendar,
  Clock,
  Users,
  Plus,
  CheckCircle,
  BookOpen,
  Trash2,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import Tooltip from "@/components/ui/tooltip";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import Skeleton, { SubmissionsSkeleton } from "@/components/ui/skeleton";
import apiClient from "@/lib/api-client";
import { API_ENDPOINTS } from "@/constants/api-endpoints";
import { toast } from "sonner";

export default function BranchAdminAssignmentsPage() {
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Modals
  const [showFormModal, setShowFormModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [assignmentDetails, setAssignmentDetails] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  useEffect(() => {
    fetchAssignments();
  }, []);

  const fetchAssignments = useCallback(async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const response = await apiClient.get(API_ENDPOINTS.BRANCH_ADMIN.ASSIGNMENTS.LIST);
      if (response.success) {
        setAssignments(
          response.data.map((a) => ({
            ...a,
            id: a.id || a._id,
            classId: a.class,
            sectionId: a.section,
            subjectId: a.subject,
            dueDate: a.due_date,
            totalMarks: a.total_marks,
            isActive: a.is_active,
            submissionCount: Number(a.submission_count ?? 0),
            totalStudents: Number(a.total_students ?? 0),
            // For edit form: pre-fill group
            group_id: a.class?.group_id || "",
            class_id: a.class_id,
            section_id: a.section_id,
            subject_id: a.subject_id,
          }))
        );
      }
    } catch (error) {
      console.error("Error fetching assignments:", error);
      if (!silent) toast.error("Failed to load assignments");
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  // Auto-refresh on focus / visibility
  useEffect(() => {
    const refresh = () => fetchAssignments(true);
    const onVisibility = () => {
      if (document.visibilityState === "visible") refresh();
    };
    window.addEventListener("focus", refresh);
    document.addEventListener("visibilitychange", onVisibility);
    const id = setInterval(refresh, 30000);
    return () => {
      window.removeEventListener("focus", refresh);
      document.removeEventListener("visibilitychange", onVisibility);
      clearInterval(id);
    };
  }, [fetchAssignments]);

  const handleCreateOrUpdate = async (formData) => {
    try {
      setIsSubmitting(true);
      let response;
      if (selectedAssignment) {
        response = await apiClient.put(
          API_ENDPOINTS.BRANCH_ADMIN.ASSIGNMENTS.UPDATE(
            selectedAssignment.id || selectedAssignment._id
          ),
          formData
        );
      } else {
        response = await apiClient.post(
          API_ENDPOINTS.BRANCH_ADMIN.ASSIGNMENTS.CREATE,
          formData
        );
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

  const handleDelete = async () => {
    if (!selectedAssignment) return;
    try {
      setIsDeleting(true);
      const id = selectedAssignment.id || selectedAssignment._id;
      const response = await apiClient.delete(
        API_ENDPOINTS.BRANCH_ADMIN.ASSIGNMENTS.DELETE(id)
      );
      if (response.success) {
        toast.success("Assignment deleted");
        setShowDeleteModal(false);
        setSelectedAssignment(null);
        fetchAssignments();
      }
    } catch (error) {
      console.error("Error deleting assignment:", error);
      toast.error("Failed to delete assignment");
    } finally {
      setIsDeleting(false);
    }
  };

  const openDeleteConfirm = (assignment) => {
    setSelectedAssignment(assignment);
    setShowDeleteModal(true);
  };

  const fetchAssignmentDetails = async (id) => {
    try {
      setLoadingDetails(true);
      const response = await apiClient.get(
        API_ENDPOINTS.BRANCH_ADMIN.ASSIGNMENTS.GET(id)
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

  const handleCloseDetailModal = () => {
    setShowDetailModal(false);
    fetchAssignments(true);
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
    const due = new Date(assignment.dueDate);
    due.setHours(0, 0, 0, 0);
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    if (due < now) return { label: "Overdue", color: "bg-orange-500" };
    return { label: "Active", color: "bg-green-500" };
  };

  const filteredAssignments = assignments.filter((a) => {
    const matchesSearch =
      !searchQuery ||
      a.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.classId?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.subjectId?.name?.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;
    if (filter === "all") return true;
    if (filter === "active") return a.isActive === true;
    if (filter === "inactive") return a.isActive === false;
    if (filter === "overdue") {
      const due = new Date(a.dueDate);
      due.setHours(0, 0, 0, 0);
      const now = new Date();
      now.setHours(0, 0, 0, 0);
      return due < now;
    }
    return true;
  });

  // Pagination Logic
  const totalPages = Math.ceil(filteredAssignments.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredAssignments.slice(indexOfFirstItem, indexOfLastItem);

  // Reset to page 1 when filter or search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [filter, searchQuery]);

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <Skeleton className="h-9 w-56" />
            <Skeleton className="h-4 w-80" />
          </div>
          <Skeleton className="h-10 w-40 rounded-lg" />
        </div>
        <div className="flex gap-2">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-9 w-24 rounded-lg" />
          ))}
        </div>
        <Skeleton className="h-96 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-[1400px] mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row md:items-center justify-between gap-4"
      >
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-xl">
              <FileText className="w-7 h-7 text-primary" />
            </div>
            Assignments
          </h1>
          <p className="text-muted-foreground mt-1">
            Create and assign class assignments for all branches
          </p>
        </div>
        <Button
          onClick={() => {
            setSelectedAssignment(null);
            setShowFormModal(true);
          }}
          className="w-full md:w-auto gap-2"
        >
          <Plus className="w-4 h-4" />
          Create Assignment
        </Button>
      </motion.div>

      {/* Stats strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Total", value: assignments.length, color: "bg-indigo-50 text-indigo-700 border-indigo-100" },
          { label: "Active", value: assignments.filter((a) => a.isActive && new Date(a.dueDate) >= new Date()).length, color: "bg-green-50 text-green-700 border-green-100" },
          { label: "Overdue", value: assignments.filter((a) => new Date(a.dueDate) < new Date()).length, color: "bg-orange-50 text-orange-700 border-orange-100" },
          { label: "Inactive", value: assignments.filter((a) => !a.isActive).length, color: "bg-red-50 text-red-700 border-red-100" },
        ].map((stat) => (
          <div key={stat.label} className={`rounded-xl border p-4 ${stat.color}`}>
            <div className="text-2xl font-bold">{stat.value}</div>
            <div className="text-sm font-medium mt-0.5">{stat.label} Assignments</div>
          </div>
        ))}
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by title, class or subject…"
            className="w-full pl-9 pr-4 py-2 border rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {["all", "active", "overdue", "inactive"].map((f) => (
            <Button
              key={f}
              variant={filter === f ? "default" : "outline"}
              onClick={() => setFilter(f)}
              size="sm"
              className="capitalize"
            >
              {f === "all" ? `All (${assignments.length})` : f.charAt(0).toUpperCase() + f.slice(1)}
            </Button>
          ))}
        </div>
      </div>

      {/* Table */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-xl shadow-sm border overflow-hidden"
      >
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow>
              <TableHead className="font-bold">Assignment Title</TableHead>
              <TableHead className="font-bold">Class & Subject</TableHead>
              <TableHead className="font-bold">Teacher</TableHead>
              <TableHead className="font-bold text-center">Due Date</TableHead>
              <TableHead className="font-bold text-center">Marks</TableHead>
              <TableHead className="font-bold text-center">Submissions</TableHead>
              <TableHead className="font-bold text-center">Status</TableHead>
              <TableHead className="font-bold text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <AnimatePresence mode="wait">
              {currentItems.map((assignment) => {
                const statusInfo = getStatusInfo(assignment);
                const submitted = assignment.submissionCount || 0;
                const total = assignment.totalStudents || 0;

                return (
                  <TableRow
                    key={assignment.id || assignment._id}
                    className="hover:bg-muted/30 transition-colors"
                  >
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/10 rounded-lg">
                          <FileText className="w-4 h-4 text-primary" />
                        </div>
                        <div>
                          <Tooltip content={assignment.title}>
                            <p className="font-bold text-sm truncate max-w-[200px]">
                              {assignment.title}
                            </p>
                          </Tooltip>
                          <p className="text-xs text-muted-foreground line-clamp-1 max-w-[180px]">
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
                    <TableCell>
                      <p className="text-sm">
                        {assignment.teacher
                          ? `${assignment.teacher.first_name} ${assignment.teacher.last_name}`
                          : "—"}
                      </p>
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
                          submitted > 0
                            ? "border-green-500 text-green-700 bg-green-50"
                            : "border-gray-300 text-gray-500"
                        }`}
                      >
                        {submitted} / {total}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge className={statusInfo.color}>{statusInfo.label}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Tooltip content="View Assignment Info">
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => handleViewInfo(assignment)}
                            className="h-8 w-8 text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50"
                          >
                            <FileText className="w-4 h-4" />
                          </Button>
                        </Tooltip>
                        <Tooltip content="View Submissions">
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => handleViewDetails(assignment)}
                            className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                          >
                            <Users className="w-4 h-4" />
                          </Button>
                        </Tooltip>
                        <Tooltip content="Edit Assignment">
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => handleOpenEdit(assignment)}
                            className="h-8 w-8 text-amber-600 hover:text-amber-700 hover:bg-amber-50"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                        </Tooltip>
                        <Tooltip content="Delete Assignment">
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => openDeleteConfirm(assignment)}
                            className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </Tooltip>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </AnimatePresence>
          </TableBody>
        </Table>

        {/* Empty State */}
        {filteredAssignments.length === 0 && (
          <div className="py-16 text-center">
            <FileText className="w-16 h-16 mx-auto mb-4 text-muted-foreground/30" />
            <p className="text-muted-foreground font-medium">No assignments found</p>
            <p className="text-sm text-muted-foreground mt-1">
              {filter === "all" && !searchQuery
                ? "Click 'Create Assignment' to add the first one"
                : `No ${filter !== "all" ? filter : ""} assignments match your search`}
            </p>
          </div>
        )}

        {/* Pagination Controls */}
        {filteredAssignments.length > 0 && (
          <div className="px-6 py-4 border-t flex flex-col sm:flex-row items-center justify-between gap-4 bg-muted/20">
            <div className="text-sm text-muted-foreground">
              Showing <span className="font-medium">{indexOfFirstItem + 1}</span> to{" "}
              <span className="font-medium">
                {Math.min(indexOfLastItem, filteredAssignments.length)}
              </span>{" "}
              of <span className="font-medium">{filteredAssignments.length}</span> results
            </div>
            <div className="flex items-center gap-1.5">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="gap-1 px-3"
              >
                <ChevronLeft className="w-4 h-4" />
                Previous
              </Button>
              <div className="flex items-center gap-1 mx-2">
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter((page) => {
                    // Show current page, first, last, and pages around current
                    return (
                      page === 1 ||
                      page === totalPages ||
                      Math.abs(page - currentPage) <= 1
                    );
                  })
                  .map((page, index, array) => (
                    <div key={page} className="flex items-center">
                      {index > 0 && array[index - 1] !== page - 1 && (
                        <span className="text-muted-foreground px-1">...</span>
                      )}
                      <button
                        onClick={() => setCurrentPage(page)}
                        className={`w-8 h-8 rounded-lg text-sm font-medium transition-all ${
                          currentPage === page
                            ? "bg-primary text-white shadow-sm"
                            : "hover:bg-muted text-muted-foreground"
                        }`}
                      >
                        {page}
                      </button>
                    </div>
                  ))}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="gap-1 px-3"
              >
                Next
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </motion.div>

      {/* Confirm Delete Modal */}
      {showDeleteModal && (
        <ConfirmDeleteModal
          title="Delete Assignment"
          message={`Are you sure you want to delete "${selectedAssignment?.title}"? This action cannot be undone.`}
          onConfirm={handleDelete}
          onCancel={() => {
            setShowDeleteModal(false);
            setSelectedAssignment(null);
          }}
          isLoading={isDeleting}
        />
      )}

      {/* Create / Edit Modal */}
      <BranchAdminAssignmentFormModal
        isOpen={showFormModal}
        onClose={() => {
          setShowFormModal(false);
          setSelectedAssignment(null);
        }}
        onSubmit={handleCreateOrUpdate}
        editingAssignment={selectedAssignment}
        isSubmitting={isSubmitting}
      />

      {/* Student Submissions Modal */}
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
            <SubmissionsSkeleton />
          ) : assignmentDetails ? (
            <div className="space-y-6">
              {/* Stat header */}
              <div className="flex items-center justify-between bg-muted/30 p-4 rounded-lg">
                <div className="text-sm">
                  <p className="text-muted-foreground">Class Statistics</p>
                  <div className="flex gap-4 mt-1">
                    <p>
                      <span className="font-bold">{assignmentDetails.totalStudents ?? "—"}</span>{" "}
                      Total Students
                    </p>
                    <p>
                      <span className="font-bold text-primary">
                        {assignmentDetails.submissionCount ?? 0}
                      </span>{" "}
                      Submissions
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Badge className="bg-primary/10 text-primary border-primary/20">
                    {assignmentDetails.classId?.name}
                  </Badge>
                  {assignmentDetails.subjectId?.name && (
                    <Badge variant="outline">{assignmentDetails.subjectId?.name}</Badge>
                  )}
                </div>
              </div>

              {/* Student roster */}
              <div>
                <h4 className="font-semibold mb-4 flex items-center gap-2 px-1">
                  <Users className="w-5 h-5 text-primary" />
                  Student Roster
                </h4>
                {assignmentDetails.studentStats && assignmentDetails.studentStats.length > 0 ? (
                  <div className="border rounded-xl overflow-hidden shadow-sm">
                    <Table>
                      <TableHeader className="bg-muted/50">
                        <TableRow>
                          <TableHead className="font-bold">Student</TableHead>
                          <TableHead className="font-bold text-center">Status</TableHead>
                          <TableHead className="font-bold text-right">Submitted At</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {assignmentDetails.studentStats.map((stu) => (
                          <TableRow key={stu._id} className="hover:bg-muted/30 transition-colors">
                            <TableCell>
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold overflow-hidden border border-white shadow-sm">
                                  {stu.profilePhoto ? (
                                    <img
                                      src={stu.profilePhoto}
                                      alt=""
                                      className="w-full h-full object-cover"
                                    />
                                  ) : (
                                    stu.fullName
                                      ?.split(" ")
                                      .map((n) => n[0])
                                      .join("")
                                  )}
                                </div>
                                <div>
                                  <p className="font-bold text-sm text-gray-900">{stu.fullName}</p>
                                  <p className="text-xs text-muted-foreground font-medium">
                                    GR No: {stu.rollNumber || "N/A"}
                                  </p>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="text-center">
                              {stu.submitted ? (
                                <Badge className="bg-green-100 text-green-700 border-green-200 font-bold uppercase text-[10px] tracking-tight">
                                  Submitted
                                </Badge>
                              ) : (
                                <Badge className="bg-red-50 text-red-700 border-red-100 font-bold uppercase text-[10px] tracking-tight">
                                  Missing
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell className="text-right">
                              {stu.submitted && stu.submission?.submittedAt ? (
                                <p className="text-xs font-semibold text-gray-600">
                                  {new Date(stu.submission.submittedAt).toLocaleDateString("en-GB", {
                                    day: "2-digit",
                                    month: "short",
                                    year: "numeric",
                                  })}
                                </p>
                              ) : (
                                <span className="text-xs text-muted-foreground">—</span>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
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
                  {selectedAssignment.teacher && (
                    <p className="text-sm text-muted-foreground mt-1">
                      Teacher:{" "}
                      {selectedAssignment.teacher.first_name}{" "}
                      {selectedAssignment.teacher.last_name}
                    </p>
                  )}
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
                    <p className="font-semibold">
                      {new Date(selectedAssignment.dueDate).toLocaleDateString()}
                    </p>
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
              <div className="bg-muted/30 p-4 rounded-xl text-sm leading-relaxed whitespace-pre-wrap min-h-[80px]">
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
