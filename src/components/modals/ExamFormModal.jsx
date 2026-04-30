"use client";
import React, { useState, useEffect } from "react";
import Modal from "@/components/ui/modal";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Dropdown from "@/components/ui/dropdown";
import DatePicker from "@/components/ui/date-picker";
import TimePicker from "@/components/ui/time-picker";
import { BookOpen, Plus, Trash2, Clock, Calendar } from "lucide-react";
import { toast } from "sonner";

export default function ExamFormModal({
  exam,
  branches = [],
  classes = [],
  sections = [],
  subjects = [],
  groups = [],
  academicYears = [],
  onSubmit,
  onClose,
  loading = false,
}) {
  const [formData, setFormData] = useState({
    title: "",
    exam_type: "midterm",
    branch_id: "",
    class_id: "",
    section_id: "",
    group_id: "",
    academic_year_id: "",
    status: "scheduled",
    subjects: [],
    description: "",
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (exam) {
      setFormData({
        title: exam.title || "",
        exam_type: exam.exam_type || "midterm",
        branch_id: exam.branch_id || "",
        class_id: exam.class_id || "",
        section_id: exam.section_id || "",
        group_id: exam.group_id || "",
        academic_year_id: exam.academic_year_id || "",
        status: exam.status || "scheduled",
        subjects: exam.subjects || [],
        description: exam.description || "",
      });
    } else {
      // Set defaults for new exam
      setFormData((prev) => ({
        ...prev,
        branch_id: branches[0]?.id || "",
        academic_year_id: academicYears.find((y) => y.is_current)?.id || "",
        subjects: [
          {
            subject_id: "",
            date: "",
            start_time: "09:00",
            end_time: "11:00",
            total_marks: 100,
            passing_marks: 40,
          },
        ],
      }));
    }
  }, [exam, branches, academicYears]);

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
          subject_id: "",
          date: "",
          start_time: "09:00",
          end_time: "11:00",
          total_marks: 100,
          passing_marks: 40,
        },
      ],
    }));
  };

  const removeSubject = (index) => {
    if (formData.subjects.length <= 1) {
      toast.error("At least one subject is required");
      return;
    }
    setFormData((prev) => ({
      ...prev,
      subjects: prev.subjects.filter((_, i) => i !== index),
    }));
  };

  const updateSubject = (index, field, value) => {
    setFormData((prev) => ({
      ...prev,
      subjects: prev.subjects.map((s, i) =>
        i === index ? { ...s, [field]: value } : s,
      ),
    }));
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.title?.trim()) newErrors.title = "Exam title is required";
    if (!formData.academic_year_id)
      newErrors.academic_year_id = "Academic Year is required";
    if (!formData.group_id) newErrors.group_id = "Group is required";
    if (!formData.class_id) newErrors.class_id = "Class is required";
    if (!formData.section_id) newErrors.section_id = "Section is required";

    formData.subjects.forEach((s, idx) => {
      if (!s.subject_id) newErrors[`subject_${idx}_id`] = "Required";
      if (!s.date) newErrors[`subject_${idx}_date`] = "Required";
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    onSubmit({ ...formData });
  };

  // Cascading filters
  const filteredClasses = classes.filter(
    (c) => c.group_id === formData.group_id,
  );
  const selectedClassObj = classes.find((c) => c.id === formData.class_id);
  const filteredSections =
    selectedClassObj?.sections ||
    sections.filter((s) => s.class_id === formData.class_id);
  const filteredSubjects =
    selectedClassObj?.subjects ||
    subjects.filter((s) => s.class_id === formData.class_id);

  return (
    <Modal
      open={true}
      onClose={onClose}
      title={exam ? "Edit Exam" : "Schedule New Exam"}
      size="xl"
      footer={
        <div className="flex justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            form="exam-form"
            disabled={loading}
            className="bg-indigo-600 hover:bg-indigo-700 shadow-md"
          >
            {loading ? "Processing..." : exam ? "Update Exam" : "Create Exam"}
          </Button>
        </div>
      }
    >
      <form
        id="exam-form"
        onSubmit={handleSubmit}
        className="space-y-8 pr-2 custom-scrollbar pb-80 min-h-[500px]"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="space-y-2 col-span-1 md:col-span-2 lg:col-span-3">
            <Label
              htmlFor="title"
              className="text-sm font-semibold text-slate-700"
            >
              Exam Title *
            </Label>
            <Input
              id="title"
              placeholder="e.g. Mid-Term Examination 2024"
              value={formData.title}
              onChange={(e) => handleInputChange("title", e.target.value)}
              className={`h-11 ${errors.title ? "border-red-500 ring-red-50" : "border-slate-200"}`}
            />
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-semibold text-slate-700">
              Academic Year *
            </Label>
            <Dropdown
              value={formData.academic_year_id}
              onChange={(e) =>
                handleInputChange("academic_year_id", e.target.value)
              }
              options={
                Array.isArray(academicYears) && academicYears.length > 0
                  ? academicYears.map((y) => ({ value: y.id, label: y.name }))
                  : [
                      {
                        value: "",
                        label: "No academic years found",
                        disabled: true,
                      },
                    ]
              }
              placeholder="Select Year"
              className={errors.academic_year_id ? "border-red-500" : ""}
            />
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-semibold text-slate-700">
              Group *
            </Label>
            <Dropdown
              value={formData.group_id}
              onChange={(e) => {
                const val = e.target.value;
                setFormData({
                  ...formData,
                  group_id: val,
                  class_id: "",
                  section_id: "",
                });
              }}
              options={
                groups.length > 0
                  ? groups.map((g) => ({ value: g.id, label: g.name }))
                  : [{ value: "", label: "No record found", disabled: true }]
              }
              placeholder="Select Group"
              className={errors.group_id ? "border-red-500" : ""}
            />
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-semibold text-slate-700">
              Class *
            </Label>
            <Dropdown
              value={formData.class_id}
              onChange={(e) => {
                const val = e.target.value;
                setFormData({ ...formData, class_id: val, section_id: "" });
              }}
              options={(() => {
                if (!formData.group_id)
                  return [
                    {
                      value: "",
                      label: "Please select Group first",
                      disabled: true,
                    },
                  ];
                return filteredClasses.length > 0
                  ? filteredClasses.map((c) => ({ value: c.id, label: c.name }))
                  : [{ value: "", label: "No record found", disabled: true }];
              })()}
              disabled={!formData.group_id}
              placeholder="Select Class"
              className={errors.class_id ? "border-red-500" : ""}
            />
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-semibold text-slate-700">
              Section *
            </Label>
            <Dropdown
              value={formData.section_id}
              onChange={(e) => handleInputChange("section_id", e.target.value)}
              options={(() => {
                if (!formData.class_id)
                  return [
                    {
                      value: "",
                      label: "Please select Class first",
                      disabled: true,
                    },
                  ];
                return filteredSections.length > 0
                  ? filteredSections.map((s) => ({
                      value: s.id,
                      label: s.name,
                    }))
                  : [{ value: "", label: "No record found", disabled: true }];
              })()}
              disabled={!formData.class_id}
              placeholder="Select Section"
              className={errors.section_id ? "border-red-500" : ""}
            />
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-semibold text-slate-700">
              Exam Type *
            </Label>
            <Dropdown
              value={formData.exam_type}
              onChange={(e) => handleInputChange("exam_type", e.target.value)}
              options={[
                { value: "midterm", label: "Midterm" },
                { value: "final", label: "Final" },
                { value: "quiz", label: "Quiz" },
                { value: "unit_test", label: "Unit Test" },
                { value: "mock", label: "Mock Exam" },
              ]}
              placeholder="Select Exam Type"
            />
          </div>
        </div>

        <div className="space-y-6 pt-6 border-t border-slate-200">
          <div className="flex items-center justify-between bg-indigo-50/50 p-4 rounded-xl border border-indigo-100/50 shadow-sm">
            <div>
              <h3 className="text-lg font-bold flex items-center gap-2 text-indigo-900">
                <BookOpen className="w-5 h-5 text-indigo-600" />
                Subjects Schedule
              </h3>
              <p className="text-xs text-indigo-600/70 font-medium mt-0.5">
                Manage exam dates and timings for each subject
              </p>
            </div>
            <Button
              type="button"
              variant="default"
              size="sm"
              onClick={addSubject}
              className="h-10 bg-indigo-600 hover:bg-indigo-700 shadow-md px-4 transition-all hover:scale-105 active:scale-95"
            >
              <Plus className="w-4 h-4 mr-1.5" /> Add Subject
            </Button>
          </div>

          <div className="space-y-6">
            {formData.subjects.map((subject, idx) => (
              <Card
                key={idx}
                className="relative border-slate-200 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-indigo-600 rounded-l-lg"></div>
                <CardContent className="p-5">
                  <div className="flex justify-between items-center mb-6 border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-3">
                      <span className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-sm">
                        {idx + 1}
                      </span>
                      <span className="text-sm font-bold text-slate-700 uppercase tracking-wider">
                        Subject Details
                      </span>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeSubject(idx)}
                      className="h-8 w-8 p-0 text-red-500 hover:text-red-600 hover:bg-red-50 rounded-full"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold text-slate-500 uppercase tracking-tight">
                        Subject *
                      </Label>
                      <Dropdown
                        value={subject.subject_id}
                        onChange={(e) =>
                          updateSubject(idx, "subject_id", e.target.value)
                        }
                        options={(() => {
                          if (!formData.class_id)
                            return [
                              {
                                value: "",
                                label: "Select Class first",
                                disabled: true,
                              },
                            ];

                          // Get IDs of subjects already selected in other rows
                          const otherSelectedIds = formData.subjects
                            .filter((_, i) => i !== idx)
                            .map((s) => s.subject_id)
                            .filter((id) => !!id);

                          return filteredSubjects.length > 0
                            ? filteredSubjects.map((s) => ({
                                value: s.id,
                                label: s.name,
                                disabled: otherSelectedIds.includes(s.id), // Disable if already picked
                              }))
                            : [
                                {
                                  value: "",
                                  label: "No record found",
                                  disabled: true,
                                },
                              ];
                        })()}
                        disabled={!formData.class_id}
                        placeholder="Select Subject"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <DatePicker
                        label="Date *"
                        value={subject.date}
                        onChange={(e) =>
                          updateSubject(idx, "date", e.target.value)
                        }
                        className="h-10"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <TimePicker
                          label="Start Time"
                          value={subject.start_time}
                          onChange={(val) =>
                            updateSubject(idx, "start_time", val)
                          }
                        />
                      </div>
                      <div className="space-y-1.5">
                        <TimePicker
                          label="End Time"
                          value={subject.end_time}
                          onChange={(val) =>
                            updateSubject(idx, "end_time", val)
                          }
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold text-slate-500 uppercase tracking-tight">
                        Total Marks
                      </Label>
                      <Input
                        type="number"
                        value={subject.total_marks}
                        onChange={(e) =>
                          updateSubject(idx, "total_marks", e.target.value)
                        }
                        className="h-10 border-slate-200 focus:border-indigo-500"
                        placeholder="100"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold text-slate-500 uppercase tracking-tight">
                        Passing Marks
                      </Label>
                      <Input
                        type="number"
                        value={subject.passing_marks}
                        onChange={(e) =>
                          updateSubject(idx, "passing_marks", e.target.value)
                        }
                        className="h-10 border-slate-200 focus:border-indigo-500"
                        placeholder="40"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold text-slate-500 uppercase tracking-tight">
                        Room (Optional)
                      </Label>
                      <Input
                        placeholder="e.g. Room 101"
                        value={subject.room || ""}
                        onChange={(e) =>
                          updateSubject(idx, "room", e.target.value)
                        }
                        className="h-10 border-slate-200 focus:border-indigo-500"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </form>
    </Modal>
  );
}
