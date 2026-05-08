"use client";

import { useState, useEffect } from "react";
import Modal from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import Dropdown from "@/components/ui/dropdown";
import apiClient from "@/lib/api-client";
import { API_ENDPOINTS } from "@/constants/api-endpoints";
import { toast } from "sonner";
import {
  Loader2,
  FileText,
  Users,
  Calendar,
  CheckCircle,
  Upload,
  BookOpen,
  Layers,
} from "lucide-react";
import DatePicker from "@/components/ui/date-picker";

export default function BranchAdminAssignmentFormModal({
  isOpen,
  onClose,
  onSubmit,
  editingAssignment = null,
  isSubmitting = false,
}) {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    group_id: "",
    class_id: "",
    section_id: "",
    subject_id: "",
    due_date: "",
    total_marks: 100,
    is_active: true,
    attachment: null,
  });

  // Cascaded data
  const [groups, setGroups] = useState([]);
  const [classes, setClasses] = useState([]);
  const [sections, setSections] = useState([]);
  const [subjects, setSubjects] = useState([]);

  // Loading states
  const [loadingGroups, setLoadingGroups] = useState(false);
  const [loadingClasses, setLoadingClasses] = useState(false);
  const [loadingSections, setLoadingSections] = useState(false);
  const [loadingSubjects, setLoadingSubjects] = useState(false);

  /* ─── Load groups when modal opens ─── */
  useEffect(() => {
    if (!isOpen) return;
    loadGroups();

    if (editingAssignment) {
      setFormData({
        title: editingAssignment.title || "",
        description: editingAssignment.description || "",
        group_id: editingAssignment.group_id || editingAssignment.classId?.group_id || "",
        class_id: editingAssignment.class_id || editingAssignment.classId?.id || "",
        section_id: editingAssignment.section_id || editingAssignment.sectionId?.id || "",
        subject_id: editingAssignment.subject_id || editingAssignment.subjectId?.id || "",
        due_date: editingAssignment.dueDate
          ? new Date(editingAssignment.dueDate).toISOString().split("T")[0]
          : "",
        total_marks: editingAssignment.totalMarks || 100,
        is_active:
          editingAssignment.isActive !== undefined ? editingAssignment.isActive : true,
        attachment: null,
      });
    } else {
      setFormData({
        title: "",
        description: "",
        group_id: "",
        class_id: "",
        section_id: "",
        subject_id: "",
        due_date: "",
        total_marks: 100,
        is_active: true,
        attachment: null,
      });
      setClasses([]);
      setSections([]);
      setSubjects([]);
    }
  }, [isOpen, editingAssignment]);

  /* ─── When group changes → load classes ─── */
  useEffect(() => {
    if (formData.group_id) {
      loadClasses(formData.group_id);
    } else {
      setClasses([]);
      setSections([]);
      setSubjects([]);
    }
  }, [formData.group_id]);

  /* ─── When class changes → derive sections & subjects from class data ─── */
  useEffect(() => {
    if (formData.class_id) {
      const selectedClass = classes.find((c) => String(c.id) === String(formData.class_id));
      if (selectedClass) {
        setSections(selectedClass.sections || []);
        setSubjects(selectedClass.subjects || []);
      } else {
        setSections([]);
        setSubjects([]);
      }
    } else {
      setSections([]);
      setSubjects([]);
    }
  }, [formData.class_id, classes]);

  /* ─── API loaders ─── */
  const loadGroups = async () => {
    try {
      setLoadingGroups(true);
      const response = await apiClient.get("/api/groups");
      // Groups route returns plain array
      const data = Array.isArray(response)
        ? response
        : response.success
        ? response.data
        : [];
      setGroups(data);
    } catch (err) {
      console.error("Error loading groups:", err);
      toast.error("Failed to load groups");
    } finally {
      setLoadingGroups(false);
    }
  };

  const loadClasses = async (groupId) => {
    try {
      setLoadingClasses(true);
      const response = await apiClient.get(`/api/classes?group_id=${groupId}`);
      // Classes route returns plain array (with sections & subjects included)
      const data = Array.isArray(response)
        ? response
        : response.success
        ? response.data
        : [];
      setClasses(data);
    } catch (err) {
      console.error("Error loading classes:", err);
      setClasses([]);
    } finally {
      setLoadingClasses(false);
    }
  };

  /* ─── Handlers ─── */
  const handleChange = (e) => {
    const { name, value, type, checked, files } = e.target;

    if (type === "file") {
      setFormData((prev) => ({ ...prev, [name]: files[0] }));
      return;
    }

    if (name === "group_id") {
      setFormData((prev) => ({
        ...prev,
        group_id: value,
        class_id: "",
        section_id: "",
        subject_id: "",
      }));
      return;
    }

    if (name === "class_id") {
      setFormData((prev) => ({
        ...prev,
        class_id: value,
        section_id: "",
        subject_id: "",
      }));
      return;
    }

    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (
      !formData.group_id ||
      !formData.class_id ||
      !formData.subject_id ||
      !formData.title ||
      !formData.due_date
    ) {
      toast.error("Please fill all required fields (Group, Class, Subject, Title, Due Date)");
      return;
    }
    // Section is optional — some classes may not have sections
    onSubmit(formData);
  };

  /* ─── Render ─── */
  return (
    <Modal
      open={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2">
          <div className="p-2 bg-primary/10 rounded-lg">
            <BookOpen className="w-5 h-5 text-primary" />
          </div>
          <span>{editingAssignment ? "Edit Assignment" : "Create New Assignment"}</span>
        </div>
      }
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-5 py-4">

        {/* ── Assignment Title ── */}
        <div className="space-y-2">
          <label className="text-sm font-semibold flex items-center gap-2">
            <FileText className="w-4 h-4 text-primary" />
            Assignment Title *
          </label>
          <input
            name="title"
            value={formData.title}
            onChange={handleChange}
            className="w-full p-2.5 bg-muted/30 border rounded-lg focus:ring-2 focus:ring-primary/20 outline-none transition-all"
            placeholder="e.g. Chapter 5 Practice Problems"
            required
          />
        </div>

        {/* ── Cascade: Group → Class → Section + Subject ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

          {/* Group */}
          <div className="space-y-2">
            <label className="text-sm font-semibold flex items-center gap-2">
              <Layers className="w-4 h-4 text-primary" />
              Group *
            </label>
            <Dropdown
              name="group_id"
              value={formData.group_id}
              onChange={handleChange}
              options={groups.map((g) => ({ value: g.id, label: g.name }))}
              placeholder={loadingGroups ? "Loading groups…" : "Select Group"}
              required
            />
          </div>

          {/* Class */}
          <div className="space-y-2">
            <label className="text-sm font-semibold flex items-center gap-2">
              <Users className="w-4 h-4 text-primary" />
              Class *
            </label>
            <Dropdown
              name="class_id"
              value={formData.class_id}
              onChange={handleChange}
              options={classes.map((c) => ({ value: c.id, label: c.name }))}
              placeholder={
                !formData.group_id
                  ? "Select a group first"
                  : loadingClasses
                  ? "Loading classes…"
                  : classes.length === 0
                  ? "No classes in this group"
                  : "Select Class"
              }
              disabled={!formData.group_id || loadingClasses}
              required
            />
          </div>

          {/* Section */}
          <div className="space-y-2">
            <label className="text-sm font-semibold flex items-center gap-2">
              <Users className="w-4 h-4 text-primary" />
              Section
              <span className="text-xs text-muted-foreground font-normal">(optional)</span>
            </label>
            <Dropdown
              name="section_id"
              value={formData.section_id}
              onChange={handleChange}
              options={sections.map((s) => ({ value: s.id, label: s.name }))}
              placeholder={
                !formData.class_id
                  ? "Select a class first"
                  : sections.length === 0
                  ? "No sections available"
                  : "Select Section"
              }
              disabled={!formData.class_id}
            />
          </div>

          {/* Subject */}
          <div className="space-y-2">
            <label className="text-sm font-semibold flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-primary" />
              Subject *
            </label>
            <Dropdown
              name="subject_id"
              value={formData.subject_id}
              onChange={handleChange}
              options={subjects.map((s) => ({ value: s.id, label: s.name }))}
              placeholder={
                !formData.class_id
                  ? "Select a class first"
                  : subjects.length === 0
                  ? "No subjects available"
                  : "Select Subject"
              }
              disabled={!formData.class_id}
              required
            />
          </div>

          {/* Due Date */}
          <div className="space-y-2">
            <DatePicker
              label="Due Date"
              name="due_date"
              value={formData.due_date}
              onChange={handleChange}
              required
              disablePast={true}
              disableFuture={false}
              placeholder="Select deadline"
            />
          </div>

          {/* Total Marks */}
          <div className="space-y-2">
            <label className="text-sm font-semibold flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-primary" />
              Total Marks
            </label>
            <input
              type="number"
              name="total_marks"
              value={formData.total_marks}
              onChange={handleChange}
              className="w-full p-2.5 bg-muted/30 border rounded-lg focus:ring-2 focus:ring-primary/20 outline-none transition-all"
              min="0"
            />
          </div>
        </div>

        {/* ── Description ── */}
        <div className="space-y-2">
          <label className="text-sm font-semibold flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-primary" />
            Description / Instructions
          </label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            className="w-full p-2.5 bg-muted/30 border rounded-lg min-h-[110px] focus:ring-2 focus:ring-primary/20 outline-none transition-all resize-none"
            placeholder="Provide detailed instructions for students…"
          />
        </div>

        {/* ── Attachment ── */}
        <div className="space-y-2">
          <label className="text-sm font-semibold flex items-center gap-2">
            <Upload className="w-4 h-4 text-primary" />
            Attachment (Optional)
          </label>
          <div className="relative">
            <input
              type="file"
              name="attachment"
              onChange={handleChange}
              className="hidden"
              id="ba-assignment-file"
            />
            <label
              htmlFor="ba-assignment-file"
              className="flex items-center justify-center gap-2 w-full p-4 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted/50 transition-all group"
            >
              <Upload className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
              <span className="text-sm text-muted-foreground group-hover:text-primary transition-colors">
                {formData.attachment ? formData.attachment.name : "Click to upload files"}
              </span>
            </label>
          </div>
        </div>

        {/* ── Footer ── */}
        <div className="flex items-center justify-between pt-4 border-t">
          <div className="flex items-center space-x-2 bg-muted/30 p-2 px-3 rounded-lg border border-transparent hover:border-primary/20 transition-all">
            <input
              type="checkbox"
              id="ba_is_active"
              name="is_active"
              checked={formData.is_active}
              onChange={handleChange}
              className="h-4 w-4 text-primary border-gray-300 rounded focus:ring-primary cursor-pointer"
            />
            <label htmlFor="ba_is_active" className="text-sm font-medium cursor-pointer select-none">
              Published & Visible to Students
            </label>
          </div>

          <div className="flex gap-3">
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting} className="min-w-[140px]">
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving…
                </>
              ) : editingAssignment ? (
                "Update Assignment"
              ) : (
                "Create Assignment"
              )}
            </Button>
          </div>
        </div>
      </form>
    </Modal>
  );
}
