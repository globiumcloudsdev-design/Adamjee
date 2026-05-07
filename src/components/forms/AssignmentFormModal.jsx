"use client";

import { useState, useEffect } from "react";
import Modal from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import Dropdown from "@/components/ui/dropdown";
import apiClient from "@/lib/api-client";
import { API_ENDPOINTS } from "@/constants/api-endpoints";
import { toast } from "sonner";
import { Loader2, FileText, Users, Calendar, CheckCircle, Upload, BookOpen } from "lucide-react";

export default function AssignmentFormModal({
  isOpen,
  onClose,
  onSubmit,
  editingAssignment = null,
  isSubmitting = false,
}) {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    class_id: "",
    section_id: "",
    subject_id: "",
    due_date: "",
    total_marks: 100,
    is_active: true,
    attachment: null,
  });

  const [myClasses, setMyClasses] = useState([]);
  const [loadingClasses, setLoadingClasses] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadMyClasses();
      if (editingAssignment) {
        setFormData({
          title: editingAssignment.title || "",
          description: editingAssignment.description || "",
          class_id: editingAssignment.class_id || (editingAssignment.class?.id || ""),
          section_id: editingAssignment.section_id || (editingAssignment.section?.id || ""),
          subject_id: editingAssignment.subject_id || (editingAssignment.subject?.id || ""),
          due_date: editingAssignment.dueDate ? new Date(editingAssignment.dueDate).toISOString().split('T')[0] : "",
          total_marks: editingAssignment.totalMarks || 100,
          is_active: editingAssignment.isActive !== undefined ? editingAssignment.isActive : true,
          attachment: null,
        });
      } else {
        setFormData({
          title: "",
          description: "",
          class_id: "",
          section_id: "",
          subject_id: "",
          due_date: "",
          total_marks: 100,
          is_active: true,
          attachment: null,
        });
      }
    }
  }, [isOpen, editingAssignment]);

  const loadMyClasses = async () => {
    try {
      setLoadingClasses(true);
      const response = await apiClient.get(API_ENDPOINTS.TEACHER.MY_CLASSES.LIST);
      if (response.success) {
        setMyClasses(response.data || []);
      }
    } catch (error) {
      console.error("Error loading classes:", error);
      toast.error("Failed to load your assigned classes");
    } finally {
      setLoadingClasses(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked, files } = e.target;
    if (type === 'file') {
      setFormData(prev => ({ ...prev, [name]: files[0] }));
    } else {
      setFormData((prev) => ({ 
        ...prev, 
        [name]: type === 'checkbox' ? checked : value 
      }));
    }
  };

  const handleClassChange = (e) => {
    const selectedId = e.target.value;
    const selectedClass = myClasses.find(c => c._id === selectedId);
    if (selectedClass) {
      setFormData(prev => ({
        ...prev,
        class_id: selectedClass.classId,
        section_id: selectedClass.sectionId,
        subject_id: selectedClass.subjectId,
      }));
    } else {
      setFormData(prev => ({ ...prev, class_id: selectedId }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.class_id || !formData.subject_id || !formData.title || !formData.due_date) {
      toast.error("Please fill in all required fields");
      return;
    }
    
    // For now, we'll just pass the JSON. If file upload is needed, 
    // we would use FormData here.
    onSubmit(formData);
  };

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
      <form onSubmit={handleSubmit} className="space-y-6 py-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left Column */}
          <div className="space-y-4">
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
                placeholder="e.g. Weekly Algebra Quiz"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold flex items-center gap-2">
                <Users className="w-4 h-4 text-primary" />
                Class & Subject *
              </label>
              <Dropdown
                name="class_selection"
                value={myClasses.find(c => c.classId === formData.class_id && c.sectionId === formData.section_id && c.subjectId === formData.subject_id)?._id || ""}
                onChange={handleClassChange}
                options={myClasses.map(c => ({
                  value: c._id,
                  label: `${c.className} (${c.sectionName}) - ${c.subject}`
                }))}
                placeholder={loadingClasses ? "Loading classes..." : "Select Class & Subject"}
                className="w-full p-2.5 bg-muted/30 border rounded-lg focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-semibold flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-primary" />
                  Due Date *
                </label>
                <input
                  type="date"
                  name="due_date"
                  value={formData.due_date}
                  onChange={handleChange}
                  className="w-full p-2.5 bg-muted/30 border rounded-lg focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                  required
                />
              </div>
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
          </div>

          {/* Right Column */}
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-semibold flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-primary" />
                Description / Instructions
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                className="w-full p-2.5 bg-muted/30 border rounded-lg min-h-[150px] focus:ring-2 focus:ring-primary/20 outline-none transition-all resize-none"
                placeholder="Provide detailed instructions for your students..."
              />
            </div>

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
                  id="assignment-file"
                />
                <label
                  htmlFor="assignment-file"
                  className="flex items-center justify-center gap-2 w-full p-4 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted/50 transition-all group"
                >
                  <Upload className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                  <span className="text-sm text-muted-foreground group-hover:text-primary transition-colors">
                    {formData.attachment ? formData.attachment.name : "Click to upload files"}
                  </span>
                </label>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between pt-4 border-t">
          <div className="flex items-center space-x-2 bg-muted/30 p-2 px-3 rounded-lg border border-transparent hover:border-primary/20 transition-all">
            <input
              type="checkbox"
              id="is_active"
              name="is_active"
              checked={formData.is_active}
              onChange={handleChange}
              className="h-4 w-4 text-primary border-gray-300 rounded focus:ring-primary cursor-pointer"
            />
            <label htmlFor="is_active" className="text-sm font-medium cursor-pointer select-none">
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
                  Saving...
                </>
              ) : (
                editingAssignment ? "Update Assignment" : "Create Assignment"
              )}
            </Button>
          </div>
        </div>
      </form>
    </Modal>
  );
}
