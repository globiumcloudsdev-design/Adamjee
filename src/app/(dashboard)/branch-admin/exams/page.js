'use client';
import React, { useState, useEffect } from 'react';
import { useApi } from '@/hooks/useApi';
import { useAuth } from '@/hooks/useAuth';
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

export default function ExamsPage() {
  const { user } = useAuth();
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
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, pages: 0 });

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

  useEffect(() => {
    fetchExams();
    fetchClasses();
  }, [search, statusFilter, classFilter, examTypeFilter, pagination.page]);

  // Fetch subjects when class is selected in the form
  useEffect(() => {
    if (formData.classId) {
      fetchSubjectsForClass(formData.classId);
    }
  }, [formData.classId]);

  const fetchExams = async () => {
    try {
      setLoading(true);
      const params = {
        page: pagination.page,
        limit: pagination.limit,
        search,
      };
      if (statusFilter) params.status = statusFilter;
      if (classFilter) params.classId = classFilter;
      if (examTypeFilter) params.examType = examTypeFilter;

      const response = await apiClient.get(API_ENDPOINTS.BRANCH_ADMIN.EXAMS.LIST, params);
      if (response.success) {
        setExams(response.data.exams);
        setPagination(response.data.pagination);
      }
    } catch (error) {
      console.error('Error fetching exams:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchClasses = async () => {
    try {
      const response = await apiClient.get(API_ENDPOINTS.BRANCH_ADMIN.CLASSES.LIST, { limit: 200 });
      if (response.success) {
        setClasses(response.data.classes);
      }
    } catch (error) {
      console.error('Error fetching classes:', error);
    }
  };

  const fetchSubjectsForClass = async (classId) => {
    try {
      const response = await apiClient.get(API_ENDPOINTS.BRANCH_ADMIN.SUBJECTS.LIST, {
        classId,
        limit: 200
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

      const response = await apiClient.post(API_ENDPOINTS.BRANCH_ADMIN.EXAMS.CREATE, examData);

      if (response.success) {
        toast.success(`${selectedSubjects.length} subjects added to exam successfully!`);
        setIsModalOpen(false);
        resetBulkForm();
        fetchExams();
      }
    } catch (error) {
      toast.error(error.message || 'Failed to create exam');
    } finally {
      setSubmitting(false);
    }
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
        const response = await apiClient.put(
          API_ENDPOINTS.BRANCH_ADMIN.EXAMS.UPDATE.replace(':id', currentExam._id),
          submitData
        );
        if (response.success) {
          toast.success('Exam updated successfully!');
          setIsModalOpen(false);
          fetchExams();
        } else {
          toast.error(response.message || 'Failed to update exam');
        }
      } else {
        const response = await apiClient.post(API_ENDPOINTS.BRANCH_ADMIN.EXAMS.CREATE, submitData);
        if (response.success) {
          toast.success('Exam created successfully!');
          setIsModalOpen(false);
          fetchExams();
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
      const response = await apiClient.delete(API_ENDPOINTS.BRANCH_ADMIN.EXAMS.DELETE.replace(':id', id));
      if (response.success) {
        toast.success('Exam deleted successfully!');
        fetchExams();
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

  if (loading && exams.length === 0) {
    return <FullPageLoader message="Loading exams..." />;
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold">Exam Management</h1>
        <p className="text-muted-foreground">
          Manage and schedule exams for your branch
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card className="p-6 cursor-pointer hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium text-muted-foreground">Total Exams</p>
              <p className="text-3xl font-bold mt-2">{pagination.total}</p>
            </div>
            <div className="p-3 rounded-full bg-blue-500 text-white">
              <FileText className="w-6 h-6" />
            </div>
          </div>
        </Card>

        <Card className="p-6 cursor-pointer hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium text-muted-foreground">Scheduled</p>
              <p className="text-3xl font-bold mt-2">{exams.filter(e => e.status === 'scheduled').length}</p>
            </div>
            <div className="p-3 rounded-full bg-yellow-500 text-white">
              <Calendar className="w-6 h-6" />
            </div>
          </div>
        </Card>

        <Card className="p-6 cursor-pointer hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium text-muted-foreground">Ongoing</p>
              <p className="text-3xl font-bold mt-2">{exams.filter(e => e.status === 'ongoing').length}</p>
            </div>
            <div className="p-3 rounded-full bg-blue-500 text-white">
              <Clock className="w-6 h-6" />
            </div>
          </div>
        </Card>

        <Card className="p-6 cursor-pointer hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium text-muted-foreground">Completed</p>
              <p className="text-3xl font-bold mt-2">{exams.filter(e => e.status === 'completed').length}</p>
            </div>
            <div className="p-3 rounded-full bg-green-500 text-white">
              <BookOpen className="w-6 h-6" />
            </div>
          </div>
        </Card>

        <Card className="p-6 cursor-pointer hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium text-muted-foreground">Classes</p>
              <p className="text-3xl font-bold mt-2">{classes.length}</p>
            </div>
            <div className="p-3 rounded-full bg-purple-500 text-white">
              <Users className="w-6 h-6" />
            </div>
          </div>
        </Card>
      </div>

      <Card>
        <CardHeader className="border-b">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <CardTitle className="text-lg sm:text-xl">Exams Management</CardTitle>
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
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
        </CardHeader>

        <CardContent>
          {/* Filters */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <Input
              placeholder="Search exams..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              icon={Search}
            />
            <Dropdown
              placeholder="Filter by class"
              value={classFilter}
              onChange={(e) => setClassFilter(e.target.value)}
              options={[
                { value: '', label: 'All Classes' },
                ...classes.map((c) => ({ value: c._id, label: `${c.name} - ${c.code}` })),
              ]}
            />
            <Dropdown
              placeholder="Filter by type"
              value={examTypeFilter}
              onChange={(e) => setExamTypeFilter(e.target.value)}
              options={[{ value: '', label: 'All Types' }, ...EXAM_TYPES]}
            />
            <Dropdown
              placeholder="Filter by status"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              options={[{ value: '', label: 'All Status' }, ...EXAM_STATUS]}
            />
          </div>

          {/* Mobile Card View */}
          <div className="block lg:hidden space-y-4">
            {exams.map((exam) => {
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

              // Get unique dates for this exam
              const uniqueDates = [...new Set(subjects.map(s => s.date))].sort();
              const dateRange = uniqueDates.length === 1
                ? new Date(uniqueDates[0]).toLocaleDateString()
                : `${new Date(uniqueDates[0]).toLocaleDateString()} - ${new Date(uniqueDates[uniqueDates.length - 1]).toLocaleDateString()}`;

              // Get subject names
              const subjectNames = subjects.map(s => s.subjectId?.name || 'N/A').join(', ');

              return (
                <Card key={exam._id} className="p-4">
                  <div className="space-y-3">
                    <div>
                      <h3 className="font-medium text-gray-900 dark:text-gray-100">{exam.title}</h3>
                      <p className="text-sm text-gray-500">Type: {exam.examType.replace('_', ' ')}</p>
                    </div>

                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-gray-400" />
                      <span className="text-sm">{exam.classId?.name || 'N/A'}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <BookOpen className="w-4 h-4 text-gray-400" />
                      <span className="text-sm">{subjectNames}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <span className="text-sm">{dateRange}</span>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <Badge className={`px-2 py-1 rounded-full text-xs ${
                        exam.status === 'completed'
                          ? 'bg-green-100 text-green-700'
                          : exam.status === 'ongoing'
                          ? 'bg-blue-100 text-blue-700'
                          : exam.status === 'scheduled'
                          ? 'bg-yellow-100 text-yellow-700'
                          : exam.status === 'cancelled'
                          ? 'bg-red-100 text-red-700'
                          : 'bg-gray-100 text-gray-700'
                      }`}>
                        {exam.status}
                      </Badge>
                    </div>

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
              );
            })}
          </div>

          {/* Desktop Table View */}
          <div className="hidden lg:block overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Class</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead>Date & Time</TableHead>
                  <TableHead>Marks</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {exams.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center text-gray-500">
                      No exams found
                    </TableCell>
                  </TableRow>
                ) : (
                  exams.map((exam) => {
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

                    // Get unique dates for this exam
                    const uniqueDates = [...new Set(subjects.map(s => s.date))].sort();
                    const dateRange = uniqueDates.length === 1
                      ? new Date(uniqueDates[0]).toLocaleDateString()
                      : `${new Date(uniqueDates[0]).toLocaleDateString()} - ${new Date(uniqueDates[uniqueDates.length - 1]).toLocaleDateString()}`;

                    // Get subject names
                    const subjectNames = subjects.map(s => s.subjectId?.name || 'N/A').join(', ');

                    return (
                      <TableRow key={exam._id}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            <FileText className="w-4 h-4" />
                            {exam.title}
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="capitalize text-sm">{exam.examType.replace('_', ' ')}</span>
                        </TableCell>
                        <TableCell>{exam.classId?.name || 'N/A'}</TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {subjectNames}
                            <div className="text-xs text-gray-500 mt-1">
                              ({subjects.length} subject{subjects.length !== 1 ? 's' : ''})
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <div className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {dateRange}
                            </div>
                            {subjects.length === 1 && (
                              <div className="flex items-center gap-1 text-gray-500 mt-1">
                                <Clock className="w-3 h-3" />
                                {subjects[0].startTime} - {subjects[0].endTime}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {subjects.length === 1 ? (
                              <>
                                <div>Total: {subjects[0].totalMarks}</div>
                                <div className="text-gray-500">Pass: {subjects[0].passingMarks}</div>
                              </>
                            ) : (
                              <div className="text-xs text-gray-500">
                                Multiple subjects
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <span
                            className={`px-2 py-1 rounded-full text-xs ${
                              exam.status === 'completed'
                                ? 'bg-green-100 text-green-700'
                                : exam.status === 'ongoing'
                                ? 'bg-blue-100 text-blue-700'
                                : exam.status === 'scheduled'
                                ? 'bg-yellow-100 text-yellow-700'
                                : exam.status === 'cancelled'
                                ? 'bg-red-100 text-red-700'
                                : 'bg-gray-100 text-gray-700'
                            }`}
                          >
                            {exam.status}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button variant="ghost" size="icon-sm" onClick={() => handleView(exam)} title="View Details">
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="icon-sm" onClick={() => handleEdit(exam)}>
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="icon-sm" onClick={() => handleDelete(exam._id)}>
                              <Trash2 className="w-4 h-4 text-red-600" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          <div className="flex flex-col sm:flex-row justify-between items-center mt-4 gap-4">
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

      {/* Bulk Exam Creation Modal */}
      <Modal
        open={isModalOpen && !isEditMode}
        onClose={() => setIsModalOpen(false)}
        title="Bulk Schedule Exams"
        size="xl"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleBulkSubmit} disabled={submitting}>
              {submitting ? <ButtonLoader /> : 'Create Exams'}
            </Button>
          </div>
        }
      >
        <form onSubmit={handleBulkSubmit} className="space-y-6 max-h-[70vh] overflow-y-auto">
          {/* Class Selection */}
          <div>
            <label className="block text-sm font-medium mb-2">Select Class *</label>
            <Dropdown
              value={selectedClass}
              onChange={(e) => handleClassChange(e.target.value)}
              options={[
                { value: '', label: 'Choose a class first...' },
                ...classes.map((c) => ({ value: c._id, label: `${c.name} - ${c.code}` })),
              ]}
            />
          </div>

          {selectedClass && (
            <>
              {/* Exam Schedule Settings */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Exam Schedule Settings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Exam Type *</label>
                      <Dropdown
                        value={examSchedule.examType}
                        onChange={(e) => handleScheduleChange('examType', e.target.value)}
                        options={EXAM_TYPES}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Room</label>
                      <input
                        type="text"
                        value={examSchedule.room}
                        onChange={(e) => handleScheduleChange('room', e.target.value)}
                        className="w-full px-3 py-2 border rounded-lg"
                        placeholder="e.g., Room 101"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Start Date *</label>
                      <input
                        type="date"
                        value={examSchedule.startDate}
                        onChange={(e) => handleScheduleChange('startDate', e.target.value)}
                        className="w-full px-3 py-2 border rounded-lg"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">End Date *</label>
                      <input
                        type="date"
                        value={examSchedule.endDate}
                        onChange={(e) => handleScheduleChange('endDate', e.target.value)}
                        className="w-full px-3 py-2 border rounded-lg"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Default Duration (min)</label>
                      <input
                        type="number"
                        value={examSchedule.defaultDuration}
                        onChange={(e) => handleScheduleChange('defaultDuration', e.target.value)}
                        className="w-full px-3 py-2 border rounded-lg"
                        min="30"
                        max="480"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Total Marks</label>
                      <input
                        type="number"
                        value={examSchedule.defaultTotalMarks}
                        onChange={(e) => handleScheduleChange('defaultTotalMarks', e.target.value)}
                        className="w-full px-3 py-2 border rounded-lg"
                        min="10"
                        max="500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Passing Marks</label>
                      <input
                        type="number"
                        value={examSchedule.defaultPassingMarks}
                        onChange={(e) => handleScheduleChange('defaultPassingMarks', e.target.value)}
                        className="w-full px-3 py-2 border rounded-lg"
                        min="1"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Instructions</label>
                    <textarea
                      value={examSchedule.instructions}
                      onChange={(e) => handleScheduleChange('instructions', e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg"
                      rows="3"
                      placeholder="General instructions for all exams..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Syllabus Coverage</label>
                    <textarea
                      value={examSchedule.syllabus}
                      onChange={(e) => handleScheduleChange('syllabus', e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg"
                      rows="2"
                      placeholder="Topics to be covered..."
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Subject Selection and Configuration */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">Subject-wise Exam Configuration</CardTitle>
                    <div className="flex gap-2">
                      <Button type="button" variant="outline" size="sm" onClick={selectAllSubjects}>
                        Select All
                      </Button>
                      <Button type="button" variant="outline" size="sm" onClick={deselectAllSubjects}>
                        Deselect All
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4 max-h-96 overflow-y-auto">
                    {subjectExams.map((subjectExam) => (
                      <Card key={subjectExam.subjectId} className={`border-2 ${subjectExam.selected ? 'border-blue-300 bg-blue-50' : 'border-gray-200'}`}>
                        <CardContent className="pt-4">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-3">
                              <input
                                type="checkbox"
                                checked={subjectExam.selected}
                                onChange={() => toggleSubjectSelection(subjectExam.subjectId)}
                                className="w-4 h-4 text-blue-600 rounded"
                              />
                              <div>
                                <h4 className="font-medium">{subjectExam.subjectName}</h4>
                                <p className="text-sm text-gray-500">Code: {subjectExam.subjectCode}</p>
                              </div>
                            </div>
                          </div>

                          {subjectExam.selected && (
                            <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t">
                              <div>
                                <label className="block text-sm font-medium mb-1">Exam Date *</label>
                                <input
                                  type="date"
                                  value={subjectExam.date}
                                  onChange={(e) => handleSubjectExamChange(subjectExam.subjectId, 'date', e.target.value)}
                                  className="w-full px-3 py-2 border rounded-lg"
                                  min={examSchedule.startDate}
                                  max={examSchedule.endDate}
                                  required
                                />
                              </div>
                              <div className="grid grid-cols-2 gap-2">
                                <div>
                                  <label className="block text-sm font-medium mb-1">Start Time</label>
                                  <input
                                    type="time"
                                    value={subjectExam.startTime}
                                    onChange={(e) => handleSubjectExamChange(subjectExam.subjectId, 'startTime', e.target.value)}
                                    className="w-full px-3 py-2 border rounded-lg"
                                  />
                                </div>
                                <div>
                                  <label className="block text-sm font-medium mb-1">End Time</label>
                                  <input
                                    type="time"
                                    value={subjectExam.endTime}
                                    onChange={(e) => handleSubjectExamChange(subjectExam.subjectId, 'endTime', e.target.value)}
                                    className="w-full px-3 py-2 border rounded-lg"
                                  />
                                </div>
                              </div>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </form>
      </Modal>

      {/* Single Exam Modal */}
      <Modal
        open={isModalOpen && isEditMode}
        onClose={() => setIsModalOpen(false)}
        title={isEditMode ? 'Edit Exam' : 'Schedule Single Exam'}
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={submitting}>
              {submitting ? <ButtonLoader /> : isEditMode ? 'Update' : 'Create'}
            </Button>
          </div>
        }
      >
        <form onSubmit={handleSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto">
          <div>
            <label className="block text-sm font-medium mb-1">Exam Title *</label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border rounded-lg"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Exam Type *</label>
              <Dropdown name="examType" value={formData.examType} onChange={handleInputChange} options={EXAM_TYPES} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Status</label>
              <Dropdown name="status" value={formData.status} onChange={handleInputChange} options={EXAM_STATUS} />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Class *</label>
            <Dropdown
              value={formData.classId}
              onChange={(value) => {
                setFormData((prev) => ({ ...prev, classId: value }));
                if (value) {
                  fetchSubjectsForClass(value);
                } else {
                  setSubjects([]);
                }
              }}
              options={[
                { value: '', label: 'Select Class' },
                ...classes.map((c) => ({ value: c._id, label: `${c.name} - ${c.code}` })),
              ]}
            />
          </div>

          {/* Subjects Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium">Exam Subjects</h3>
              <Button type="button" variant="outline" size="sm" onClick={addSubject}>
                <Plus className="w-4 h-4 mr-2" />
                Add Subject
              </Button>
            </div>

            {formData.subjects.map((subject, index) => (
              <Card key={index} className="border-2 border-gray-200">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">Subject {index + 1}</CardTitle>
                    {formData.subjects.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeSubject(index)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Subject *</label>
                    <Dropdown
                      value={subject.subjectId}
                      onChange={(e) => handleSubjectChange(index, 'subjectId', e.target.value)}
                      options={[
                        { value: '', label: 'Select Subject' },
                        ...subjects.map((s) => ({ value: s._id, label: s.name })),
                      ]}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Exam Date *</label>
                    <input
                      type="date"
                      value={subject.date}
                      onChange={(e) => handleSubjectChange(index, 'date', e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Start Time *</label>
                      <input
                        type="time"
                        value={subject.startTime}
                        onChange={(e) => handleSubjectChange(index, 'startTime', e.target.value)}
                        className="w-full px-3 py-2 border rounded-lg"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">End Time *</label>
                      <input
                        type="time"
                        value={subject.endTime}
                        onChange={(e) => handleSubjectChange(index, 'endTime', e.target.value)}
                        className="w-full px-3 py-2 border rounded-lg"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Duration (min)</label>
                      <input
                        type="number"
                        value={subject.duration}
                        onChange={(e) => handleSubjectChange(index, 'duration', e.target.value)}
                        className="w-full px-3 py-2 border rounded-lg"
                        min="30"
                        max="480"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Total Marks *</label>
                      <input
                        type="number"
                        value={subject.totalMarks}
                        onChange={(e) => handleSubjectChange(index, 'totalMarks', e.target.value)}
                        className="w-full px-3 py-2 border rounded-lg"
                        min="10"
                        max="500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Passing Marks *</label>
                      <input
                        type="number"
                        value={subject.passingMarks}
                        onChange={(e) => handleSubjectChange(index, 'passingMarks', e.target.value)}
                        className="w-full px-3 py-2 border rounded-lg"
                        min="1"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Room</label>
                      <input
                        type="text"
                        value={subject.room}
                        onChange={(e) => handleSubjectChange(index, 'room', e.target.value)}
                        className="w-full px-3 py-2 border rounded-lg"
                        placeholder="e.g., Room 101"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Instructions</label>
                    <textarea
                      value={subject.instructions}
                      onChange={(e) => handleSubjectChange(index, 'instructions', e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg"
                      rows="2"
                      placeholder="Exam instructions for this subject..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Syllabus Coverage</label>
                    <textarea
                      value={subject.syllabus}
                      onChange={(e) => handleSubjectChange(index, 'syllabus', e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg"
                      rows="2"
                      placeholder="Topics to be covered for this subject..."
                    />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </form>
      </Modal>

      {/* View Modal */}
      <Modal
        open={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        title="Exam Details"
        size="xl"
        footer={
          <div className="flex justify-end">
            <Button onClick={() => setIsViewModalOpen(false)}>
              Close
            </Button>
          </div>
        }
      >
        {currentExam && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-600">Title</label>
                <p className="text-lg font-medium">{currentExam.title}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600">Type</label>
                <p className="capitalize">{currentExam.examType.replace('_', ' ')}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600">Class</label>
                <p>{currentExam.classId?.name} - {currentExam.classId?.code}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600">Status</label>
                <span
                  className={`px-3 py-1 rounded-full text-sm ${
                    currentExam.status === 'completed'
                      ? 'bg-green-100 text-green-700'
                      : currentExam.status === 'ongoing'
                      ? 'bg-blue-100 text-blue-700'
                      : currentExam.status === 'scheduled'
                      ? 'bg-yellow-100 text-yellow-700'
                      : currentExam.status === 'cancelled'
                      ? 'bg-red-100 text-red-700'
                      : 'bg-gray-100 text-gray-700'
                  }`}
                >
                  {currentExam.status}
                </span>
              </div>
            </div>

            {/* Exam Schedule Grid - Similar to Timetable Design */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Exam Schedule</h3>

              {(() => {
                // Handle both old and new exam structures
                const subjects = currentExam.subjects || (currentExam.subjectId ? [{
                  subjectId: currentExam.subjectId,
                  date: currentExam.date,
                  startTime: currentExam.startTime,
                  endTime: currentExam.endTime,
                  duration: currentExam.duration,
                  totalMarks: currentExam.totalMarks,
                  passingMarks: currentExam.passingMarks,
                  room: currentExam.room,
                  instructions: currentExam.instructions,
                  syllabus: currentExam.syllabus,
                }] : []);

                // Group subjects by date
                const subjectsByDate = {};
                subjects.forEach(subject => {
                  const dateKey = subject.date;
                  if (!subjectsByDate[dateKey]) {
                    subjectsByDate[dateKey] = [];
                  }
                  subjectsByDate[dateKey].push(subject);
                });

                // Sort dates
                const sortedDates = Object.keys(subjectsByDate).sort();

                if (sortedDates.length === 0) {
                  return <p className="text-center text-gray-500 py-8">No exam subjects scheduled</p>;
                }

                return (
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse border">
                      <thead>
                        <tr>
                          {Array.from(new Set(subjects.map(s => s.subjectId?._id || s.subjectId)))
                            .map(subjectId => {
                              const subject = subjects.find(s => (s.subjectId?._id || s.subjectId) === subjectId);
                              return (
                                <th key={subject.subjectId?._id || subject.subjectId || `subject-${Math.random()}`} className="border p-3 bg-muted text-center min-w-[200px]">
                                  <div className="space-y-1">
                                    <div className="font-semibold">{subject.subjectId?.name || 'Unknown Subject'}</div>
                                    <div className="text-sm text-muted-foreground">
                                      {subject.subjectId?.code && `(${subject.subjectId.code})`}
                                    </div>
                                  </div>
                                </th>
                              );
                            })}
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          {Array.from(new Set(subjects.map(s => s.subjectId?._id || s.subjectId)))
                            .map(subjectId => {
                              const subject = subjects.find(s => (s.subjectId?._id || s.subjectId) === subjectId);
                              // Get all exam details for this subject
                              const subjectExams = subjects.filter(s => (s.subjectId?._id || s.subjectId) === subjectId);

                              return (
                                <td key={subjectId} className="border p-3 text-center">
                                  <div className="space-y-3">
                                    {subjectExams.map((exam, examIndex) => {
                                      const examDate = new Date(exam.date);
                                      const dayName = examDate.toLocaleDateString('en-US', { weekday: 'long' });
                                      const formattedDate = examDate.toLocaleDateString('en-US', {
                                        year: 'numeric',
                                        month: 'short',
                                        day: 'numeric'
                                      });

                                      return (
                                        <div key={examIndex} className="border rounded-lg p-3 bg-gray-50 space-y-2">
                                          <div className="font-medium text-sm text-blue-700">
                                            {dayName} - {formattedDate}
                                          </div>
                                          <div className="font-medium text-sm">
                                            {exam.startTime} - {exam.endTime}
                                          </div>
                                          <div className="text-xs text-muted-foreground">
                                            Duration: {exam.duration} min
                                          </div>
                                          <div className="text-xs grid grid-cols-2 gap-1">
                                            <div><span className="font-medium">Total:</span> {exam.totalMarks}</div>
                                            <div><span className="font-medium">Pass:</span> {exam.passingMarks}</div>
                                          </div>
                                          {exam.room && (
                                            <div className="text-xs text-muted-foreground">
                                              Room: {exam.room}
                                            </div>
                                          )}
                                          {exam.instructions && (
                                            <div className="mt-2 p-2 bg-blue-50 rounded text-xs">
                                              <div className="font-medium text-blue-700">Instructions:</div>
                                              <div className="text-blue-600 mt-1">{exam.instructions}</div>
                                            </div>
                                          )}
                                          {exam.syllabus && (
                                            <div className="mt-2 p-2 bg-green-50 rounded text-xs">
                                              <div className="font-medium text-green-700">Syllabus:</div>
                                              <div className="text-green-600 mt-1">{exam.syllabus}</div>
                                            </div>
                                          )}
                                        </div>
                                      );
                                    })}
                                  </div>
                                </td>
                              );
                            })}
                        </tr>
                      </tbody>
                    </table>
                  </div>
                );
              })()}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
