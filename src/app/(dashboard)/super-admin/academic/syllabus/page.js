'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import apiClient from '@/lib/api-client';
import { toast } from 'sonner';
import { FileText, Plus, Search, Edit, Trash2, X, Eye, Download, Upload, File } from 'lucide-react';
import Input from '@/components/ui/input';
import Dropdown from '@/components/ui/dropdown';
import AcademicYearDropdown from '@/components/ui/AcademicYearDropdown';
import Modal from '@/components/ui/modal';
import Table, { TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Card, CardContent } from '@/components/ui/card';
import BranchSelect from '@/components/ui/branch-select';
import ClassSelect from '@/components/ui/class-select';
import { API_ENDPOINTS } from '@/constants/api-endpoints';

export default function SyllabusPage() {
  const { user } = useAuth();
  const [syllabus, setSyllabus] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [classes, setClasses] = useState([]);
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [viewingSyllabus, setViewingSyllabus] = useState(null);
  const [editingSyllabus, setEditingSyllabus] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedBranch, setSelectedBranch] = useState('');
  const [selectedClassFilter, setSelectedClassFilter] = useState('');
  const [uploading, setUploading] = useState(false);

  const currentYear = new Date().getFullYear();
  const [formData, setFormData] = useState({
    branchId: '',
    classId: '',
    subjectId: '',
    academicYear: '',
    status: 'draft',
    pdfFile: null,
  });

  const fileInputRef = useRef(null);
  const formRef = useRef(null);

  useEffect(() => {
    fetchSyllabus();
    fetchBranches();
  }, [searchTerm, selectedSubject, selectedBranch, selectedClassFilter]);

  const fetchSyllabus = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        limit: '100',
        ...(searchTerm && { search: searchTerm }),
        ...(selectedBranch && { branchId: selectedBranch }),
        ...(selectedClassFilter && { classId: selectedClassFilter }),
        ...(selectedSubject && { subjectId: selectedSubject }),
      });

      const response = await apiClient.get(`/api/super-admin/syllabus?${params}`);

      if (response.success) {
        setSyllabus(response.data);
      }
    } catch (error) {
      toast.error('Failed to fetch syllabus');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const fetchBranches = async () => {
    try {
      const response = await apiClient.get('/api/super-admin/branches?limit=200');
      if (response?.success) {
        const list = response.data?.branches || response.data || [];
        setBranches(list);
      }
    } catch (error) {
      console.error('Failed to fetch branches:', error);
    }
  };

  const fetchClasses = async (branchId) => {
    try {
      console.log('Fetching classes for branchId:', branchId);
      const params = new URLSearchParams({ limit: '200', ...(branchId && { branchId }) });
      const response = await apiClient.get(`/api/super-admin/classes?${params}`);
      console.log('Classes response:', response);
      
      if (response?.success) {
        const list = response.data || response.data?.classes || [];
        setClasses(list);
        console.log('Classes set:', list.length);
        
        if (list.length === 0) {
          toast.info('No classes found for this branch');
        }
      } else {
        console.error('Failed to fetch classes:', response.message);
        toast.error(response.message || 'Failed to fetch classes');
      }
    } catch (error) {
      console.error('Failed to fetch classes:', error);
      toast.error('Error loading classes. Please try again.');
    }
  };

  const fetchSubjects = async (classId, branchId) => {
    try {
      console.log('Fetching subjects for classId:', classId, 'branchId:', branchId);
      const params = new URLSearchParams({ limit: '200', ...(classId && { classId }), ...(branchId && { branchId }) });
      const response = await apiClient.get(`/api/super-admin/subjects?${params}`);
      console.log('Subjects response:', response);
      
      if (response?.success) {
        const list = response.data || response.data?.subjects || [];
        setSubjects(list);
        console.log('Subjects set:', list.length);
        
        if (list.length === 0) {
          toast.info('No subjects found for this class');
        }
      } else {
        console.error('Failed to fetch subjects:', response.message);
        toast.error(response.message || 'Failed to fetch subjects');
      }
    } catch (error) {
      console.error('Failed to fetch subjects:', error);
      toast.error('Error loading subjects. Please try again.');
    }
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.branchId) {
      toast.error('Please select a branch');
      return;
    }
    if (!formData.classId) {
      toast.error('Please select a class');
      return;
    }
    if (!formData.subjectId) {
      toast.error('Please select a subject');
      return;
    }
    if (!formData.pdfFile && !editingSyllabus?.pdfFile?.url) {
      toast.error('Please upload a PDF file');
      return;
    }

    try {
      setUploading(true);

      let pdfUrl = editingSyllabus?.pdfFile?.url;
      let pdfPublicId = editingSyllabus?.pdfFile?.publicId;
      let pdfName = editingSyllabus?.pdfFile?.name;

      // Upload PDF if new file selected
      if (formData.pdfFile) {
        const uploadFormData = new FormData();
        uploadFormData.append('file', formData.pdfFile);
        uploadFormData.append('fileType', 'syllabus_pdf');
        uploadFormData.append('classId', formData.classId);
        uploadFormData.append('branchId', formData.branchId);
        
        if (editingSyllabus?._id) {
          uploadFormData.append('syllabusId', editingSyllabus._id);
        }

        const uploadResponse = await apiClient.post('/api/upload', uploadFormData);
        
        if (uploadResponse.success) {
          pdfUrl = uploadResponse.data.url;
          pdfPublicId = uploadResponse.data.publicId;
          pdfName = formData.pdfFile.name;
        } else {
          toast.error('Failed to upload PDF');
          return;
        }
      }

      const syllabusData = {
        branchId: formData.branchId,
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

      if (editingSyllabus) {
        const response = await apiClient.put(
          `/api/super-admin/syllabus/${editingSyllabus._id}`,
          syllabusData
        );
        if (response.success) {
          toast.success('Syllabus updated successfully');
          fetchSyllabus();
          handleCloseModal();
        }
      } else {
        const response = await apiClient.post('/api/super-admin/syllabus', syllabusData);
        if (response.success) {
          toast.success('Syllabus created successfully');
          fetchSyllabus();
          handleCloseModal();
        }
      }
    } catch (error) {
      toast.error(error.message || 'Failed to save syllabus');
      console.error(error);
    } finally {
      setUploading(false);
    }
  };

  const handleEdit = async (syl) => {
    setEditingSyllabus(syl);
    const branchId = syl.branchId?._id || syl.branchId;
    const classId = syl.classId?._id || syl.classId;
    const subjectId = syl.subjectId?._id || syl.subjectId;
    const academicYearId = syl.academicYear?._id || syl.academicYear || '';
    
    setFormData({
      branchId: branchId || '',
      classId: classId || '',
      subjectId: subjectId || '',
      academicYear: academicYearId,
      status: syl.status || 'draft',
      pdfFile: null,
    });
    
    // Load classes and subjects for this syllabus
    if (branchId) {
      fetchClasses(branchId);
    }
    if (classId && branchId) {
      fetchSubjects(classId, branchId);
    }
    
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this syllabus?')) return;
    
    try {
      const response = await apiClient.delete(`/api/super-admin/syllabus/${id}`);
      
      if (response.success) {
        toast.success('Syllabus deleted successfully');
        fetchSyllabus();
      }
    } catch (error) {
      toast.error(error.message || 'Failed to delete');
    }
  };

  const handleView = (syl) => {
    setViewingSyllabus(syl);
    setShowViewModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingSyllabus(null);
    setFormData({
      branchId: '',
      classId: '',
      subjectId: '',
      academicYear: '',
      status: 'draft',
      pdfFile: null,
    });
    setSubjects([]);
    setClasses([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Handle filter changes
  const handleBranchFilterChange = (branchId) => {
    setSelectedBranch(branchId);
    setSelectedClassFilter('');
    setSelectedSubject('');
    if (branchId) {
      fetchClasses(branchId);
    } else {
      setClasses([]);
    }
  };

  const handleClassFilterChange = (classId) => {
    setSelectedClassFilter(classId);
    setSelectedSubject('');
    if (classId && selectedBranch) {
      fetchSubjects(classId, selectedBranch);
    }
  };

  // Handle form field changes
  const handleFormBranchChange = (branchId) => {
    setFormData({ ...formData, branchId, classId: '', subjectId: '' });
    setSubjects([]);
    if (branchId) {
      fetchClasses(branchId);
    } else {
      setClasses([]);
    }
  };

  const handleFormClassChange = (classId) => {
    setFormData({ ...formData, classId, subjectId: '' });
    if (classId && formData.branchId) {
      fetchSubjects(classId, formData.branchId);
    } else {
      setSubjects([]);
    }
  };

  return (
    <div className="p-6">
      <div className="mb-6 pt-8">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <FileText className="h-7 w-7" />
          Syllabus Management
        </h1>
        <p className="text-gray-600 mt-1">Upload and manage course syllabus PDFs</p>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-6">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex-1 min-w-[200px]">
            <Input placeholder="Search syllabus..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} icon={Search} />
          </div>

          <div className="w-full sm:w-56">
            <Dropdown id="filter-branch" name="branch" value={selectedBranch} onChange={(e) => handleBranchFilterChange(e.target.value)} options={[{label: 'All Branches', value: ''}, ...branches.map(br=>({label: br.name, value: br._id}))]} placeholder="All Branches" />
          </div>

          <div className="w-full sm:w-56">
            <Dropdown id="filter-class" name="class" value={selectedClassFilter} onChange={(e) => handleClassFilterChange(e.target.value)} options={[{label:'All Classes', value:''}, ...classes.map(c=>({label:c.name,value:c._id}))]} placeholder="All Classes" />
          </div>

          <div className="w-full sm:w-56">
            <Dropdown id="filter-subject" name="subject" value={selectedSubject} onChange={(e)=>setSelectedSubject(e.target.value)} options={[{label:'All Subjects', value:''}, ...subjects.map(s=>({label:s.name, value:s._id}))]} placeholder="All Subjects" />
          </div>

          <button
            onClick={() => setShowModal(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 whitespace-nowrap"
          >
            <Plus className="h-5 w-5" />
            Add Syllabus
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading...</div>
        ) : syllabus.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No syllabus found</div>
        ) : (
          <Table className="w-full">
            <TableHeader className="bg-gray-50 border-b border-gray-200">
              <TableRow>
                <TableHead className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Subject</TableHead>
                <TableHead className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Class</TableHead>
                <TableHead className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Branch</TableHead>
                <TableHead className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Year</TableHead>
                <TableHead className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">PDF</TableHead>
                <TableHead className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</TableHead>
                <TableHead className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody className="bg-white divide-y divide-gray-200">
              {syllabus.map((syl) => (
                <TableRow key={syl._id} className="hover:bg-gray-50">
                  <TableCell className="px-6 py-4 text-sm font-medium text-gray-900">{syl.subjectId?.name || '-'}</TableCell>
                  <TableCell className="px-6 py-4 text-sm text-gray-900">{syl.classId?.name || '-'}</TableCell>
                  <TableCell className="px-6 py-4 text-sm text-gray-900">{syl.branchId?.name || '-'}</TableCell>
                  <TableCell className="px-6 py-4 text-sm text-gray-900">{syl.academicYear?.yearName || syl.academicYear || '-'}</TableCell>
                  <TableCell className="px-6 py-4 text-sm">
                    {syl.pdfFile?.url ? (
                      <a 
                        href={syl.pdfFile.url} 
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
                  <TableCell className="px-6 py-4">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      syl.status === 'approved'
                        ? 'bg-green-100 text-green-800'
                        : syl.status === 'submitted'
                        ? 'bg-blue-100 text-blue-800'
                        : syl.status === 'published'
                        ? 'bg-purple-100 text-purple-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {syl.status.charAt(0).toUpperCase() + syl.status.slice(1)}
                    </span>
                  </TableCell>
                  <TableCell className="px-6 py-4 text-sm font-medium">
                    <div className="flex items-center gap-2">
                      <button onClick={() => handleView(syl)} className="text-green-600 hover:text-green-900" title="View"><Eye className="h-4 w-4" /></button>
                      <button onClick={() => handleEdit(syl)} className="text-blue-600 hover:text-blue-900" title="Edit"><Edit className="h-4 w-4" /></button>
                      <button onClick={() => handleDelete(syl._id)} className="text-red-600 hover:text-red-900" title="Delete"><Trash2 className="h-4 w-4" /></button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      {/* Modal */}
      <Modal
        open={showModal}
        onClose={handleCloseModal}
        title={editingSyllabus ? 'Edit Syllabus' : 'Add New Syllabus'}
        size="md"
        footer={
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={handleCloseModal}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => formRef.current?.requestSubmit?.() || formRef.current?.submit?.()}
              disabled={uploading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {uploading ? 'Uploading...' : (editingSyllabus ? 'Update' : 'Add')} Syllabus
            </button>
          </div>
        }
      >
        <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Branch *</label>
            <Dropdown
              id="form-branch"
              name="branchId"
              value={formData.branchId}
              onChange={(e) => handleFormBranchChange(e.target.value)}
              options={[
                { label: 'Select Branch', value: '' },
                ...branches.map(br => ({ label: br.name, value: br._id }))
              ]}
              placeholder="Select Branch"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Class *</label>
            <Dropdown
              id="form-class"
              name="classId"
              value={formData.classId}
              onChange={(e) => handleFormClassChange(e.target.value)}
              options={[
                { label: formData.branchId ? 'Select Class' : 'Select Branch first', value: '' },
                ...classes.map(c => ({ label: c.name, value: c._id }))
              ]}
              placeholder="Select Class"
              disabled={!formData.branchId}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Subject *</label>
            <Dropdown
              id="form-subject"
              name="subjectId"
              value={formData.subjectId}
              onChange={(e) => setFormData({ ...formData, subjectId: e.target.value })}
              options={[
                { label: formData.classId ? 'Select Subject' : 'Select Class first', value: '' },
                ...subjects.map(s => ({ label: s.name, value: s._id }))
              ]}
              placeholder="Select Subject"
              disabled={!formData.classId}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Academic Year *</label>
              <AcademicYearDropdown
                value={formData.academicYear}
                onChange={(e) => setFormData({ ...formData, academicYear: e.target.value })}
                branchId={formData.branchId}
                required={true}
                placeholder="Select Academic Year"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <Dropdown
                name="status"
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                options={[
                  { label: 'Draft', value: 'draft' },
                  { label: 'Submitted', value: 'submitted' },
                  { label: 'Approved', value: 'approved' },
                  { label: 'Published', value: 'published' }
                ]}
                placeholder="Select Status"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Syllabus PDF {editingSyllabus?.pdfFile?.url ? '(Already uploaded - select new to replace)' : '*'}
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
            {editingSyllabus?.pdfFile?.url && !formData.pdfFile && (
              <div className="mt-2 p-2 bg-green-50 rounded-lg flex items-center gap-2">
                <File className="h-4 w-4 text-green-600" />
                <span className="text-sm text-green-700">Current: {editingSyllabus.pdfFile.name}</span>
                <a 
                  href={editingSyllabus.pdfFile.url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="ml-auto text-sm text-blue-600 hover:text-blue-800"
                >
                  View
                </a>
              </div>
            )}
          </div>
        </form>
      </Modal>

      {/* View Syllabus Modal */}
      <Modal
        open={showViewModal}
        onClose={() => { setShowViewModal(false); setViewingSyllabus(null); }}
        title="Syllabus Details"
        size="md"
        footer={
          <div className="flex justify-end gap-3">
            <button
              onClick={() => { setShowViewModal(false); setViewingSyllabus(null); }}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
            >
              Close
            </button>
            {viewingSyllabus?.pdfFile?.url && (
              <a
                href={viewingSyllabus.pdfFile.url}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                Download PDF
              </a>
            )}
          </div>
        }
      >
        {viewingSyllabus && (
          <div className="space-y-4">
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-lg border border-blue-100">
              <h2 className="text-xl font-bold text-gray-900 mb-4">{viewingSyllabus.title || 'Syllabus'}</h2>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-500 uppercase">Subject</p>
                  <p className="text-sm font-semibold text-gray-900">{viewingSyllabus.subjectId?.name || '-'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase">Class</p>
                  <p className="text-sm font-semibold text-gray-900">{viewingSyllabus.classId?.name || '-'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase">Branch</p>
                  <p className="text-sm font-semibold text-gray-900">{viewingSyllabus.branchId?.name || '-'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase">Academic Year</p>
                  <p className="text-sm font-semibold text-gray-900">{viewingSyllabus.academicYear?.yearName || viewingSyllabus.academicYear || '-'}</p>
                </div>
              </div>
            </div>

            {/* PDF Preview */}
            {viewingSyllabus.pdfFile?.url ? (
              <div className="border rounded-lg p-4">
                <div className="flex items-center gap-3 mb-3">
                  <File className="h-8 w-8 text-red-600" />
                  <div>
                    <p className="font-medium text-gray-900">{viewingSyllabus.pdfFile.name || 'Syllabus PDF'}</p>
                    <p className="text-sm text-gray-500">
                      {viewingSyllabus.pdfFile.uploadedAt ? new Date(viewingSyllabus.pdfFile.uploadedAt).toLocaleDateString() : ''}
                    </p>
                  </div>
                </div>
                <a
                  href={viewingSyllabus.pdfFile.url}
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
                viewingSyllabus.status === 'approved'
                  ? 'bg-green-100 text-green-800'
                  : viewingSyllabus.status === 'submitted'
                  ? 'bg-blue-100 text-blue-800'
                  : viewingSyllabus.status === 'published'
                  ? 'bg-purple-100 text-purple-800'
                  : 'bg-gray-100 text-gray-800'
              }`}>
                {viewingSyllabus.status?.charAt(0).toUpperCase() + viewingSyllabus.status?.slice(1)}
              </span>
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t">
              <button
                onClick={() => {
                  setShowViewModal(false);
                  handleEdit(viewingSyllabus);
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
              >
                <Edit className="h-4 w-4" />
                Edit Syllabus
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
