"use client";
import React, { useState, useEffect } from "react";
import Modal from "@/components/ui/modal";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Dropdown from "@/components/ui/dropdown";
import { BookOpen, Plus, Trash2 } from "lucide-react";

export default function ExamFormModal({ exam, branches = [], classes = [], subjects = [], onSubmit, onClose }) {
  const [formData, setFormData] = useState({
    title: "",
    examType: "",
    branchId: "",
    classId: "",
    section: "",
    status: "scheduled",
    subjects: [],
  });
  const [errors, setErrors] = useState({});
  const [filteredClasses, setFilteredClasses] = useState(classes || []);
  const [filteredSubjects, setFilteredSubjects] = useState(subjects || []);

  useEffect(() => {
    if (exam) {
      setFormData({
        title: exam.title || "",
        examType: exam.examType || "",
        branchId: exam.branchId?._id || exam.branchId || "",
        classId: exam.classId?._id || exam.classId || "",
        section: exam.section || "",
        status: exam.status || "scheduled",
        subjects: exam.subjects || [],
      });
    }
  }, [exam]);

  useEffect(() => setFilteredClasses(classes || []), [classes]);
  useEffect(() => setFilteredSubjects(subjects || []), [subjects]);

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((p) => ({ ...p, [field]: null }));
  };

  const addSubject = () => {
    setFormData((prev) => ({
      ...prev,
      subjects: [
        ...prev.subjects,
        {
          subjectId: "",
          date: "",
          startTime: "",
          endTime: "",
          duration: 60,
          totalMarks: 100,
          passingMarks: 40,
          room: "",
          instructions: "",
          syllabus: "",
        },
      ],
    }));
  };

  const removeSubject = (index) => {
    setFormData((prev) => ({ ...prev, subjects: prev.subjects.filter((_, i) => i !== index) }));
  };

  const updateSubject = (index, field, value) => {
    setFormData((prev) => ({
      ...prev,
      subjects: prev.subjects.map((s, i) => (i === index ? { ...s, [field]: value } : s)),
    }));
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.title || !formData.title.trim()) newErrors.title = "Exam title is required";
    if (!formData.examType) newErrors.examType = "Exam type is required";
    if (!formData.classId) newErrors.classId = "Class is required";
    if (!formData.subjects || formData.subjects.length === 0) newErrors.subjects = "At least one subject is required";

    (formData.subjects || []).forEach((subject, idx) => {
      if (!subject.subjectId) newErrors[`subject_${idx}_subjectId`] = "Subject is required";
      if (!subject.date) newErrors[`subject_${idx}_date`] = "Date is required";
      if (!subject.startTime) newErrors[`subject_${idx}_startTime`] = "Start time is required";
      if (!subject.endTime) newErrors[`subject_${idx}_endTime`] = "End time is required";
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    onSubmit(formData);
  };

  return (
    <Modal open={true} onClose={onClose} title={exam ? "Edit Exam" : "Create New Exam"} size="lg" footer={null}>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="title">Exam Title *</Label>
            <Input id="title" value={formData.title} onChange={(e) => handleInputChange("title", e.target.value)} />
            {errors.title && <p className="text-red-500 text-sm">{errors.title}</p>}
          </div>

          <div>
            <Label>Exam Type *</Label>
            <Dropdown
              value={formData.examType}
              onChange={(e) => handleInputChange("examType", e.target.value)}
              options={[
                { value: "", label: "Select exam type" },
                { value: "midterm", label: "Midterm" },
                { value: "final", label: "Final" },
                { value: "quiz", label: "Quiz" },
                { value: "unit_test", label: "Unit Test" },
              ]}
            />
            {errors.examType && <p className="text-red-500 text-sm">{errors.examType}</p>}
          </div>

          <div>
            <Label>Branch (Optional)</Label>
            <Dropdown
              value={formData.branchId}
              onChange={(e) => handleInputChange("branchId", e.target.value)}
              options={[{ value: "", label: "Select branch" }, ...(branches || []).map((b) => ({ value: b._id, label: b.name }))]}
            />
          </div>

          <div>
            <Label>Class *</Label>
            <Dropdown
              value={formData.classId}
              onChange={(e) => handleInputChange("classId", e.target.value)}
              options={[{ value: "", label: "Select class" }, ...(filteredClasses || []).map((c) => ({ value: c._id, label: c.name }))]}
            />
            {errors.classId && <p className="text-red-500 text-sm">{errors.classId}</p>}
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between">
            <Label className="text-lg">Exam Subjects</Label>
            <Button type="button" variant="outline" size="sm" onClick={addSubject}>
              <Plus className="w-4 h-4 mr-2" /> Add Subject
            </Button>
          </div>

          {(formData.subjects || []).map((subject, idx) => (
            <Card key={idx} className="mt-4">
              <CardContent>
                <div className="flex justify-between items-center mb-3">
                  <div className="font-medium">Subject {idx + 1}</div>
                  <Button type="button" variant="ghost" onClick={() => removeSubject(idx)}>
                    <Trash2 />
                  </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <Label>Subject *</Label>
                    <Dropdown
                      value={subject.subjectId}
                      onChange={(e) => updateSubject(idx, "subjectId", e.target.value)}
                      options={[{ value: "", label: "Select subject" }, ...(filteredSubjects || []).map((s) => ({ value: s._id, label: s.name }))]}
                    />
                  </div>

                  <div>
                    <Label>Date *</Label>
                    <Input type="date" value={subject.date} onChange={(e) => updateSubject(idx, "date", e.target.value)} />
                  </div>

                  <div>
                    <Label>Start Time *</Label>
                    <Input type="time" value={subject.startTime} onChange={(e) => updateSubject(idx, "startTime", e.target.value)} />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {(formData.subjects || []).length === 0 && (
            <div className="text-center py-6 text-gray-500">
              <BookOpen className="w-12 h-12 mx-auto mb-3" />
              <div>No subjects added yet.</div>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit">{exam ? "Update Exam" : "Create Exam"}</Button>
        </div>
      </form>
    </Modal>
  );
}