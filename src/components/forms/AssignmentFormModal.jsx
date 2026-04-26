'use client';

import React, { useState, useEffect } from 'react';
import Modal from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import Input from '@/components/ui/input';
import Textarea from '@/components/ui/textarea';
import Dropdown from '@/components/ui/dropdown';
import { Checkbox } from '@/components/ui/checkbox';
import { FileText, Calendar, Clock, Upload, X, Plus, BookOpen, Video, Link as LinkIcon } from 'lucide-react';
import apiClient from '@/lib/api-client';
import { API_ENDPOINTS } from '@/constants/api-endpoints';
import { toast } from 'sonner';

const AssignmentFormModal = ({
  isOpen,
  onClose,
  onSubmit,
  editingAssignment = null,
  isSubmitting = false,
}) => {
  const [myClasses, setMyClasses] = useState([]);
  const [loadingClasses, setLoadingClasses] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    classId: '',
    subjectId: '',
    dueDate: '',
    totalMarks: '',
    allowLateSubmission: false,
    videoUrl: '',
    sectionId: '',
    status: 'published',
    attachments: [],
  });

  useEffect(() => {
    if (isOpen) {
      fetchMyClasses();
        if (editingAssignment) {
        setFormData({
          title: editingAssignment.title || '',
          description: editingAssignment.description || '',
          classId: editingAssignment.classId?._id || editingAssignment.classId || '',
          subjectId: editingAssignment.subjectId?._id || editingAssignment.subjectId || '',
          dueDate: editingAssignment.dueDate ? new Date(editingAssignment.dueDate).toISOString().split('T')[0] : '',
          totalMarks: editingAssignment.totalMarks || '',
          allowLateSubmission: !!editingAssignment.allowLateSubmission,
          videoUrl: editingAssignment.videoUrl || '',
          sectionId: editingAssignment.sectionId || '',
          status: editingAssignment.status || 'published',
          attachments: editingAssignment.attachments || [],
        });
        setSelectedFiles([]);
      } else {
        setFormData({
          title: '',
          description: '',
          classId: '',
          subjectId: '',
          dueDate: '',
          totalMarks: '',
          allowLateSubmission: false,
          videoUrl: '',
          sectionId: '',
          status: 'published',
          attachments: [],
        });
        setSelectedFiles([]);
      }
    }
  }, [isOpen, editingAssignment]);

  const fetchMyClasses = async () => {
    try {
      setLoadingClasses(true);
      const response = await apiClient.get(API_ENDPOINTS.TEACHER.MY_CLASSES.LIST);
      if (response.success) {
        setMyClasses(response.data);
      }
    } catch (error) {
      console.error('Error fetching classes:', error);
      toast.error('Failed to load your classes');
    } finally {
      setLoadingClasses(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    setSelectedFiles(prev => [...prev, ...files]);
  };

  const removeSelectedFile = (index) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const removeExistingAttachment = (index) => {
    setFormData(prev => ({
      ...prev,
      attachments: prev.attachments.filter((_, i) => i !== index)
    }));
  };

  const handleClassChange = (e) => {
    const classId = e.target.value;
    setFormData(prev => ({ ...prev, classId, subjectId: '', sectionId: '' }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.classId || !formData.subjectId) {
      toast.error('Please select class and subject');
      return;
    }
    if (!formData.sectionId) {
      toast.error('Please select section');
      return;
    }

    // Create FormData to handle files
    const submissionData = new FormData();
    // Append basic fields explicitly with correct string conversion
    submissionData.append('title', formData.title || '');
    submissionData.append('description', formData.description || '');
    submissionData.append('classId', String(formData.classId || ''));
    submissionData.append('subjectId', String(formData.subjectId || ''));
    submissionData.append('sectionId', String(formData.sectionId || ''));
    submissionData.append('dueDate', formData.dueDate || '');
    submissionData.append('totalMarks', String(formData.totalMarks || ''));
    submissionData.append('allowLateSubmission', String(!!formData.allowLateSubmission));
    submissionData.append('status', String(formData.status || 'published'));
    submissionData.append('videoUrl', formData.videoUrl || '');
    submissionData.append('attachments', JSON.stringify(formData.attachments || []));

    // Append new files (will be handled server-side)
    selectedFiles.forEach((file) => {
      submissionData.append('files', file);
    });

    onSubmit(submissionData);
  };

  // Get unique classes for the dropdown
  const uniqueClasses = Array.from(new Set((myClasses || []).map(c => c.classId))).map(id => {
    const classObj = myClasses.find(c => c.classId === id);
    return { value: id, label: classObj?.className || 'Unknown Class' };
  });

  // Get subjects for the selected class
  const availableSubjects = (myClasses || [])
    .filter(c => c.classId === formData.classId)
    .map(c => ({ value: c.subjectId, label: c.subjectName }));

  // Get unique sections for the selected class from teacher's assigned classes
  const availableSections = Array.from(
    new Set(
      (myClasses || [])
        .filter(c => c.classId === formData.classId && c.section)
        .map(c => c.section)
    )
  ).map(section => ({ value: section, label: section }));

  return (
    <Modal
      open={isOpen}
      onClose={onClose}
      title={editingAssignment ? 'Edit Assignment' : 'Create New Assignment'}
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4 p-1">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Assignment Title"
            name="title"
            value={formData.title}
            onChange={handleInputChange}
            placeholder="e.g. Mathematics Chapter 1 Quiz"
            required
            icon={FileText}
          />
          
          <div className="grid grid-cols-2 gap-2">
            <Input
              label="Total Marks"
              name="totalMarks"
              type="number"
              value={formData.totalMarks}
              onChange={handleInputChange}
              placeholder="100"
              required
              icon={Plus}
            />
            <Input
              label="Due Date"
              name="dueDate"
              type="date"
              value={formData.dueDate}
              onChange={handleInputChange}
              required
              icon={Calendar}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Dropdown
            label="Select Class"
            name="classId"
            value={formData.classId}
            onChange={handleClassChange}
            options={[
              { value: '', label: 'Select Class' },
              ...uniqueClasses
            ]}
            required
          />
          
          <Dropdown
            label="Select Subject"
            name="subjectId"
            value={formData.subjectId}
            onChange={handleInputChange}
            options={[
              { value: '', label: 'Select Subject' },
              ...availableSubjects
            ]}
            required
            disabled={!formData.classId}
          />
        </div>

        {formData.classId && availableSections.length > 0 && (
          <Dropdown
            label="Select Section"
            name="sectionId"
            value={formData.sectionId}
            onChange={handleInputChange}
            options={[
              { value: '', label: 'Select Section' },
              ...availableSections
            ]}
            required
          />
        )}

        <Textarea
          label="Description / Instructions"
          name="description"
          value={formData.description}
          onChange={handleInputChange}
          placeholder="Enter assignment details, instructions, or questions..."
          rows={5}
        />

        <Dropdown
          label="Status"
          name="status"
          value={formData.status}
          onChange={handleInputChange}
          options={[
            { value: 'published', label: 'Published' },
            { value: 'draft', label: 'Draft' },
            { value: 'archived', label: 'Archived' },
          ]}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Video URL (Optional)"
            name="videoUrl"
            value={formData.videoUrl}
            onChange={handleInputChange}
            placeholder="e.g. https://youtube.com/..."
            icon={Video}
          />
          
          <div className="flex flex-col">
            <label className="text-sm text-gray-600 mb-1">Attachments</label>
            <div className="relative">
              <input
                type="file"
                multiple
                onChange={handleFileChange}
                className="hidden"
                id="assignment-files"
              />
              <label
                htmlFor="assignment-files"
                className="flex items-center justify-center gap-2 px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-all"
              >
                <Upload className="w-4 h-4 text-gray-500" />
                <span className="text-sm text-gray-600">Upload Files</span>
              </label>
            </div>
          </div>
        </div>

        {/* File Previews */}
        {(selectedFiles.length > 0 || formData.attachments.length > 0) && (
          <div className="space-y-2">
            <p className="text-xs font-medium text-gray-500 uppercase">Selected Files</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {/* Existing Attachments */}
              {formData.attachments.map((file, index) => (
                <div key={`existing-${index}`} className="flex items-center justify-between p-2 bg-blue-50 border border-blue-100 rounded-lg">
                  <div className="flex items-center gap-2 overflow-hidden">
                    <FileText className="w-4 h-4 text-blue-500 flex-shrink-0" />
                    <span className="text-xs text-blue-700 truncate">{file.name}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeExistingAttachment(index)}
                    className="p-1 hover:bg-blue-100 rounded-full text-blue-500"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
              {/* New Files */}
              {selectedFiles.map((file, index) => (
                <div key={`new-${index}`} className="flex items-center justify-between p-2 bg-green-50 border border-green-100 rounded-lg">
                  <div className="flex items-center gap-2 overflow-hidden">
                    <FileText className="w-4 h-4 text-green-500 flex-shrink-0" />
                    <span className="text-xs text-green-700 truncate">{file.name}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeSelectedFile(index)}
                    className="p-1 hover:bg-green-100 rounded-full text-green-500"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex items-center space-x-2 py-2">
          <input
            type="checkbox"
            id="allowLateSubmission"
            name="allowLateSubmission"
            checked={formData.allowLateSubmission}
            onChange={handleInputChange}
            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
          />
          <label htmlFor="allowLateSubmission" className="text-sm font-medium text-gray-700">
            Allow Late Submissions
          </label>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button variant="outline" type="button" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : editingAssignment ? 'Update Assignment' : 'Create Assignment'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default AssignmentFormModal;
