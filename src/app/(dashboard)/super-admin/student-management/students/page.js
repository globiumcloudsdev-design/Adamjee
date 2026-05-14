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
import { Plus, Edit, Trash2, Search, Eye, Mail, Phone, User, Download } from 'lucide-react';
import jsPDF from 'jspdf';
import * as XLSX from 'xlsx';
import QRCode from 'qrcode';
import { pdf } from '@react-pdf/renderer';
import StudentCardPDF from '@/components/StudentCardPDF';
import { generateAndDownloadIdCard } from '@/lib/idCardGenerator';
import { useAuth } from '@/hooks/useAuth';
import apiClient from '@/lib/api-client';
import { API_ENDPOINTS } from '@/constants/api-endpoints';
import StudentFormModal from '@/components/forms/StudentFormModal';
import StudentViewModal from '@/components/modals/StudentViewModal';
import { toast } from 'sonner';
import UserManagementTable from '@/components/common/UserManagementTable';
import ConfirmDeleteModal from '@/components/modals/ConfirmDeleteModal';
import { withAuth } from '@/hooks/useAuth';
import { ROLES } from '@/constants/roles';

const SuperAdminStudentsPage = () => {
  const { user } = useAuth();
  const [students, setStudents] = useState([]);
  const [branches, setBranches] = useState([]);
  const [classes, setClasses] = useState([]);
  const [allClasses, setAllClasses] = useState([]); // All classes for modal (cascading)
  const [allGroups, setAllGroups] = useState([]); // All groups for cascading dropdown
  const [allAcademicYears, setAllAcademicYears] = useState([]); // Academic years for dropdown
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  const [viewingStudent, setViewingStudent] = useState(null);

  const [submitting, setSubmitting] = useState(false);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [grSearch, setGrSearch] = useState('');
  const [debouncedGrSearch, setDebouncedGrSearch] = useState('');
  const [branchFilter, setBranchFilter] = useState('');
  const [classFilter, setClassFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, pages: 0 });
  const [deleteModal, setDeleteModal] = useState({ open: false, student: null });
  const [isCardModalOpen, setIsCardModalOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [cardStatus, setCardStatus] = useState({
    issueDate: '',
    expireDate: '',
    status: 'active',
    printCount: 0,
  });
  const [qrCodeUrl, setQrCodeUrl] = useState('');

  // --- Fetch Functions ---

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const params = {};
      if (branchFilter) params.branch_id = branchFilter;
      if (classFilter) params.class_id = classFilter;
 
      let response;
      if (debouncedGrSearch && debouncedGrSearch.trim()) {
        params.roll_no = debouncedGrSearch;
        response = await apiClient.get(API_ENDPOINTS.SUPER_ADMIN.STUDENTS.GR_SEARCH, params);
      } else if (debouncedSearch && debouncedSearch.trim()) {
        params.q = debouncedSearch;
        response = await apiClient.get(API_ENDPOINTS.SUPER_ADMIN.STUDENTS.SEARCH, params);
      } else {
        response = await apiClient.get(API_ENDPOINTS.SUPER_ADMIN.STUDENTS.LIST, params);
      }

      // Response is the students array directly from NextResponse.json(students)
      const studentsData = Array.isArray(response) ? response : (response.data || response.students || []);
      setStudents(studentsData);
      setPagination(prev => ({ ...prev, total: studentsData.length, pages: Math.ceil(studentsData.length / prev.limit) }));
    } catch (error) {
      console.error('Error fetching students:', error);
      toast.error('Failed to load students');
    } finally {
      setLoading(false);
    }
  };

  const fetchBranches = async () => {
    try {
      const response = await apiClient.get(API_ENDPOINTS.SUPER_ADMIN.BRANCHES.LIST);
      const branchesData = Array.isArray(response) ? response : (response.data?.branches || response.branches || response.data || []);
      setBranches(branchesData);
    } catch (error) {
      console.error('Error fetching branches:', error);
    }
  };

  const fetchClasses = async () => {
    try {
      const response = await apiClient.get('/api/classes');
      const classesData = Array.isArray(response) ? response : (response.data || []);
      setClasses(classesData);
      setAllClasses(classesData);
    } catch (error) {
      console.error('Error fetching classes:', error);
    }
  };

  const fetchGroups = async () => {
    try {
      const response = await apiClient.get('/api/groups');
      const groupsData = Array.isArray(response) ? response : (response.data || []);
      setAllGroups(groupsData);
    } catch (error) {
      console.error('Error fetching groups:', error);
    }
  };

  const fetchAcademicYears = async () => {
    try {
      const response = await apiClient.get('/api/academic-years');
      const yearsData = response.academic_years || (Array.isArray(response) ? response : []);
      setAllAcademicYears(yearsData);
    } catch (error) {
      console.error('Error fetching academic years:', error);
    }
  };

  // Initial load
  useEffect(() => {
    fetchBranches();
    fetchClasses();
    fetchGroups();
    fetchAcademicYears();
  }, []);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 500);
    return () => clearTimeout(timer);
  }, [search]);

  // Debounce GR search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedGrSearch(grSearch);
    }, 500);
    return () => clearTimeout(timer);
  }, [grSearch]);

  // Fetch students when filters change
  useEffect(() => {
    fetchStudents();
  }, [debouncedSearch, debouncedGrSearch, branchFilter, classFilter, statusFilter]);

  // Reset class filter when branch changes
  useEffect(() => {
    setClassFilter('');
  }, [branchFilter]);

  // --- Helper: Get display values from PostgreSQL student ---
  const getStudentName = (student) => {
    return `${student.first_name || ''} ${student.last_name || ''}`.trim() || 'N/A';
  };

  const getStudentClassName = (student) => {
    const classId = student.details?.academic_info?.class_id;
    if (!classId) return 'Not Assigned';
    const classObj = classes.find(c => c.id === classId);
    return classObj?.name || 'Not Assigned';
  };

  const getStudentBranchName = (student) => {
    if (student.branch?.name) return student.branch.name;
    const branchObj = branches.find(b => b.id === student.branch_id);
    return branchObj?.name || 'N/A';
  };

  const getStudentRegistrationNo = (student) => {
    return student.registration_no || 'N/A';
  };

  const getStudentSectionName = (student) => {
    const details = student.details?.academic_info || {};
    // If name is already there (some branches might store it)
    if (details.section_name) return details.section_name;
    // Fallback to ID or '-'
    return details.section_id || '-';
  };

  const getStudentGroupName = (student) => {
    const groupId = student.details?.academic_info?.group_id;
    if (!groupId) return '-';
    const groupObj = allGroups.find(g => g.id === groupId || g._id === groupId);
    return groupObj?.name || '-';
  };

  const getParentInfo = (student) => {
    const details = student.details?.academic_info || {};
    const fatherName = details.father?.name;
    const guardianName = details.guardian?.name;
    const fatherPhone = details.father?.phone;
    const guardianPhone = details.guardian?.phone;
    return {
      name: fatherName || guardianName || '-',
      phone: fatherPhone || guardianPhone || '-',
    };
  };

  // --- Filter students client-side for search and status ---
  const filteredStudents = students.filter(student => {
    const name = getStudentName(student).toLowerCase();
    const email = (student.email || '').toLowerCase();
    const regNo = (student.registration_no || '').toLowerCase();
    const searchLower = search.toLowerCase();

    const matchesSearch = !debouncedSearch || name.includes(debouncedSearch.toLowerCase()) || email.includes(debouncedSearch.toLowerCase()) || regNo.includes(debouncedSearch.toLowerCase());
    const matchesStatus = !statusFilter || student.is_active === (statusFilter === 'active');

    return matchesStatus; // Server already filtered search if debouncedSearch was provided
  });

  // Paginated students
  const paginatedStudents = filteredStudents.slice(
    (pagination.page - 1) * pagination.limit,
    pagination.page * pagination.limit,
  );
  const totalPages = Math.ceil(filteredStudents.length / pagination.limit);

  // --- Handlers ---

  const handleFormSubmit = async (submissionData) => {
    try {
      setSubmitting(true);

      if (submissionData.isEditMode) {
        await apiClient.put(
          API_ENDPOINTS.SUPER_ADMIN.STUDENTS.UPDATE.replace(':id', submissionData.studentId),
          submissionData
        );
        toast.success('Student updated successfully!');
      } else {
        await apiClient.post(API_ENDPOINTS.SUPER_ADMIN.STUDENTS.CREATE, submissionData);
        toast.success('Student enrolled successfully!');
      }

      setIsFormModalOpen(false);
      setEditingStudent(null);
      fetchStudents();
    } catch (error) {
      console.error('Error saving student:', error);
      toast.error(error.message || 'Failed to save student');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (student) => {
    // Map PostgreSQL user model to StudentFormModal format
    const details = student.details?.academic_info || {};
    const editData = {
      id: student.id,
      _id: student.id,
      firstName: student.first_name,
      lastName: student.last_name,
      email: student.email,
      phone: student.phone,
      registration_no: student.registration_no,
      alternatePhone: details.alternate_phone || '',
      dateOfBirth: details.date_of_birth || '',
      gender: details.gender || 'male',
      bloodGroup: details.blood_group || '',
      nationality: details.nationality || 'Pakistani',
      religion: details.religion || '',
      cnic: details.cnic || '',
      address: details.address || { street: '', city: '', state: '', postalCode: '', country: 'Pakistan' },
      branchId: student.branch_id,
      groupId: details.group_id || '',
      status: details.status || 'active',
      remarks: details.remarks || '',
      selectedSubjects: details.selected_subjects || details.subjects || [],
      studentProfile: {
        classId: details.class_id || '',
        groupId: details.group_id || '',
        section: details.section_id || '',
        rollNumber: details.roll_no || '',
        admissionDate: details.admission_date,
        academicYear: details.academic_year_id || '',
        father: details.father || { name: '', occupation: '', phone: '', email: '', cnic: '', income: 0 },
        mother: details.mother || { name: '', occupation: '', phone: '', email: '', cnic: '' },
        guardian: details.guardian || { name: '', relation: '', phone: '', email: '', cnic: '' },
        guardianType: details.guardian_type || 'parent',
        previousCoaching: details.previous_coaching || { name: '', lastClass: '', marks: 0, leavingDate: '' },
        feeDiscount: details.fee_discount || { type: 'fixed', amount: details.discount !== undefined ? details.discount : 0, reason: '' },
        transportFee: details.transport_fee || { enabled: false, routeId: '', amount: 0 },
        selectedSubjects: details.selected_subjects || details.subjects || [],
        documents: student.details?.documents || [],
        feeMention: details.fee_mention || 'Monthly',
        installmentCount: details.installment_count || 1,
      },
      medicalInfo: details.medical_info || { allergies: '', chronicConditions: '', medications: '', doctorName: '', doctorPhone: '' },
      emergencyContact: details.emergency_contact || { name: '', relationship: '', phone: '' },
      profilePhoto: student.avatar_url ? { url: student.avatar_url } : null,
    };

    setEditingStudent(editData);
    setIsFormModalOpen(true);
  };

  const handleView = (student) => {
    setViewingStudent(student);
    setIsViewModalOpen(true);
  };

  const openDeleteModal = (studentId) => {
    const student = students.find(s => s.id === studentId);
    setDeleteModal({ open: true, student });
  };

  const handleDelete = async () => {
    if (!deleteModal.student) return;

    try {
      setSubmitting(true);
      await apiClient.delete(
        API_ENDPOINTS.SUPER_ADMIN.STUDENTS.DELETE.replace(':id', deleteModal.student.id)
      );
      toast.success('Student deleted successfully!');
      setDeleteModal({ open: false, student: null });
      fetchStudents();
    } catch (error) {
      toast.error(error.message || 'Failed to delete student');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddNew = () => {
    setEditingStudent(null);
    setIsFormModalOpen(true);
  };

  const handleToggleStatus = async (student) => {
    try {
      const newStatus = !student.is_active;
      await apiClient.put(
        API_ENDPOINTS.SUPER_ADMIN.STUDENTS.UPDATE.replace(':id', student.id),
        { is_active: newStatus }
      );
      toast.success(`Student ${newStatus ? 'activated' : 'deactivated'} successfully!`);
      fetchStudents();
    } catch (error) {
      toast.error(error.message || 'Failed to update status');
    }
  };

  const exportToExcel = () => {
    try {
      const exportData = filteredStudents.map(student => ({
        'Student Name': getStudentName(student),
        'Email': student.email || '',
        'Registration Number': getStudentRegistrationNo(student),
        'Class': getStudentClassName(student),
        'Branch': getStudentBranchName(student),
        'Parent Name': getParentInfo(student).name,
        'Parent Phone': getParentInfo(student).phone,
        'Status': student.is_active ? 'Active' : 'Inactive',
        'Phone': student.phone || '-',
      }));

      const ws = XLSX.utils.json_to_sheet(exportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Students');
      const fileName = `students_export_${new Date().toISOString().split('T')[0]}.xlsx`;
      XLSX.writeFile(wb, fileName);
    } catch (error) {
      console.error('Error exporting to Excel:', error);
      toast.error('Failed to export students data.');
    }
  };

  const handleDownloadCard = async (student) => {
    if (!student) {
      toast.error('No student data found');
      return;
    }

    try {
      setSubmitting(true);
      toast.loading('Generating Card...', { id: 'card-gen' });
      
      // Prepare data for generator
      const studentData = {
        first_name: student.first_name,
        last_name: student.last_name,
        registration_no: student.registration_no,
        avatar_url: student.avatar_url,
        class_name: getStudentClassName(student),
        section_name: getStudentSectionName(student),
        parent_name: getParentInfo(student).name,
        branch_name: getStudentBranchName(student),
        shift: student.details?.academic_info?.shift || 'Morning',
        id: student.id,
        details: student.details
      };
      
      const instituteData = branches.find(b => b.id === student.branch_id) || {
        name: 'ADAMJEE COACHING CENTRE',
        logo_url: '/adamjee-logo.png'
      };

      await generateAndDownloadIdCard({
        role: 'student',
        person: studentData,
        institute: instituteData,
      });

      toast.success('ID Card generated!', { id: 'card-gen' });
    } catch (error) {
      console.error('Card generation failed:', error);
      toast.error(`Error: ${error.message}`, { id: 'card-gen' });
    } finally {
      setSubmitting(false);
    }
  };

  // ---- Print Card on Pre-Printed Card (matches download card layout) ----
  const handlePrintCard = (student) => {
    if (!student) {
      toast.error('No student data found');
      return;
    }

    const studentName  = `${student.first_name || ''} ${student.last_name || ''}`.trim();
    const grNo         = student.details?.academic_info?.roll_no || student.registration_no || 'N/A';
    const className    = getStudentClassName(student);
    const sectionName  = getStudentSectionName(student);
    const photoUrl     = student.avatar_url || '';

    const subjectsArr  = student.details?.academic_info?.subjects || [];
    const subjectsText = subjectsArr.length > 0
      ? subjectsArr.map(s => s?.name || s).filter(Boolean).join(', ')
      : 'N/A';

    const qrValue = JSON.stringify({
      id: student.id,
      registrationNumber: student.registration_no || grNo,
      role: 'student',
      fullName: studentName
    });
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(qrValue)}&size=200x200&margin=2`;

    /*
     * Same layout as idCardGenerator.js — 3in × 4in portrait
     * Left 1.1in  = Adamjee pre-printed strip  → blank
     * Photo       : absolute left:1.4in, top:0.25in,  0.79in × 0.79in
     * Info fields : absolute left:1.1in, top:1.15in,  right:0.1in
     * QR          : absolute left:1.1in, bottom:0.15in, 0.72in × 0.72in
     */
    const printHTML = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Print Card – ${studentName}</title>
  <style>
    @page { size: 3in 4in; margin: 0; }
    *, *::before, *::after {
      box-sizing: border-box; margin: 0; padding: 0;
      -webkit-print-color-adjust: exact; print-color-adjust: exact;
      font-family: 'Segoe UI', Arial, sans-serif;
    }
    html, body { width: 3in; height: 4in; background: transparent; }
    .card { position: relative; width: 3in; height: 4in; background: transparent; overflow: hidden; }

    /* Photo */
    .photo-section { position: absolute; left: 1.4in; top: 0.25in; width: 0.79in; height: 0.79in; }
    .photo-box {
      width: 0.79in; height: 0.79in;
      border: 1px solid #1f3a93; overflow: hidden; background: #fff;
      display: flex; align-items: center; justify-content: center; border-radius: 2px;
    }
    .photo-box img { width: 100%; height: 100%; object-fit: cover; }
    .photo-placeholder { width: 100%; height: 100%; background: #f0f0f0; }

    /* Info */
    .info-section { position: absolute; left: 1.1in; top: 1.15in; right: 0.1in; color: #1f2937; }
    .info-field {
      display: grid; grid-template-columns: 0.72in 1fr;
      gap: 0.06in; margin-bottom: 0.09in; line-height: 1.2; align-items: start;
    }
    .field-label { font-size: 7px; font-weight: 700; color: #1f3a93; text-transform: uppercase; letter-spacing: 0.3px; }
    .field-value { font-size: 8px; font-weight: 600; color: #111827; word-break: break-word; line-height: 1.25; }
    .field-value.student-name { font-size: 8px; font-weight: 800; text-transform: uppercase; }
    .subject-value { font-size: 6.5px; line-height: 1.4; max-height: 0.32in; overflow: hidden; word-break: break-word; }

    /* QR */
    .qr-section {
      position: absolute; left: 1.1in; bottom: 0.15in;
      width: 0.72in; height: 0.72in;
      display: flex; align-items: center; justify-content: center;
    }
    .qr-section img { width: 100%; height: 100%; object-fit: contain; }
    .reg-text { position: absolute; left: 1.85in; bottom: 0.15in; font-size: 6px; color: #1f3a93; font-weight: 700; }

    @media print { html, body { background: transparent; } .card { border: none; } }
  </style>
</head>
<body>
  <div class="card">
    <div class="photo-section">
      <div class="photo-box">
        ${photoUrl ? `<img src="${photoUrl}" alt="photo" />` : `<div class="photo-placeholder"></div>`}
      </div>
    </div>
    <div class="info-section">
      <div class="info-field">
        <div class="field-label">Name:</div>
        <div class="field-value student-name">${studentName}</div>
      </div>
      <div class="info-field">
        <div class="field-label">GR No.:</div>
        <div class="field-value">${grNo}</div>
      </div>
      <div class="info-field">
        <div class="field-label">Class:</div>
        <div class="field-value">${className} – ${sectionName}</div>
      </div>
      <div class="info-field">
        <div class="field-label">Subject:</div>
        <div class="field-value subject-value">${subjectsText}</div>
      </div>
    </div>
    <div class="qr-section">
      <img src="${qrUrl}" alt="QR" />
    </div>
    <div class="reg-text">${student.registration_no || ''}</div>
  </div>
  <script>
    window.addEventListener('load', function () {
      var images = document.querySelectorAll('img');
      var total = images.length;
      if (total === 0) { setTimeout(function(){ window.print(); window.close(); }, 300); return; }
      var loaded = 0;
      function onDone() { loaded++; if (loaded >= total) { setTimeout(function(){ window.print(); window.close(); }, 300); } }
      images.forEach(function(img) {
        if (img.complete) { onDone(); } else { img.addEventListener('load', onDone); img.addEventListener('error', onDone); }
      });
    });
  <\/script>
</body>
</html>`;

    const pw = window.open('', '_blank', 'width=400,height=600');
    if (!pw) {
      toast.error('Popup blocked! Allow popups for this site and try again.');
      return;
    }
    pw.document.write(printHTML);
    pw.document.close();
  };

  const generateQRCode = async (data) => {
    try {
      const qrCodeData = JSON.stringify({
        studentId: data.id,
        registrationNumber: data.registration_no,
        name: getStudentName(data),
        branch: getStudentBranchName(data),
        class: getStudentClassName(data),
        timestamp: new Date().toISOString(),
      });

      const qrCodeUrl = await QRCode.toDataURL(qrCodeData, {
        width: 200,
        margin: 2,
        color: { dark: '#000000', light: '#FFFFFF' }
      });

      setQrCodeUrl(qrCodeUrl);
      return qrCodeUrl;
    } catch (error) {
      console.error('Error generating QR code:', error);
      return null;
    }
  };



  return (
    <div className="p-6 space-y-6">
      {/* Header Card */}
      <Card>
        <CardHeader className="border-b">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <CardTitle>Students Management</CardTitle>
              <p className="text-sm text-gray-600 mt-1">Super Admin Panel - Manage all students across branches</p>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="outline" onClick={exportToExcel}>
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
              <Button onClick={handleAddNew}>
                <Plus className="w-4 h-4 mr-2" />
                Add Student
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
            <Input
              placeholder="Search by Name..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                if (e.target.value) setGrSearch('');
              }}
              icon={Search}
            />
            <Input
              placeholder="GR Number Search"
              value={grSearch}
              onChange={(e) => {
                setGrSearch(e.target.value);
                if (e.target.value) setSearch('');
              }}
              icon={Search}
            />
            <Dropdown
              placeholder="Filter by branch"
              value={branchFilter}
              onChange={(e) => setBranchFilter(e.target.value)}
              options={[
                { value: '', label: 'All Branches' },
                ...branches.map(b => ({ value: b.id, label: b.name })),
              ]}
            />
            <Dropdown
              placeholder="Filter by class"
              value={classFilter}
              onChange={(e) => setClassFilter(e.target.value)}
              options={[
                { value: '', label: 'All Classes' },
                ...(branchFilter
                  ? classes.filter(c => c.branch_id === branchFilter).map(c => ({ value: c.id, label: c.name }))
                  : classes.map(c => ({ value: c.id, label: c.name }))
                ),
              ]}
            />
            <Dropdown
              placeholder="Filter by status"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              options={[
                { value: '', label: 'All Status' },
                { value: 'active', label: 'Active' },
                { value: 'inactive', label: 'Inactive' },
              ]}
            />
          </div>

          {/* Table */}
          <UserManagementTable
            data={paginatedStudents}
            loading={loading}
            onView={handleView}
            onEdit={handleEdit}
            onDelete={(id) => setDeleteModal({ open: true, student: students.find(s => s.id === id) })}
            onToggleStatus={handleToggleStatus}
            onPrintCard={handlePrintCard}
            onDownloadQR={handleDownloadCard}
          />

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-6">
              <div className="text-sm text-gray-600">
                Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, filteredStudents.length)} of {filteredStudents.length} students
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                  disabled={pagination.page === 1}
                >
                  Previous
                </Button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (pagination.page <= 3) {
                      pageNum = i + 1;
                    } else if (pagination.page >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = pagination.page - 2 + i;
                    }
                    
                    return (
                      <Button
                        key={pageNum}
                        variant={pagination.page === pageNum ? "default" : "outline"}
                        size="sm"
                        className="w-8 h-8 p-0"
                        onClick={() => setPagination(prev => ({ ...prev, page: pageNum }))}
                      >
                        {pageNum}
                      </Button>
                    );
                  })}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                  disabled={pagination.page >= totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Student Form Modal */}
      <StudentFormModal
        isOpen={isFormModalOpen}
        onClose={() => {
          setIsFormModalOpen(false);
          setEditingStudent(null);
        }}
        onSubmit={handleFormSubmit}
        editingStudent={editingStudent}
        isSubmitting={submitting}
        branches={branches}
        classes={allClasses}
        groups={allGroups}
        academicYears={allAcademicYears}
        departments={departments}
        userRole="SUPER_ADMIN"
      />

      {/* Student View Modal */}
      <StudentViewModal
        isOpen={isViewModalOpen}
        onClose={() => {
          setIsViewModalOpen(false);
          setViewingStudent(null);
        }}
        student={viewingStudent}
        branches={branches}
        classes={classes}
        departments={departments}
      />

      {/* Delete Confirmation Modal */}
      {/* Delete Confirmation Modal */}
      {deleteModal.open && (
        <ConfirmDeleteModal
          title="Delete Student"
          message={`Are you sure you want to delete ${deleteModal.student?.first_name} ${deleteModal.student?.last_name}? This action cannot be undone and will remove all student records.`}
          onConfirm={handleDelete}
          onCancel={() => setDeleteModal({ open: false, student: null })}
        />
      )}
    </div>
  );
};

const SuperAdminStudentsPageWithAuth = withAuth(SuperAdminStudentsPage, { requiredRole: ROLES.SUPER_ADMIN });
export default SuperAdminStudentsPageWithAuth;