'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import Input from '@/components/ui/input';
import Dropdown from '@/components/ui/dropdown';
import Modal from '@/components/ui/modal';
import FullPageLoader from '@/components/ui/full-page-loader';
import ButtonLoader from '@/components/ui/button-loader';
import { Plus, Edit, Trash2, Search, FileText, Eye, Download, Upload, File } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import apiClient from '@/lib/api-client';
import { API_ENDPOINTS } from '@/constants/api-endpoints';
import { toast } from 'sonner';

const SYLLABUS_STATUS = [
  { value: 'draft', label: 'Draft' },
  { value: 'submitted', label: 'Submitted' },
  { value: 'approved', label: 'Approved' },
  { value: 'published', label: 'Published' },
  { value: 'archived', label: 'Archived' },
];

export default function SyllabusPage() {
  const { user } = useAuth();
  const [syllabuses, setSyllabuses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [currentSyllabus, setCurrentSyllabus] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [classFilter, setClassFilter] = useState('');
  const [subjectFilter, setSubjectFilter] = useState('');
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, pages: 0 });
  const [uploading, setUploading] = useState(false);

  const fileInputRef = useRef(null);
  
  const currentYear = new Date().getFullYear();
  
  const [formData, setFormData] = useState({
    classId: '',
    subjectId: '',
    academicYear: `${currentYear}-${currentYear + 1}`,
    status: 'draft',
    pdfFile: null,
  });

  useEffect(() => {
    fetchSyllabuses();
    fetchClasses();
  }, [search, statusFilter, pagination.page, classFilter, subjectFilter]);

  const fetchSyllabuses = async () => {
    try {
      setLoading(true);
      const params = {
        page: pagination.page,
        limit: pagination.limit,
        search,
        ...(statusFilter && { status: statusFilter }),
        ...(classFilter && { classId: classFilter }),
        ...(subjectFilter && { subjectId: subjectFilter }),
      };

      const response = await apiClient.get(API_ENDPOINTS.BRANCH_ADMIN.SYLLABUS.LIST, params);
      if (response.success) {
        setSyllabuses(response.data.syllabuses);
        setPagination(response.data.pagination);
      }
    } catch (error) {
      console.error('Error fetching syllabuses:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchClasses = async () => {
    try {
      const response = await apiClient.get(API_ENDPOINTS.BRANCH_ADMIN.CLASSES.LIST, { limit: 100 });
      if (response.success) {
        setClasses(response.data.classes || []);
      }
    } catch (error) {
      console.error('Error fetching classes:', error);
    }
  };

  const fetchSubjects = async (classId, branchId = null) => {
    try {
      if (!classId) {
        setSubjects([]);
        return;
      }
      console.log('Fetching subjects for classId:', classId, 'branchId:', branchId);
      
      // Try super-admin subjects API first (for testing)
      const params = { limit: 200, classId };
      let response;
      
      // If branchId is provided, include it in the params
      if (branchId) {
        params.branchId = branchId;
      }
      
      // Try branch-admin API first
      response = await apiClient.get(API_ENDPOINTS.BRANCH_ADMIN.SUBJECTS.LIST, { limit: 100, classId });
      console.log('Branch Admin subjects response:', response);
      
      if (response.success) {
        let subjectsList = response.data?.subjects || response.data || [];
        
        // If no subjects from branch-admin API, try super-admin API
        if (subjectsList.length === 0) {
          console.log('Trying super-admin subjects API...');
          response = await apiClient.get(`/api/super-admin/subjects?limit=200&classId=${classId}`);
          console.log('Super Admin subjects response:', response);
          
          if (response.success) {
            subjectsList = response.data || [];
          }
        }
        
        setSubjects(subjectsList);
        console.log('Subjects set:', subjectsList.length);
        
        if (subjectsList.length === 0) {
          toast.info('No subjects found for this class. Please create subjects first.');
        }
      } else {
        // Try super-admin API as fallback
        console.log('Trying super-admin subjects API as fallback...');
        response = await apiClient.get(`/api/super-admin/subjects?limit=200&classId=${classId}`);
        console.log('Super Admin subjects response:', response);
        
        if (response.success) {
          const subjectsList = response.data || [];
          setSubjects(subjectsList);
          console.log('Subjects set from super-admin:', subjectsList.length);
          
          if (subjectsList.length === 0) {
            toast.info('No subjects found for this class. Please create subjects first.');
          }
        } else {
          console.error('Failed to fetch subjects:', response.message);
          toast.error(response.message || 'Failed to fetch subjects');
          setSubjects([]);
        }
      }
    } catch (error) {
      console.error('Error fetching subjects:', error);
      toast.error('Error loading subjects. Please try again.');
      setSubjects([]);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.type !== 'application/pdf') {
        toast.error('Please select a PDF file');
        return;
      }
      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        toast.error('File size should be less than 10MB');
        return;
      }
      setFormData({ ...formData, pdfFile: file });
    }
  };

  const handleClassChange = (classId) => {
    setFormData({ ...formData, classId, subjectId: '' });
    setSubjects([]);
    if (classId) {
      fetchSubjects(classId);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.classId) {
      toast.error('Please select a class');
      return;
    }
    if (!formData.subjectId) {
      toast.error('Please select a subject');
      return;
    }
    if (!formData.pdfFile && !currentSyllabus?.pdfFile?.url) {
      toast.error('Please upload a PDF file');
      return;
    }

    setSubmitting(true);

    try {
      let pdfUrl = currentSyllabus?.pdfFile?.url;
      let pdfPublicId = currentSyllabus?.pdfFile?.publicId;
      let pdfName = currentSyllabus?.pdfFile?.name;

      // Upload PDF if new file selected
      if (formData.pdfFile) {
        const uploadFormData = new FormData();
        uploadFormData.append('file', formData.pdfFile);
        uploadFormData.append('fileType', 'syllabus_pdf');
        uploadFormData.append('classId', formData.classId);
        
        if (currentSyllabus?._id) {
          uploadFormData.append('syllabusId', currentSyllabus._id);
        }

        const uploadResponse = await apiClient.post('/api/upload', uploadFormData);
        
        if (uploadResponse.success) {
          pdfUrl = uploadResponse.data.url;
          pdfPublicId = uploadResponse.data.publicId;
          pdfName = formData.pdfFile.name;
        } else {
          toast.error('Failed to upload PDF');
          setSubmitting(false);
          return;
        }
      }

      const syllabusData = {
        classId: formData.classId,
        subjectId: formData.subjectId,
        academicYear: formData.academicYear,
        status: formData.status,
        title: `${formData.subjectId} Syllabus - ${formData.academicYear}`,
        pdfFile: {
          url: pdfUrl,
          publicId: pdfPublicId,
          name: pdfName,
          uploadedAt: new Date(),
        },
      };

      if (isEditMode) {
        const response = await apiClient.put(
          API_ENDPOINTS.BRANCH_ADMIN.SYLLABUS.UPDATE.replace(':id', currentSyllabus._id),
          syllabusData
        );
        if (response.success) {
          toast.success('Syllabus updated successfully!');
          setIsModalOpen(false);
          fetchSyllabuses();
        }
      } else {
        const response = await apiClient.post(API_ENDPOINTS.BRANCH_ADMIN.SYLLABUS.CREATE, syllabusData);
        if (response.success) {
          toast.success('Syllabus created successfully!');
          setIsModalOpen(false);
          fetchSyllabuses();
        }
      }
    } catch (error) {
      toast.error(error.message || 'Failed to save syllabus');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (syllabus) => {
    setCurrentSyllabus(syllabus);
    const classId = syllabus.classId?._id || syllabus.classId;
    
    setFormData({
      classId: classId || '',
      subjectId: syllabus.subjectId?._id || syllabus.subjectId || '',
      academicYear: syllabus.academicYear || `${currentYear}-${currentYear + 1}`,
      status: syllabus.status || 'draft',
      pdfFile: null,
    });
    
    // Load subjects for this class
    if (classId) {
      fetchSubjects(classId);
    }
    
    setIsEditMode(true);
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this syllabus?')) return;

    try {
      const response = await apiClient.delete(API_ENDPOINTS.BRANCH_ADMIN.SYLLABUS.DELETE.replace(':id', id));
      if (response.success) {
        toast.success('Syllabus deleted successfully!');
        fetchSyllabuses();
      }
    } catch (error) {
      toast.error(error.message || 'Failed to delete syllabus');
    }
  };

  const handleView = (syllabus) => {
    setCurrentSyllabus(syllabus);
    setIsModalOpen(true);
    setIsEditMode(false);
  };

  const handleAddNew = () => {
    setCurrentSyllabus(null);
    setFormData({
      classId: '',
      subjectId: '',
      academicYear: `${currentYear}-${currentYear + 1}`,
      status: 'draft',
      pdfFile: null,
    });
    setSubjects([]);
    setIsEditMode(false);
    setIsModalOpen(true);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setIsEditMode(false);
    setCurrentSyllabus(null);
    setFormData({
      classId: '',
      subjectId: '',
      academicYear: `${currentYear}-${currentYear + 1}`,
      status: 'draft',
      pdfFile: null,
    });
    setSubjects([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Handle filter changes
  const handleClassFilterChange = (classId) => {
    setClassFilter(classId);
    setSubjectFilter('');
    if (classId) {
      fetchSubjects(classId);
    } else {
      setSubjects([]);
    }
  };

  if (loading && syllabuses.length === 0) {
    return <FullPageLoader message="Loading syllabuses..." />;
  }

  return (
    <div className="p-6">
      <Card>
        <CardHeader className="border-b">
          <div className="flex items-center justify-between">
            <CardTitle>Syllabus Management</CardTitle>
            <Button onClick={handleAddNew}>
              <Plus className="w-4 h-4 mr-2" />
              Add Syllabus
            </Button>
          </div>
        </CardHeader>

        <CardContent>
          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <Input
              placeholder="Search syllabus..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              icon={Search}
            />
            <Dropdown
              placeholder="Filter by class"
              value={classFilter}
              onChange={(e) => handleClassFilterChange(e.target.value)}
              options={[{ value: '', label: 'All Classes' }, ...classes.map(c => ({ value: c._id, label: c.name }))]}
            />
            <Dropdown
              placeholder="Filter by subject"
              value={subjectFilter}
              onChange={(e) => setSubjectFilter(e.target.value)}
              options={[{ value: '', label: 'All Subjects' }, ...subjects.map(s => ({ value: s._id, label: s.name }))]}
            />
            <Dropdown
              placeholder="Filter by status"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              options={[{ value: '', label: 'All Status' }, ...SYLLABUS_STATUS]}
            />
          </div>

          {/* Table */}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Subject</TableHead>
                <TableHead>Class</TableHead>
                <TableHead>Academic Year</TableHead>
                <TableHead>PDF</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {syllabuses.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-gray-500">
                    No syllabuses found
                  </TableCell>
                </TableRow>
              ) : (
                syllabuses.map((syllabus) => (
                  <TableRow key={syllabus._id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4" />
                        {syllabus.subjectId?.name || 'N/A'}
                      </div>
                    </TableCell>
                    <TableCell>{syllabus.classId?.name || 'N/A'}</TableCell>
                    <TableCell>{syllabus.academicYear}</TableCell>
                    <TableCell>
                      {syllabus.pdfFile?.url ? (
                        <a 
                          href={syllabus.pdfFile.url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-900 flex items-center gap-1"
                        >
                          <File className="h-4 w-4" />
                          View PDF
                        </a>
                      ) : (
                        <span className="text-gray-400">No PDF</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <span
                        className={`px-2 py-1 rounded-full text-xs ${
                          syllabus.status === 'published'
                            ? 'bg-green-100 text-green-700'
                            : syllabus.status === 'approved'
                            ? 'bg-blue-100 text-blue-700'
                            : syllabus.status === 'submitted'
                            ? 'bg-yellow-100 text-yellow-700'
                            : syllabus.status === 'archived'
                            ? 'bg-red-100 text-red-700'
                            : 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {syllabus.status}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button variant="ghost" size="icon-sm" onClick={() => handleView(syllabus)} title="View">
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon-sm" onClick={() => handleEdit(syllabus)}>
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon-sm" onClick={() => handleDelete(syllabus._id)}>
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
              Showing {syllabuses.length} of {pagination.total} syllabuses
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
        onClose={handleCloseModal}
        title={isEditMode ? 'Edit Syllabus' : (currentSyllabus ? 'View Syllabus' : 'Add New Syllabus')}
        size="md"
        footer={
          currentSyllabus && !isEditMode ? (
            <div className="flex justify-between w-full">
              <div>
                {currentSyllabus.pdfFile?.url && (
                  <a
                    href={currentSyllabus.pdfFile.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
                  >
                    <Download className="h-4 w-4" />
                    Download PDF
                  </a>
                )}
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={handleCloseModal}>
                  Close
                </Button>
                <Button onClick={() => setIsEditMode(true)}>
                  <Edit className="w-4 h-4 mr-2" />
                  Edit
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={handleCloseModal}>
                Cancel
              </Button>
              <Button onClick={handleSubmit} disabled={submitting}>
                {submitting ? <ButtonLoader /> : isEditMode ? 'Update' : 'Create'}
              </Button>
            </div>
          )
        }
      >
        {currentSyllabus && !isEditMode ? (
          // View Mode
          <div className="space-y-4">
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-lg border border-blue-100">
              <h2 className="text-xl font-bold text-gray-900 mb-4">{currentSyllabus.title || 'Syllabus'}</h2>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-500 uppercase">Subject</p>
                  <p className="text-sm font-semibold text-gray-900">{currentSyllabus.subjectId?.name || '-'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase">Class</p>
                  <p className="text-sm font-semibold text-gray-900">{currentSyllabus.classId?.name || '-'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase">Academic Year</p>
                  <p className="text-sm font-semibold text-gray-900">{currentSyllabus.academicYear}</p>
                </div>
              </div>
            </div>

            {/* PDF Preview */}
            {currentSyllabus.pdfFile?.url ? (
              <div className="border rounded-lg p-4">
                <div className="flex items-center gap-3 mb-3">
                  <File className="h-8 w-8 text-red-600" />
                  <div>
                    <p className="font-medium text-gray-900">{currentSyllabus.pdfFile.name || 'Syllabus PDF'}</p>
                    <p className="text-sm text-gray-500">
                      {currentSyllabus.pdfFile.uploadedAt ? new Date(currentSyllabus.pdfFile.uploadedAt).toLocaleDateString() : ''}
                    </p>
                  </div>
                </div>
                <a
                  href={currentSyllabus.pdfFile.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-full text-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  <Eye className="inline h-4 w-4 mr-2" />
                  View PDF
                </a>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                No PDF uploaded
              </div>
            )}

            {/* Status */}
            <div className="flex items-center gap-2">
              <span className={`px-3 py-1 text-sm font-medium rounded-full ${
                currentSyllabus.status === 'published'
                  ? 'bg-green-100 text-green-800'
                  : currentSyllabus.status === 'approved'
                  ? 'bg-blue-100 text-blue-800'
                  : currentSyllabus.status === 'submitted'
                  ? 'bg-yellow-100 text-yellow-800'
                  : 'bg-gray-100 text-gray-800'
              }`}>
                {currentSyllabus.status?.charAt(0).toUpperCase() + currentSyllabus.status?.slice(1)}
              </span>
            </div>
          </div>
        ) : (
          // Form Mode
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Class *</label>
              <Dropdown
                name="classId"
                value={formData.classId}
                onChange={(e) => handleClassChange(e.target.value)}
                options={[
                  { value: '', label: 'Select Class' },
                  ...classes.map((c) => ({ value: c._id, label: c.name })),
                ]}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Subject *</label>
              <Dropdown
                name="subjectId"
                value={formData.subjectId}
                onChange={handleInputChange}
                options={[
                  { value: '', label: formData.classId ? 'Select Subject' : 'Select Class first' },
                  ...subjects.map((s) => ({ value: s._id, label: s.name })),
                ]}
                disabled={!formData.classId}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Academic Year *</label>
                <Input
                  type="text"
                  name="academicYear"
                  value={formData.academicYear}
                  onChange={handleInputChange}
                  placeholder="2024-2025"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Status</label>
                <Dropdown
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  options={SYLLABUS_STATUS}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Syllabus PDF {currentSyllabus?.pdfFile?.url ? '(Already uploaded - select new to replace)' : '*'}
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-blue-500 transition-colors">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="application/pdf"
                  onChange={handleFileChange}
                  className="hidden"
                  id="pdf-upload"
                />
                <label htmlFor="pdf-upload" className="cursor-pointer">
                  <Upload className="mx-auto h-10 w-10 text-gray-400" />
                  <p className="mt-2 text-sm text-gray-600">
                    {formData.pdfFile ? (
                      <span className="font-medium text-blue-600">{formData.pdfFile.name}</span>
                    ) : (
                      <>
                        <span className="font-medium text-blue-600">Click to upload</span> or drag and drop
                      </>
                    )}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">PDF only (max 10MB)</p>
                </label>
              </div>
              {currentSyllabus?.pdfFile?.url && !formData.pdfFile && (
                <div className="mt-2 p-2 bg-green-50 rounded-lg flex items-center gap-2">
                  <File className="h-4 w-4 text-green-600" />
                  <span className="text-sm text-green-700">Current: {currentSyllabus.pdfFile.name}</span>
                  <a 
                    href={currentSyllabus.pdfFile.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="ml-auto text-sm text-blue-600 hover:text-blue-800"
                  >
                    View
                  </a>
                </div>
              )}
            </div>

            <div className="text-sm text-gray-500 bg-blue-50 p-3 rounded-lg">
              <strong>Note:</strong> Select a class and subject, then upload the PDF syllabus file.
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
