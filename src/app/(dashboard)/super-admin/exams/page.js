'use client';
import React, { useState, useEffect } from 'react';
import { useApi } from '@/hooks/useApi';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import Dropdown from '@/components/ui/dropdown';
import FullPageLoader from '@/components/ui/full-page-loader';
import Modal from '@/components/ui/modal';
import ButtonLoader from '@/components/ui/button-loader';
import ExamFormModal from '@/components/modals/ExamFormModal';
import ExamDetailsModal from '@/components/modals/ExamDetailsModal';
import ConfirmDeleteModal from '@/components/modals/ConfirmDeleteModal';
import { toast } from 'sonner';
import apiClient from '@/lib/api-client';
import { API_ENDPOINTS } from '@/constants/api-endpoints';
import {
  Plus,
  Search,
  Filter,
  Edit,
  Trash2,
  Eye,
  Calendar,
  BookOpen,
  Users,
  Building2,
  RefreshCw,
  FileText,
  Clock
} from 'lucide-react';

const EXAM_TYPES = [
  { value: 'midterm', label: 'Mid-Term' },
  { value: 'final', label: 'Final' },
  { value: 'quiz', label: 'Quiz' },
  { value: 'unit_test', label: 'Unit Test' },
  { value: 'mock', label: 'Mock Exam' },
  { value: 'surprise', label: 'Surprise Test' },
  { value: 'practical', label: 'Practical' },
  { value: 'oral', label: 'Oral' },
];

