'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import Input from '@/components/ui/input';
import Dropdown from '@/components/ui/dropdown';
import Modal from '@/components/ui/modal';
import FullPageLoader from '@/components/ui/full-page-loader';
import ButtonLoader from '@/components/ui/button-loader';
import { Plus, Edit, Trash2, Search, BookOpen } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import apiClient from '@/lib/api-client';
import { API_ENDPOINTS } from '@/constants/api-endpoints';

const SUBJECT_TYPES = [
  { value: 'core', label: 'Core' },
  { value: 'elective', label: 'Elective' },
  { value: 'co-curricular', label: 'Co-Curricular' },
  { value: 'skill-based', label: 'Skill-Based' },
];

const STATUS_OPTIONS = [
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
  { value: 'archived', label: 'Archived' },
];

export default function SubjectsPage() {
  const { user } = useAuth();
  const [subjects, setSubjects] = useState([]);
  const [classes, setClasses] = useState([]);
  const [grades, setGrades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [currentSubject, setCurrentSubject] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [classFilter, setClassFilter] = useState('');
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, pages: 0 });

  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
    classId: '',
    gradeId: '',
    subjectType: 'core',
    hoursPerWeek: 5,
    totalHoursPerYear: 150,
    creditHours: 3,
    status: 'active',
  });

  useEffect(() => {
    fetchSubjects();
    fetchClasses();
    fetchGrades();
  }, [search, statusFilter, classFilter, pagination.page]);

  const fetchSubjects = async () => {
    try {
      setLoading(true);
      const params = {
        page: pagination.page,
        limit: pagination.limit,
        search,
      };
      if (statusFilter) params.status = statusFilter;
      if (classFilter) params.classId = classFilter;

      const response = await apiClient.get(API_ENDPOINTS.BRANCH_ADMIN.SUBJECTS.LIST, params);
      if (response.success) {
        setSubjects(response.data.subjects);
        setPagination(response.data.pagination);
      }
    } catch (error) {
      console.error('Error fetching subjects:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchClasses = async () => {
    try {
      const response = await apiClient.get(API_ENDPOINTS.BRANCH_ADMIN.CLASSES.LIST, { limit: 100 });
      if (response.success) {
        setClasses(response.data.classes);
      }
    } catch (error) {
      console.error('Error fetching classes:', error);
    }
  };

  const fetchGrades = async () => {
    try {
      const response = await apiClient.get(API_ENDPOINTS.BRANCH_ADMIN.GRADES_VIEW.LIST, { limit: 100 });
      if (response.success) {
        setGrades(response.data.grades);
      }
    } catch (error) {
      console.error('Error fetching grades:', error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      if (isEditMode) {
        const response = await apiClient.put(
          API_ENDPOINTS.BRANCH_ADMIN.SUBJECTS.UPDATE.replace(':id', currentSubject._id),
          formData
        );
        if (response.success) {
          alert('Subject updated successfully!');
          setIsModalOpen(false);
          fetchSubjects();
        }
      } else {
        const response = await apiClient.post(API_ENDPOINTS.BRANCH_ADMIN.SUBJECTS.CREATE, formData);
        if (response.success) {
          alert('Subject created successfully!');
          setIsModalOpen(false);
          fetchSubjects();
        }
      }
    } catch (error) {
      alert(error.message || 'Failed to save subject');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (subject) => {
    setCurrentSubject(subject);
    setFormData({
      name: subject.name || '',
      code: subject.code || '',
      description: subject.description || '',
      classId: subject.classId?._id || '',
      gradeId: subject.gradeId?._id || '',
      subjectType: subject.subjectType || 'core',
      hoursPerWeek: subject.hoursPerWeek || 5,
      totalHoursPerYear: subject.totalHoursPerYear || 150,
      creditHours: subject.creditHours || 3,
      status: subject.status || 'active',
    });
    setIsEditMode(true);
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this subject?')) return;

    try {
      const response = await apiClient.delete(API_ENDPOINTS.BRANCH_ADMIN.SUBJECTS.DELETE.replace(':id', id));
      if (response.success) {
        alert('Subject deleted successfully!');
        fetchSubjects();
      }
    } catch (error) {
      alert(error.message || 'Failed to delete subject');
    }
  };

  const handleAddNew = () => {
    setCurrentSubject(null);
    setFormData({
      name: '',
      code: '',
      description: '',
      classId: '',
      gradeId: '',
      subjectType: 'core',
      hoursPerWeek: 5,
      totalHoursPerYear: 150,
      creditHours: 3,
      status: 'active',
    });
    setIsEditMode(false);
    setIsModalOpen(true);
  };

  if (loading && subjects.length === 0) {
    return <FullPageLoader message="Loading subjects..." />;
  }

  return (
    <div className="p-6">
      <Card>
        <CardHeader className="border-b">
          <div className="flex items-center justify-between">
            <CardTitle>Subjects Management</CardTitle>
            <Button onClick={handleAddNew}>
              <Plus className="w-4 h-4 mr-2" />
              Add Subject
            </Button>
          </div>
        </CardHeader>

        <CardContent>
          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Input
              placeholder="Search subjects..."
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
                ...classes.map((c) => ({ value: c._id, label: c.name })),
              ]}
            />
            <Dropdown
              placeholder="Filter by status"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              options={[{ value: '', label: 'All Status' }, ...STATUS_OPTIONS]}
            />
          </div>

          {/* Table */}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Code</TableHead>
                <TableHead>Class</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Hours/Week</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {subjects.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-gray-500">
                    No subjects found
                  </TableCell>
                </TableRow>
              ) : (
                subjects.map((subject) => (
                  <TableRow key={subject._id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <BookOpen className="w-4 h-4" />
                        {subject.name}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-700">
                        {subject.code}
                      </span>
                    </TableCell>
                    <TableCell>{subject.classId?.name || 'N/A'}</TableCell>
                    <TableCell>
                      <span className="px-2 py-1 rounded-full text-xs bg-purple-100 text-purple-700">
                        {subject.subjectType}
                      </span>
                    </TableCell>
                    <TableCell>{subject.hoursPerWeek || 0} hrs</TableCell>
                    <TableCell>
                      <span
                        className={`px-2 py-1 rounded-full text-xs ${
                          subject.status === 'active'
                            ? 'bg-green-100 text-green-700'
                            : subject.status === 'inactive'
                            ? 'bg-gray-100 text-gray-700'
                            : 'bg-red-100 text-red-700'
                        }`}
                      >
                        {subject.status}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button variant="ghost" size="icon-sm" onClick={() => handleEdit(subject)}>
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon-sm" onClick={() => handleDelete(subject._id)}>
                          <Trash2 className="w-4 h-4 text-red-600" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          {/* Pagination */}
          <div className="flex justify-between items-center mt-4">
            <div className="text-sm text-gray-600">
              Showing {subjects.length} of {pagination.total} subjects
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

      {/* Modal */}
      <Modal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={isEditMode ? 'Edit Subject' : 'Add New Subject'}
        size="lg"
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
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Subject Name *</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border rounded-lg"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Subject Code</label>
            <input
              type="text"
              name="code"
              value={formData.code}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border rounded-lg uppercase"
            />
            <p className="text-xs text-gray-500 mt-1">Leave blank to auto-generate</p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Description</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border rounded-lg"
              rows="2"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Class *</label>
              <Dropdown
                name="classId"
                value={formData.classId}
                onChange={handleInputChange}
                options={[
                  { value: '', label: 'Select Class' },
                  ...classes.map((c) => ({ value: c._id, label: c.name })),
                ]}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Grade</label>
              <Dropdown
                name="gradeId"
                value={formData.gradeId}
                onChange={handleInputChange}
                options={[
                  { value: '', label: 'Select Grade' },
                  ...grades.map((g) => ({ value: g._id, label: g.name })),
                ]}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Subject Type</label>
              <Dropdown
                name="subjectType"
                value={formData.subjectType}
                onChange={handleInputChange}
                options={SUBJECT_TYPES}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Status</label>
              <Dropdown
                name="status"
                value={formData.status}
                onChange={handleInputChange}
                options={STATUS_OPTIONS}
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Hours/Week</label>
              <input
                type="number"
                name="hoursPerWeek"
                value={formData.hoursPerWeek}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border rounded-lg"
                min="0"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Hours/Year</label>
              <input
                type="number"
                name="totalHoursPerYear"
                value={formData.totalHoursPerYear}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border rounded-lg"
                min="0"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Credit Hours</label>
              <input
                type="number"
                name="creditHours"
                value={formData.creditHours}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border rounded-lg"
                min="0"
              />
            </div>
          </div>
        </form>
      </Modal>
    </div>
  );
}
