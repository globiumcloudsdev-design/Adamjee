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
import autoTable from 'jspdf-autotable';
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
import AdminChangeUserPasswordModal from '@/components/modals/AdminChangeUserPasswordModal';
import StudentUploadModal from '@/components/modals/StudentUploadModal';

export default function BranchAdminStudentsPage() {
  const { user } = useAuth();

  // Branch Admin is locked to own branch
  const currentBranchId = user?.branch_id;

  const [students, setStudents] = useState([]);
  const [classes, setClasses] = useState([]);
  const [sections, setSections] = useState([]);
  const [branchGroups, setBranchGroups] = useState([]);
  const [academicYears, setAcademicYears] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  const [viewingStudent, setViewingStudent] = useState(null);
  const [uploadingStudent, setUploadingStudent] = useState(null);

  const [submitting, setSubmitting] = useState(false);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [grSearch, setGrSearch] = useState('');
  const [debouncedGrSearch, setDebouncedGrSearch] = useState('');
  const [classFilter, setClassFilter] = useState('');
  const [groupFilter, setGroupFilter] = useState('');
  const [sectionFilter, setSectionFilter] = useState('');
  const [subjectFilter, setSubjectFilter] = useState('');
  const [academicYearFilter, setAcademicYearFilter] = useState('');
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
  const [showPasswordModal, setShowPasswordModal] = useState(false);

  // --- Fetch Functions ---

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const params = {
        class_id: classFilter,
        group_id: groupFilter,
        section_id: sectionFilter,
        academic_year_id: academicYearFilter
      };

      let response;
      if (debouncedGrSearch && debouncedGrSearch.trim()) {
        params.roll_no = debouncedGrSearch;
        response = await apiClient.get(API_ENDPOINTS.BRANCH_ADMIN.STUDENTS.GR_SEARCH, params);
      } else if (debouncedSearch && debouncedSearch.trim()) {
        params.q = debouncedSearch;
        response = await apiClient.get(API_ENDPOINTS.BRANCH_ADMIN.STUDENTS.SEARCH, params);
      } else {
        response = await apiClient.get(API_ENDPOINTS.BRANCH_ADMIN.STUDENTS.LIST, params);
      }

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

  const fetchClasses = async () => {
    try {
      const response = await apiClient.get('/api/classes');
      const classesData = Array.isArray(response) ? response : (response.data || []);
      setClasses(classesData);
    } catch (error) {
      console.error('Error fetching classes:', error);
    }
  };

  const [subjectsList, setSubjectsList] = useState([]);
  useEffect(() => {
    if (classFilter) {
      apiClient.get(`/api/subjects?class_id=${classFilter}`)
        .then(res => setSubjectsList(Array.isArray(res) ? res : []))
        .catch(console.error);
    } else {
      setSubjectsList([]);
      setSubjectFilter('');
    }
  }, [classFilter]);

  const fetchGroups = async () => {
    try {
      const response = await apiClient.get('/api/groups');
      const groupsData = Array.isArray(response) ? response : (response.data || []);
      setBranchGroups(groupsData);
    } catch (error) {
      console.error('Error fetching groups:', error);
    }
  };

  const fetchSections = async () => {
    try {
      const response = await apiClient.get('/api/sections');
      const sectionsData = Array.isArray(response) ? response : (response.data || []);
      setSections(sectionsData);
    } catch (error) {
      console.error('Error fetching sections:', error);
    }
  };

  const fetchAcademicYears = async () => {
    try {
      const response = await apiClient.get('/api/academic-years');
      const yearsData = response.academic_years || (Array.isArray(response) ? response : []);
      setAcademicYears(yearsData);
    } catch (error) {
      console.error('Error fetching academic years:', error);
    }
  };

  // Initial load
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchClasses();
      fetchSections();
      fetchGroups();
      fetchAcademicYears();
    }, 0);
    return () => clearTimeout(timeoutId);
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
    const timeoutId = setTimeout(() => {
      fetchStudents();
    }, 0);
    return () => clearTimeout(timeoutId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch, debouncedGrSearch, classFilter, groupFilter, sectionFilter, subjectFilter, academicYearFilter, statusFilter]);

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

  const getStudentGrNo = (student) => {
    return student.details?.academic_info?.roll_no || student.registration_no || 'N/A';
  };

  const getStudentSectionName = (student) => {
    const details = student.details?.academic_info || {};
    if (details.section_name) return details.section_name;
    const sectionId = details.section_id;
    if (!sectionId) return '-';
    const sectionObj = sections.find(s => s.id === sectionId || s._id === sectionId);
    return sectionObj?.name || sectionId;
  };

  const getStudentGroupName = (student) => {
    const groupId = student.details?.academic_info?.group_id;
    if (!groupId) return '-';
    const groupObj = branchGroups.find(g => g.id === groupId || g._id === groupId);
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

    const matchesSubject = !subjectFilter || (
      student.details?.academic_info?.subjects &&
      student.details.academic_info.subjects.some(s => {
        const idMatch = (s.id === subjectFilter || s._id === subjectFilter);
        const sectionMatch = !sectionFilter || s.section_id === sectionFilter;
        return idMatch && sectionMatch;
      })
    );

    return matchesStatus && matchesSubject; // Server already filtered search if debouncedSearch was provided
  });

  const isFiltering = Boolean(search || grSearch || classFilter || groupFilter || sectionFilter || subjectFilter);

  // Paginated students
  const paginatedStudents = isFiltering ? filteredStudents : filteredStudents.slice(
    (pagination.page - 1) * pagination.limit,
    pagination.page * pagination.limit,
  );
  const totalPages = isFiltering ? 1 : Math.ceil(filteredStudents.length / pagination.limit);

  // --- Handlers ---

  const handleFormSubmit = async (submissionData) => {
    try {
      setSubmitting(true);

      if (submissionData.isEditMode) {
        await apiClient.put(
          API_ENDPOINTS.BRANCH_ADMIN.STUDENTS.UPDATE.replace(':id', submissionData.studentId),
          submissionData
        );
        toast.success('Student updated successfully!');
      } else {
        await apiClient.post(API_ENDPOINTS.BRANCH_ADMIN.STUDENTS.CREATE, submissionData);
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
      details: student.details, // Pass full details object
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
        feeEstimate: details.total_fee || details.fee_estimate || 0,
        total_fee: details.total_fee || details.fee_estimate || 0,
        admission_fee: details.admission_fee || 0, // Explicitly pass admission_fee
        payment_date: details.payment_date || '10',
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

  const handleUploadDocuments = (student) => {
    setUploadingStudent(student);
    setIsUploadModalOpen(true);
  };

  const handleDelete = async () => {
    if (!deleteModal.student) return;

    try {
      setSubmitting(true);
      await apiClient.delete(
        API_ENDPOINTS.BRANCH_ADMIN.STUDENTS.DELETE.replace(':id', deleteModal.student.id)
      );
      toast.success('Student deleted successfully!');
      setDeleteModal({ open: false, student: null });
      fetchStudents();
    } catch (error) {
      console.error('Error deleting student:', error);
      toast.error(error.message || 'Failed to delete student');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (student) => {
    try {
      const newStatus = !student.is_active;
      await apiClient.put(
        API_ENDPOINTS.BRANCH_ADMIN.STUDENTS.UPDATE.replace(':id', student.id),
        { is_active: newStatus }
      );
      toast.success(`Student ${newStatus ? 'activated' : 'deactivated'} successfully!`);
      fetchStudents();
    } catch (error) {
      console.error('Status update error:', error);
      toast.error(error.message || 'Failed to update status');
    }
  };

  const handleChangePassword = (student) => {
    setViewingStudent(student);
    setShowPasswordModal(true);
  };

  // const handleDownloadCard = async (student) => {
  //   try {
  //     toast.info('Generating ID card...');
  //     await generateAndDownloadIdCard(student);
  //     toast.success('ID Card downloaded!');
  //   } catch (error) {
  //     console.error('ID Card error:', error);
  //     toast.error('Failed to generate ID card');
  //   }
  // };

  const handleAddNew = () => {
    setEditingStudent(null);
    setIsFormModalOpen(true);
  };

  const exportToExcel = () => {
    try {
      const exportData = filteredStudents.map(student => ({
        'Student Name': getStudentName(student),
        'Email': student.email || '',
        'GR No': getStudentGrNo(student),
        'Class': getStudentClassName(student),
        'Section': getStudentSectionName(student),
        'Group': getStudentGroupName(student),
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

  const exportToPDF = async () => {
    try {
      const doc = new jsPDF('landscape');
      const pageWidth = doc.internal.pageSize.getWidth();

      // ── HEADER BACKGROUND ──────────────────────────────────────────
      doc.setFillColor(109, 40, 217); // violet-700
      doc.rect(0, 0, pageWidth, 38, 'F');

      // Logo
      try {
        const img = new Image();
        img.src = '/logo.png';
        await new Promise((res) => { img.onload = res; img.onerror = res; });
        doc.addImage(img, 'PNG', 8, 4, 28, 28);
      } catch (_) { }

      // School title
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(16);
      doc.text('Adamjee Coaching Center', 42, 14);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.text('Campus 12 \u2014 Students Report', 42, 21);

      // Date generated
      doc.setFontSize(7.5);
      doc.setTextColor(220, 200, 255);
      doc.text(`Generated: ${new Date().toLocaleString('en-PK')}`, 42, 27);

      // Reset text color for table
      doc.setTextColor(0, 0, 0);

      const getStudentSubjectsText = (student) => {
        const subjectsArr = student.details?.academic_info?.subjects || [];
        return subjectsArr.map(s => {
          const sName = s?.name || s;
          const secId = s?.section_id;
          let secNameStr = '';
          if (secId) {
            const secObj = sections.find(sec => sec.id === secId || sec._id === secId);
            if (secObj) secNameStr = ` (${secObj.name})`;
          }
          return sName ? `${sName}${secNameStr}` : '';
        }).filter(Boolean).join(', ') || '-';
      };

      const tableColumn = [
        "Name", "GR No", "Class", "Section", "Group",
        "Subjects", "Parent Name", "Parent Phone", "Student Phone"
      ];
      const tableRows = [];

      filteredStudents.forEach(student => {
        const studentData = [
          getStudentName(student),
          getStudentGrNo(student),
          getStudentClassName(student),
          getStudentSectionName(student),
          getStudentGroupName(student),
          getStudentSubjectsText(student),
          getParentInfo(student).name,
          getParentInfo(student).phone,
          student.phone || '-',
        ];
        tableRows.push(studentData);
      });

      autoTable(doc, {
        head: [tableColumn],
        body: tableRows,
        startY: 42,
        styles: { fontSize: 7, cellPadding: 2 },
        headStyles: { fillColor: [109, 40, 217] }, // match header background
      });

      const fileName = `students_export_${new Date().toISOString().split('T')[0]}.pdf`;
      doc.save(fileName);
      toast.success('PDF Exported Successfully!');
    } catch (error) {
      console.error('Error exporting to PDF:', error);
      toast.error('Failed to export to PDF');
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

      const studentData = {
        first_name: student.first_name,
        last_name: student.last_name,
        registration_no: student.registration_no,
        avatar_url: student.avatar_url,
        class_name: getStudentClassName(student),
        section_name: getStudentSectionName(student),
        parent_name: getParentInfo(student).name,
        branch_name: student.branch?.name || 'Main Campus',
        shift: student.details?.academic_info?.shift || 'Morning',
        gender: student.gender || student.details?.academic_info?.gender || 'male',
        photo_url: student.avatar_url || null,
        qr_code_url: student.qr_code_url || student.studentProfile?.qr?.url || null,
        id: student.id,
        details: student.details
      };

      const instituteData = {
        name: student.branch?.name || 'ADAMJEE COACHING CENTRE',
        logo_url: '/logo.png',
        address: student.branch?.address || 'City Branch, Pakistan',
        phone: student.branch?.contact?.phone || '+92 123 4567890',
        email: student.branch?.contact?.email || 'info@adamjee.edu.pk'
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

  // ---- Print Card on Pre-Printed Card (matches download card exactly) ----
  const handlePrintCard = (student) => {
    if (!student) {
      toast.error('No student data found');
      return;
    }

    const studentName = `${student.first_name || ''} ${student.last_name || ''}`.trim();
    const grNo = student.details?.academic_info?.roll_no || student.registration_no || 'N/A';
    const className = getStudentClassName(student);
    const sectionName = getStudentSectionName(student);

    // Academic Session
    const academicYearId = student.details?.academic_info?.academic_year_id;
    const academicYearObj = academicYears.find(ay => ay.id === academicYearId);
    const sessionName = academicYearObj?.name
      || student.details?.academic_info?.academic_year_name
      || student.details?.academic_info?.academic_year
      || 'N/A';

    const subjectsArr = student.details?.academic_info?.subjects || [];
    const subjectsText = subjectsArr.length > 0
      ? subjectsArr.map(s => {
        const sName = s?.name || s;
        const secId = s?.section_id;
        let secNameStr = '';
        if (secId) {
          const secObj = sections.find(sec => sec.id === secId || sec._id === secId);
          if (secObj) secNameStr = ` (${secObj.name})`;
        }
        return sName ? `${sName}${secNameStr}` : '';
      }).filter(Boolean).join(', ')
      : 'N/A';

    const idCardFormat = student.branch?.settings?.idCardFormat || 'barcode';

    let codeHTML = '';

    if (idCardFormat === 'qrcode') {
      const qrValue = JSON.stringify({ id: student.id });
      // SVG Format for clean black vector path printing
      const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(qrValue)}&size=300x300&margin=0&color=0-0-0&bgcolor=255-255-255&format=svg`;
      codeHTML = `<div class="qr-section"><img src="${qrUrl}" alt="QR" /></div>`;
    } else {
      // Use registration_no because UUID (36 chars) is too long and makes the barcode unscannable when squished
      const barcodeValue = student.registration_no || student.details?.academic_info?.roll_no || student.id;
      // Using metafloor bwip-js API for high quality barcode image with text included
      const barcodeUrl = `https://bwipjs-api.metafloor.com/?bcid=code128&text=${encodeURIComponent(barcodeValue)}&scale=3&textxalign=center`;
      codeHTML = `<div class="barcode-section"><img src="${barcodeUrl}" alt="Barcode" /></div>`;
    }

    /*
     * FINALLY TUNED ABSOLUTE POSITION LAYOUT WITH BALANCED TOP SPACE
     * Shifted the info block higher to remove excess empty space while keeping manual image headroom.
     */
    const printHTML = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    @page {
      size: A4 portrait;
      margin: 0mm;
    }
    @media print {
      html, body {
        margin: 0mm !important;
        padding: 0mm !important;
        background-color: #ffffff !important;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
      .field-value, .student-name, .subject-value, .field-label {
        color: #000000 !important;
        -webkit-text-fill-color: #000000 !important;
      }
    }
    *, *::before, *::after {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    html, body {
      width: 100%;
      background-color: #ffffff;
      font-family: 'Arial Black', Arial, sans-serif;
    }
    .card {
      position: relative;
      width: 5.2in;
      height: 4in;
      margin: 0;
      background: #ffffff;
      overflow: hidden;
    }
    /* Info starts: right of purple sidebar, just below image box */
    .info-section {
      position: absolute;
      left: 3.7in;
      top: 1.5in;
      right: 0.1in;
    }
    .info-field {
      margin-bottom: 0.055in;
    }
    .field-label {
      font-size: 8px;
      font-weight: 900;
      color: #000000;
      text-transform: uppercase;
      letter-spacing: 0.3px;
      line-height: 1;
      margin-bottom: 2px;
    }
    .field-value {
      font-size: 11px;
      font-weight: 900;
      color: #000000;
      word-break: break-word;
      line-height: 1.15;
    }
    .field-value.student-name {
      font-size: 12px;
      font-weight: 900;
      text-transform: uppercase;
      line-height: 1.2;
    }
    .subject-value {
      font-size: 8.5px;
      font-weight: 900;
      line-height: 1.2;
      color: #000000;
      word-break: break-word;
    }
    /* QR: flows naturally after subjects text, small top margin */
    .qr-section {
      margin-top: 0.1in;
      width: 0.85in;
      height: 0.85in;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #ffffff;
    }
    .qr-section img {
      width: 100%;
      height: 100%;
      object-fit: contain;
      image-rendering: crisp-edges;
    }
    /* Barcode: flows naturally after subjects text */
    .barcode-section {
      margin-top: 0.1in;
      width: 1.55in;
      height: 0.5in;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #ffffff;
    }
    .barcode-section img {
      width: 100%;
      height: 100%;
      object-fit: contain;
    }
  </style>
</head>
<body>
  <div class="card">
    <div class="info-section">
      <div class="info-field">
        <div class="field-label">Name</div>
        <div class="field-value student-name">${studentName}</div>
      </div>
      <div class="info-field">
        <div class="field-label">GR No.</div>
        <div class="field-value">${grNo}</div>
      </div>
      <div class="info-field">
        <div class="field-label">Class</div>
        <div class="field-value">${className} &ndash; ${sectionName}</div>
      </div>
      <div class="info-field">
        <div class="field-label">Session</div>
        <div class="field-value">${sessionName}</div>
      </div>
      <div class="info-field">
        <div class="field-label">Subject</div>
        <div class="field-value subject-value">${subjectsText}</div>
      </div>
      ${codeHTML}
    </div>
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
  </script>
</body>
</html>`;

    const pw = window.open('', '_blank', 'width=600,height=600');
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
        class: getStudentClassName(data),
        timestamp: new Date().toISOString(),
      });

      const qrUrl = await QRCode.toDataURL(qrCodeData, {
        width: 200,
        margin: 2,
        color: { dark: '#000000', light: '#FFFFFF' }
      });

      setQrCodeUrl(qrUrl);
      return qrUrl;
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
              <p className="text-sm text-gray-600 mt-1">Manage students in your branch</p>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="outline" onClick={exportToPDF}>
                <Download className="w-4 h-4 mr-2" />
                Export PDF
              </Button>
              <Button variant="outline" onClick={exportToExcel}>
                <Download className="w-4 h-4 mr-2" />
                Export Excel
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
          <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-5 gap-4 mb-6">
            <Input
              placeholder="Search by Name/Email..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                if (e.target.value) setGrSearch('');
              }}
              icon={Search}
            />
            <Input
              placeholder="Search by GR Number..."
              value={grSearch}
              onChange={(e) => {
                setGrSearch(e.target.value);
                if (e.target.value) setSearch('');
              }}
              icon={Search}
            />
            <Dropdown
              placeholder="Academic Year"
              value={academicYearFilter}
              onChange={(e) => setAcademicYearFilter(e.target.value)}
              options={[
                { value: '', label: 'All Years' },
                ...academicYears.map(ay => ({ value: ay.id, label: ay.name })),
              ]}
            />
            <Dropdown
              placeholder="Filter by Group"
              value={groupFilter}
              onChange={(e) => {
                setGroupFilter(e.target.value);
                setClassFilter(''); // Reset class when group changes
                setSectionFilter(''); // Reset section when group changes
              }}
              options={[
                { value: '', label: 'All Groups' },
                ...branchGroups.map(g => ({ value: g.id, label: g.name })),
              ]}
            />
            <Dropdown
              placeholder="Filter by Class"
              value={classFilter}
              onChange={(e) => {
                setClassFilter(e.target.value);
                setSectionFilter(''); // Reset section when class changes
              }}
              options={[
                { value: '', label: 'All Classes' },
                ...classes
                  .filter(c => !groupFilter || c.group_id === groupFilter || c.groupId === groupFilter)
                  .map(c => ({ value: c.id, label: c.name })),
              ]}
            />
            <Dropdown
              placeholder="Filter by Section"
              value={sectionFilter}
              onChange={(e) => setSectionFilter(e.target.value)}
              options={[
                { value: '', label: 'All Sections' },
                ...sections
                  .filter(s => !classFilter || s.class_id === classFilter || s.classId === classFilter)
                  .map(s => ({ value: s.id, label: s.name })),
              ]}
            />
            <Dropdown
              placeholder="Filter by Subject"
              value={subjectFilter}
              onChange={(e) => setSubjectFilter(e.target.value)}
              options={[
                { value: '', label: 'All Subjects' },
                ...subjectsList.map(s => ({ value: s.id || s._id, label: s.name })),
              ]}
              disabled={!classFilter}
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
            onDelete={(student) => setDeleteModal({ open: true, student })}
            onToggleStatus={handleToggleStatus}
            onPrintCard={handlePrintCard}
            onDownloadQR={handleDownloadCard}
            onChangePassword={handleChangePassword}
            onUploadDocuments={handleUploadDocuments}
          />

          {/* Pagination */}
          <div className="flex items-center justify-between mt-6">
            <div className="text-sm text-gray-600">
              {isFiltering
                ? `Showing all ${filteredStudents.length} students (Filtered)`
                : `Showing ${((pagination.page - 1) * pagination.limit) + 1} to ${Math.min(pagination.page * pagination.limit, filteredStudents.length)} of ${filteredStudents.length} students`
              }
            </div>
            {totalPages > 1 && (
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
            )}
          </div>
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
        branches={[]}
        classes={classes}
        groups={branchGroups}
        academicYears={academicYears}
        departments={[]}
        userRole="BRANCH_ADMIN"
        currentBranchId={currentBranchId}
      />

      {/* Student View Modal */}
      <StudentViewModal
        isOpen={isViewModalOpen}
        onClose={() => {
          setIsViewModalOpen(false);
          setViewingStudent(null);
        }}
        student={viewingStudent}
        branches={[]}
        classes={classes}
        departments={[]}
        academicYears={academicYears}
        groups={branchGroups}
      />

      <StudentUploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        student={uploadingStudent}
        onSuccess={() => fetchStudents()}
      />

      {/* Delete Confirmation Modal */}
      {deleteModal.open && (
        <ConfirmDeleteModal
          title="Delete Student"
          message={`Are you sure you want to delete ${deleteModal.student?.first_name} ${deleteModal.student?.last_name}? This action cannot be undone and will remove all student records.`}
          onConfirm={handleDelete}
          onCancel={() => setDeleteModal({ open: false, student: null })}
          isLoading={submitting}
        />
      )}

      <AdminChangeUserPasswordModal
        isOpen={showPasswordModal}
        onClose={() => {
          setShowPasswordModal(false);
          setViewingStudent(null);
        }}
        userToEdit={viewingStudent}
        userRole="student"
        adminRole="BRANCH_ADMIN"
      />
    </div>
  );
}