const EXAM_STATUS = [
  { value: 'scheduled', label: 'Scheduled' },
  { value: 'ongoing', label: 'Ongoing' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
  { value: 'postponed', label: 'Postponed' },
];

export default function SuperAdminExamsPage() {
  const [exams, setExams] = useState([]);
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [currentExam, setCurrentExam] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [classFilter, setClassFilter] = useState('');
  const [examTypeFilter, setExamTypeFilter] = useState('');
  const [branchFilter, setBranchFilter] = useState('all');
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, pages: 0 });
  const [branches, setBranches] = useState([]);

  // Form data for single exam creation/editing
  const [formData, setFormData] = useState({
    title: '',
    examType: 'midterm',
    status: 'scheduled',
    classId: '',
    subjects: [{
      subjectId: '',
      date: '',
      startTime: '',
      endTime: '',
      duration: 120,
      totalMarks: 100,
      passingMarks: 40,
      room: '',
      instructions: '',
      syllabus: '',
    }],
  });

  // Bulk exam creation state
  const [selectedClass, setSelectedClass] = useState('');
  const [examSchedule, setExamSchedule] = useState({
    examType: 'midterm',
    startDate: '',
    endDate: '',
    defaultDuration: 120,
    defaultTotalMarks: 100,
    defaultPassingMarks: 40,
    room: '',
    instructions: '',
    syllabus: '',
  });
  const [subjectExams, setSubjectExams] = useState([]);

  const { execute } = useApi();

  useEffect(() => {
    loadExams();
    loadBranches();
    loadClasses();
    loadSubjects();
  }, [pagination.page, statusFilter, examTypeFilter, branchFilter]);

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      if (pagination.page === 1) {
        loadExams();
      } else {
        setPagination(prev => ({ ...prev, page: 1 }));
      }
    }, 500);

    return () => clearTimeout(debounceTimer);
  }, [search]);

  // Fetch subjects when class is selected in the form
  useEffect(() => {
    if (formData.classId) {
      fetchSubjectsForClass(formData.classId);
    }
  }, [formData.classId]);

  const loadExams = async () => {
    try {
      setLoading(true);
      const params = {
        page: pagination.page,
        limit: pagination.limit,
        search: search || undefined,
        status: statusFilter !== 'all' ? statusFilter : undefined,
        examType: examTypeFilter !== 'all' ? examTypeFilter : undefined,
        branchId: branchFilter !== 'all' ? branchFilter : undefined
      };

      const response = await execute({
        method: 'GET',
        url: '/api/super-admin/exams',
        params
      });

      console.log('Exams API response:', response);
      if (response.success) {
        // Normalize different possible response shapes
        const respData = response.data ?? response;

        let examsList = [];
        let paginationData = pagination;

        if (Array.isArray(respData)) {
          examsList = respData;
        } else if (respData) {
          if (Array.isArray(respData.exams)) {
            examsList = respData.exams;
            paginationData = respData.pagination || paginationData;
          } else if (Array.isArray(respData.items)) {
            examsList = respData.items;
            paginationData = respData.pagination || paginationData;
          } else if (Array.isArray(response.exams)) {
            examsList = response.exams;
          } else if (Array.isArray(respData.data)) {
            examsList = respData.data;
          } else {
            // As a fallback, if respData has a top-level object with keys, try to find an array
            const possibleArray = Object.values(respData).find(v => Array.isArray(v));
            examsList = possibleArray || [];
            // try to extract pagination if available
            paginationData = respData.pagination || respData.paginationData || paginationData;
          }
        }

        setExams(Array.isArray(examsList) ? examsList : []);
        setPagination(paginationData || pagination);
      } else {
        setExams([]);
      }
    } catch (error) {
      console.error('Failed to load exams:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSubjectsForClass = async (classId) => {
    try {
      const response = await execute({
        method: 'GET',
        url: '/api/super-admin/subjects',
        params: { classId, limit: 200 }
      });
      if (response.success) {
        setSubjects(response.data.subjects);
        // Initialize subject exams
        const initialSubjectExams = response.data.subjects.map(subject => ({
          subjectId: subject._id,
          subjectName: subject.name,
          subjectCode: subject.code,
          date: '',
          startTime: '09:00',
          endTime: '11:00',
          duration: examSchedule.defaultDuration,
          totalMarks: examSchedule.defaultTotalMarks,
          passingMarks: examSchedule.defaultPassingMarks,
          room: examSchedule.room,
          instructions: examSchedule.instructions,
          syllabus: examSchedule.syllabus,
          selected: false,
        }));
        setSubjectExams(initialSubjectExams);
      }
    } catch (error) {
      console.error('Error fetching subjects:', error);
    }
  };

  const handleClassChange = (classId) => {
    setSelectedClass(classId);
    if (classId) {
      fetchSubjectsForClass(classId);
    } else {
      setSubjects([]);
      setSubjectExams([]);
    }
  };

  const handleScheduleChange = (field, value) => {
    setExamSchedule(prev => ({ ...prev, [field]: value }));

    // Update all subject exams with new defaults
    if (['defaultDuration', 'defaultTotalMarks', 'defaultPassingMarks', 'room', 'instructions', 'syllabus'].includes(field)) {
      const fieldMap = {
        defaultDuration: 'duration',
        defaultTotalMarks: 'totalMarks',
        defaultPassingMarks: 'passingMarks',
        room: 'room',
        instructions: 'instructions',
        syllabus: 'syllabus',
      };
      const targetField = fieldMap[field];

      setSubjectExams(prev => prev.map(exam => ({
        ...exam,
        [targetField]: value,
      })));
    }
  };

  const handleSubjectExamChange = (subjectId, field, value) => {
    setSubjectExams(prev => prev.map(exam =>
      exam.subjectId === subjectId ? { ...exam, [field]: value } : exam
    ));
  };

  const toggleSubjectSelection = (subjectId) => {
    setSubjectExams(prev => prev.map(exam =>
      exam.subjectId === subjectId ? { ...exam, selected: !exam.selected } : exam
    ));
  };

  const selectAllSubjects = () => {
    setSubjectExams(prev => prev.map(exam => ({ ...exam, selected: true })));
  };

  const deselectAllSubjects = () => {
    setSubjectExams(prev => prev.map(exam => ({ ...exam, selected: false })));
  };

  const validateExamDates = () => {
    const startDate = new Date(examSchedule.startDate);
    const endDate = new Date(examSchedule.endDate);

    for (const exam of subjectExams) {
      if (exam.selected) {
        const examDate = new Date(exam.date);
        if (examDate < startDate || examDate > endDate) {
          toast.error(`Exam date for ${exam.subjectName} must be between ${examSchedule.startDate} and ${examSchedule.endDate}`);
          return false;
        }
      }
    }
    return true;
  };

  const loadBranches = async () => {
    try {
      console.log('Loading branches...');
      const response = await execute({
        method: 'GET',
        url: '/api/super-admin/branches'
      });
      console.log('Branches API response:', response);
      if (response.success) {
        // Handle both nested and direct data structures (same as branch management page)
        const branchesData = response.data.branches || response.data || [];
        console.log('Setting branches:', branchesData);
        console.log('Branches data type:', typeof branchesData);
        console.log('Is array?', Array.isArray(branchesData));
        setBranches(branchesData);
      } else {
        console.log('API call not successful');
        setBranches([]);
      }
    } catch (error) {
      console.error('Failed to load branches:', error);
      setBranches([]);
    }
  };

  const loadClasses = async () => {
    try {
      console.log('Loading classes...');
      const response = await execute({
        method: 'GET',
        url: '/api/super-admin/classes'
      });
      console.log('Classes API response:', response);
      if (response.success) {
        const classesData = response.data?.classes || response.data || response.classes || [];
        console.log('Setting classes:', classesData);
        setClasses(Array.isArray(classesData) ? classesData : []);
      } else {
        console.log('Classes API call not successful');
        setClasses([]);
      }
    } catch (error) {
      console.error('Failed to load classes:', error);
      setClasses([]);
    }
  };

  const loadSubjects = async () => {
    try {
      const response = await execute({
        method: 'GET',
        url: '/api/super-admin/subjects'
      });
      if (response.success) {
        setSubjects(response.data || []);
      }
    } catch (error) {
      console.error('Failed to load subjects:', error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    // Fetch subjects when class is selected
    if (name === 'classId' && value) {
      fetchSubjectsForClass(value);
    } else if (name === 'classId' && !value) {
      setSubjects([]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      // Validate required fields
      if (!formData.title?.trim()) {
        toast.error('Exam title is required');
        setSubmitting(false);
        return;
      }

      if (!formData.classId) {
        toast.error('Please select a class');
        setSubmitting(false);
        return;
      }

      if (!formData.subjects || formData.subjects.length === 0) {
        toast.error('At least one subject must be added');
        setSubmitting(false);
        return;
      }

      // Validate each subject
      for (let i = 0; i < formData.subjects.length; i++) {
        const subject = formData.subjects[i];

        if (!subject.subjectId) {
          toast.error(`Subject ${i + 1}: Please select a subject`);
          setSubmitting(false);
          return;
        }

        if (!subject.date) {
          toast.error(`Subject ${i + 1}: Please select an exam date`);
          setSubmitting(false);
          return;
        }

        if (!subject.startTime || !subject.endTime) {
          toast.error(`Subject ${i + 1}: Please provide start and end time`);
          setSubmitting(false);
          return;
        }

        // Validate date
        const examDate = new Date(subject.date);
        if (isNaN(examDate.getTime())) {
          toast.error(`Subject ${i + 1}: Please select a valid exam date`);
          setSubmitting(false);
          return;
        }

        // Ensure date is not in the past (optional - remove if you want to allow past dates)
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (examDate < today) {
          toast.error(`Subject ${i + 1}: Exam date cannot be in the past`);
          setSubmitting(false);
          return;
        }

        // Validate passing marks
        if (parseInt(subject.passingMarks) >= parseInt(subject.totalMarks)) {
          toast.error(`Subject ${i + 1}: Passing marks must be less than total marks`);
          setSubmitting(false);
          return;
        }
      }

      // Prepare data for submission
      const submitData = {
        title: formData.title.trim(),
        examType: formData.examType,
        classId: formData.classId,
        subjects: formData.subjects.map(subject => ({
          subjectId: subject.subjectId,
          date: subject.date,
          startTime: subject.startTime,
          endTime: subject.endTime,
          duration: parseInt(subject.duration),
          totalMarks: parseInt(subject.totalMarks),
          passingMarks: parseInt(subject.passingMarks),
          room: subject.room?.trim() || '',
          instructions: subject.instructions?.trim() || '',
          syllabus: subject.syllabus?.trim() || '',
        })),
        status: formData.status || 'scheduled',
      };

      if (isEditMode && currentExam?._id) {
        const response = await execute({
          method: 'PUT',
          url: `/api/super-admin/exams/${currentExam._id}`,
          data: submitData
        });
        if (response.success) {
          toast.success('Exam updated successfully!');
          setIsModalOpen(false);
          loadExams();
        } else {
          toast.error(response.message || 'Failed to update exam');
        }
      } else {
        const response = await execute({
          method: 'POST',
          url: '/api/super-admin/exams',
          data: submitData
        });
        if (response.success) {
          toast.success('Exam created successfully!');
          setIsModalOpen(false);
          loadExams();
        } else {
          toast.error(response.message || 'Failed to create exam');
        }
      }
    } catch (error) {
      console.error('Submit error:', error);
      toast.error(error.message || 'Failed to save exam');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (exam) => {
    setCurrentExam(exam);

    // Handle both old and new exam structures
    const subjects = exam.subjects || (exam.subjectId ? [{
      subjectId: exam.subjectId,
      date: exam.date,
      startTime: exam.startTime,
      endTime: exam.endTime,
      duration: exam.duration,
      totalMarks: exam.totalMarks,
      passingMarks: exam.passingMarks,
      room: exam.room,
      instructions: exam.instructions,
      syllabus: exam.syllabus,
    }] : []);

    setFormData({
      title: exam.title || '',
      examType: exam.examType || 'midterm',
      classId: exam.classId?._id || exam.classId || '',
      status: exam.status || 'scheduled',
      subjects: subjects.map(subject => ({
        subjectId: subject.subjectId?._id || subject.subjectId || '',
        date: subject.date ? new Date(subject.date).toISOString().split('T')[0] : '',
        startTime: subject.startTime || '',
        endTime: subject.endTime || '',
        duration: subject.duration || 120,
        totalMarks: subject.totalMarks || 100,
        passingMarks: subject.passingMarks || 40,
        room: subject.room || '',
        instructions: subject.instructions || '',
        syllabus: subject.syllabus || '',
      })),
    });

    setIsEditMode(true);
    setIsModalOpen(true);
  };

  const handleView = (exam, subject = null) => {
    setCurrentExam(exam);
    setIsViewModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this exam?')) return;

    try {
      const response = await execute({
        method: 'DELETE',
        url: `/api/super-admin/exams/${id}`
      });
      if (response.success) {
        toast.success('Exam deleted successfully!');
        loadExams();
      }
    } catch (error) {
      toast.error(error.message || 'Failed to delete exam');
    }
  };

  const handleAddNew = () => {
    setCurrentExam(null);
    setFormData({
      title: '',
      examType: 'midterm',
      status: 'scheduled',
      classId: '',
      subjects: [{
        subjectId: '',
        date: '',
        startTime: '',
        endTime: '',
        duration: 120,
        totalMarks: 100,
        passingMarks: 40,
        room: '',
        instructions: '',
        syllabus: '',
      }],
    });
    setIsEditMode(false);
    setIsModalOpen(true);
  };

  const handleSubjectChange = (index, field, value) => {
    const updatedSubjects = [...formData.subjects];
    updatedSubjects[index] = { ...updatedSubjects[index], [field]: value };
    setFormData({ ...formData, subjects: updatedSubjects });
  };

  const addSubject = () => {
    setFormData({
      ...formData,
      subjects: [
        ...formData.subjects,
        {
          subjectId: '',
          date: '',
          startTime: '',
          endTime: '',
          duration: 120,
          totalMarks: 100,
          passingMarks: 40,
          room: '',
          instructions: '',
          syllabus: '',
        },
      ],
    });
  };

  const removeSubject = (index) => {
    if (formData.subjects.length > 1) {
      const updatedSubjects = formData.subjects.filter((_, i) => i !== index);
      setFormData({ ...formData, subjects: updatedSubjects });
    } else {
      toast.error('At least one subject is required');
    }
  };

  const handleBulkAddNew = () => {
    resetBulkForm();
    setIsEditMode(false);
    setIsModalOpen(true);
  };

  const resetBulkForm = () => {
    setSelectedClass('');
    setExamSchedule({
      examType: 'midterm',
      startDate: '',
      endDate: '',
      defaultDuration: 120,
      defaultTotalMarks: 100,
      defaultPassingMarks: 40,
      room: '',
      instructions: '',
      syllabus: '',
    });
    setSubjectExams([]);
  };

  const handleBulkSubmit = async (e) => {
    e.preventDefault();

    if (!selectedClass) {
      toast.error('Please select a class');
      return;
    }

    if (!examSchedule.startDate || !examSchedule.endDate) {
      toast.error('Please set exam schedule date range');
      return;
    }

    const selectedSubjects = subjectExams.filter(exam => exam.selected);
    if (selectedSubjects.length === 0) {
      toast.error('Please select at least one subject');
      return;
    }

    // Validate all selected exams have required fields
    for (const exam of selectedSubjects) {
      if (!exam.date || exam.date.trim() === '' || !exam.startTime || !exam.endTime || !exam.duration) {
        toast.error(`Please fill in date, time, and duration for ${exam.subjectName}`);
        return;
      }

      // Validate date format and ensure it's not empty
      const examDate = new Date(exam.date);
      if (isNaN(examDate.getTime())) {
        toast.error(`Please select a valid exam date for ${exam.subjectName}`);
        return;
      }

      // Ensure date is not in the past
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (examDate < today) {
        toast.error(`Exam date for ${exam.subjectName} cannot be in the past`);
        return;
      }
    }

    if (!validateExamDates()) {
      return;
    }

    setSubmitting(true);

    try {
      // Create single exam with multiple subjects
      const examData = {
        title: `${examSchedule.examType.replace('_', ' ').toUpperCase()} Exam - ${classes.find(c => c._id === selectedClass)?.name || ''}`,
        examType: examSchedule.examType,
        classId: selectedClass,
        subjects: selectedSubjects.map(subjectExam => ({
          subjectId: subjectExam.subjectId,
          date: subjectExam.date,
          startTime: subjectExam.startTime,
          endTime: subjectExam.endTime,
          duration: parseInt(subjectExam.duration),
          totalMarks: parseInt(subjectExam.totalMarks),
          passingMarks: parseInt(subjectExam.passingMarks),
          room: subjectExam.room || '',
          instructions: subjectExam.instructions || '',
          syllabus: subjectExam.syllabus || '',
        })),
        status: 'scheduled',
      };

      const response = await execute({
        method: 'POST',
        url: '/api/super-admin/exams',
        data: examData
      });

      if (response.success) {
        toast.success(`${selectedSubjects.length} subjects added to exam successfully!`);
        setIsModalOpen(false);
        resetBulkForm();
        loadExams();
      }
    } catch (error) {
      toast.error(error.message || 'Failed to create exam');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'scheduled': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'ongoing': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'completed': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'cancelled': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'postponed': return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const getExamTypeColor = (type) => {
    switch (type) {
      case 'midterm': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      case 'final': return 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200';
      case 'quiz': return 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200';
      case 'unit_test': return 'bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200';
      case 'mock': return 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200';
      case 'surprise': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'practical': return 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200';
      case 'oral': return 'bg-lime-100 text-lime-800 dark:bg-lime-900 dark:text-lime-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return <FullPageLoader message="Loading exams..." />;
  }

  return (
    <div className="p-4 md:p-6 space-y-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
      {/* Header */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 pt-8">
        <div>
          <h1 className="text-xl md:text-2xl lg:text-3xl font-bold text-gray-900 dark:text-gray-100">
            Exam Management
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1 text-sm md:text-base">
            Manage exams across all branches and classes
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-2 w-full lg:w-auto">
          <Button variant="outline" onClick={handleBulkAddNew} className="text-sm">
            <BookOpen className="w-4 h-4 mr-2" />
            <span className="hidden sm:inline">Bulk Schedule Exams</span>
            <span className="sm:hidden">Bulk Schedule</span>
          </Button>
          <Button onClick={handleAddNew} className="text-sm">
            <Plus className="w-4 h-4 mr-2" />
            <span className="hidden sm:inline">Schedule Single Exam</span>
            <span className="sm:hidden">Single Exam</span>
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4 md:p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search exams..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>

            <Dropdown
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              options={[
                { value: 'all', label: 'All Status' },
                { value: 'scheduled', label: 'Scheduled' },
                { value: 'ongoing', label: 'Ongoing' },
                { value: 'completed', label: 'Completed' },
                { value: 'cancelled', label: 'Cancelled' },
                { value: 'postponed', label: 'Postponed' }
              ]}
              placeholder="Filter by Status"
            />

            <Dropdown
              value={examTypeFilter}
              onChange={(e) => setExamTypeFilter(e.target.value)}
              options={[
                { value: 'all', label: 'All Types' },
                { value: 'midterm', label: 'Midterm' },
                { value: 'final', label: 'Final' },
                { value: 'quiz', label: 'Quiz' },
                { value: 'unit_test', label: 'Unit Test' },
                { value: 'mock', label: 'Mock' },
                { value: 'surprise', label: 'Surprise' },
                { value: 'practical', label: 'Practical' },
                { value: 'oral', label: 'Oral' }
              ]}
              placeholder="Filter by Type"
            />

            <Dropdown
              value={branchFilter}
              onChange={(e) => setBranchFilter(e.target.value)}
              options={[
                { value: 'all', label: 'All Branches' },
                ...branches.map(branch => ({
                  value: branch._id,
                  label: branch.name
                }))
              ]}
              placeholder="Filter by Branch"
            />

            <Button onClick={loadExams} variant="outline" className="whitespace-nowrap">
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Exams Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Exams ({exams.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Mobile Card View */}
          <div className="block md:hidden space-y-4">
            {exams.map((exam) => (
              <Card key={exam._id} className="p-4">
                <div className="space-y-3">
                  <div>
                    <h3 className="font-medium text-gray-900 dark:text-gray-100">{exam.title}</h3>
                    <p className="text-sm text-gray-500">Created: {formatDate(exam.createdAt)}</p>
                  </div>

                  <div className="flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-gray-400" />
                    <span className="text-sm">{exam.branchId?.name || 'N/A'}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-gray-400" />
                    <span className="text-sm">{exam.classId?.name || 'N/A'}</span>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Badge className={getExamTypeColor(exam.examType)}>
                      {exam.examType.replace('_', ' ').toUpperCase()}
                    </Badge>
                    <Badge className={getStatusColor(exam.status)}>
                      {exam.status.toUpperCase()}
                    </Badge>
                  </div>

                  <div className="flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-gray-400" />
                    <span className="text-sm">{exam.subjects?.length || 0} subjects</span>
                  </div>

                  {exam.subjects && exam.subjects.length > 0 && (
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <span className="text-sm">{formatDate(exam.subjects[0].date)}</span>
                    </div>
                  )}

                  <div className="flex gap-2 pt-2 border-t">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleView(exam)}
                      className="flex-1"
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      View
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEdit(exam)}
                      className="flex-1"
                    >
                      <Edit className="w-4 h-4 mr-1" />
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDelete(exam._id)}
                      className="flex-1 text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4 mr-1" />
                      Delete
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Exam Details</TableHead>
                  <TableHead>Branch & Class</TableHead>
                  <TableHead>Type & Status</TableHead>
                  <TableHead>Subjects</TableHead>
                  <TableHead>Schedule</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {exams.map((exam) => (
                  <TableRow key={exam._id}>
                    <TableCell>
                      <div>
                        <div className="font-medium text-gray-900 dark:text-gray-100">
                          {exam.title}
                        </div>
                        <div className="text-sm text-gray-500">
                          Created: {formatDate(exam.createdAt)}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="flex items-center gap-1 text-sm">
                          <Building2 className="w-3 h-3" />
                          {exam.branchId?.name || 'N/A'}
                        </div>
                        <div className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400">
                          <Users className="w-3 h-3" />
                          {exam.classId?.name || 'N/A'}
                          {exam.section && ` - ${exam.section}`}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <Badge className={getExamTypeColor(exam.examType)}>
                          {exam.examType.replace('_', ' ').toUpperCase()}
                        </Badge>
                        <Badge className={getStatusColor(exam.status)}>
                          {exam.status.toUpperCase()}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div className="flex items-center gap-1">
                          <BookOpen className="w-3 h-3" />
                          {exam.subjects?.length || 0} subjects
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {exam.subjects && exam.subjects.length > 0 && (
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {formatDate(exam.subjects[0].date)}
                          </div>
                        )}
                        {exam.subjects && exam.subjects.length > 1 && (
                          <div className="text-xs text-gray-500">
                            +{exam.subjects.length - 1} more
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleView(exam)}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEdit(exam)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDelete(exam._id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          <div className="flex justify-between items-center mt-4">
            <div className="text-sm text-gray-600">
              Showing {exams.length} of {pagination.total} exam records
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPagination((prev) => ({ ...prev, page: prev.page - 1 }))}
                disabled={pagination.page === 1}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPagination((prev) => ({ ...prev, page: prev.page + 1 }))}
                disabled={pagination.page >= pagination.pages}
              >
                Next
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Modals */}
      {/* Single/Bulk Exam Form Modal */}
      {(isModalOpen) && (
        <ExamFormModal
          exam={currentExam}
          isEditMode={isEditMode}
          branches={branches}
          classes={classes}
          subjects={subjects}
          formData={formData}
          setFormData={setFormData}
          onSubmit={handleSubmit}
          onClose={() => {
            setIsModalOpen(false);
            setCurrentExam(null);
            setIsEditMode(false);
          }}
        />
      )}

      {/* Exam Details Modal */}
      {isViewModalOpen && currentExam && (
        <ExamDetailsModal
          exam={currentExam}
          onClose={() => {
            setIsViewModalOpen(false);
            setCurrentExam(null);
          }}
        />
      )}
    </div>
  );
}
