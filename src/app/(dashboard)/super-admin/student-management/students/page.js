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

      const response = await apiClient.get(API_ENDPOINTS.SUPER_ADMIN.STUDENTS.LIST, params);
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

  // Fetch students when filters change
  useEffect(() => {
    fetchStudents();
  }, [branchFilter, classFilter, statusFilter]);

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

    const matchesSearch = !search || name.includes(searchLower) || email.includes(searchLower) || regNo.includes(searchLower);
    const matchesStatus = !statusFilter || student.is_active === (statusFilter === 'active');

    return matchesSearch && matchesStatus;
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

  const handleDownloadCard = (student) => {
    setSelectedStudent(student);
    setCardStatus({
      issueDate: new Date().toISOString().split('T')[0],
      expireDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      status: 'active',
      printCount: 0,
    });
    setIsCardModalOpen(true);
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

  const generateCard = async () => {
    if (!selectedStudent) return;

    try {
      setSubmitting(true);
      const qrCodeUrl = await generateQRCode(selectedStudent);
      if (!qrCodeUrl) {
        toast.error('Failed to generate QR code');
        return;
      }

      // Map PostgreSQL student to card format
      const cardStudent = {
        firstName: selectedStudent.first_name,
        lastName: selectedStudent.last_name,
        email: selectedStudent.email,
        phone: selectedStudent.phone,
        gender: selectedStudent.details?.academic_info?.gender || '',
        dateOfBirth: selectedStudent.details?.academic_info?.date_of_birth || '',
        bloodGroup: selectedStudent.details?.academic_info?.blood_group || '',
        studentProfile: {
          registrationNumber: selectedStudent.registration_no,
          classId: { name: getStudentClassName(selectedStudent) },
          father: selectedStudent.details?.academic_info?.father,
          guardian: selectedStudent.details?.academic_info?.guardian,
        },
        branchId: { name: getStudentBranchName(selectedStudent) },
        profilePhoto: selectedStudent.avatar_url ? { url: selectedStudent.avatar_url } : null,
      };

      const blob = await pdf(
        <StudentCardPDF
          student={cardStudent}
          qrCodeUrl={qrCodeUrl}
          classes={classes}
          issueDate={cardStatus.issueDate}
          expireDate={cardStatus.expireDate}
          status={cardStatus.status}
        />
      ).toBlob();

      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `student-card-${selectedStudent.registration_no || selectedStudent.id}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setCardStatus(prev => ({ ...prev, printCount: prev.printCount + 1 }));
      setIsCardModalOpen(false);
      setSelectedStudent(null);
      setQrCodeUrl('');
    } catch (error) {
      console.error('Error generating card:', error);
      toast.error('Failed to generate student card');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading && students.length === 0) {
    return <FullPageLoader message="Loading students..." />;
  }

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
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Input
              placeholder="Search students..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
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
      {deleteModal.open && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Delete Student</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete {getStudentName(deleteModal.student)}?
              This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => setDeleteModal({ open: false, student: null })}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleDelete}
                disabled={submitting}
              >
                {submitting ? <ButtonLoader /> : 'Delete Student'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Card Modal */}
      <Modal
        open={isCardModalOpen}
        onClose={() => setIsCardModalOpen(false)}
        title="Student Card Preview"
        size="lg"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsCardModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={generateCard}>
              <Download className="w-4 h-4 mr-2" />
              Download PDF
            </Button>
          </div>
        }
      >
        {selectedStudent && (
          <div className="space-y-6">
            {/* Card Status */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold mb-3 text-gray-800">Card Status</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">Issue Date</label>
                  <p className="font-semibold">{cardStatus.issueDate}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Expire Date</label>
                  <p className="font-semibold">{cardStatus.expireDate}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Status</label>
                  <p className="font-semibold capitalize">{cardStatus.status}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Print Count</label>
                  <p className="font-semibold">{cardStatus.printCount}</p>
                </div>
              </div>
            </div>

            {/* Student Info Preview */}
            <div className="border rounded-lg p-4">
              <h3 className="font-semibold mb-3 text-gray-800">Student Details</h3>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-gray-500">Name:</span>
                  <span className="ml-2 font-medium">{getStudentName(selectedStudent)}</span>
                </div>
                <div>
                  <span className="text-gray-500">Reg No:</span>
                  <span className="ml-2 font-medium">{getStudentRegistrationNo(selectedStudent)}</span>
                </div>
                <div>
                  <span className="text-gray-500">Class:</span>
                  <span className="ml-2 font-medium">{getStudentClassName(selectedStudent)}</span>
                </div>
                <div>
                  <span className="text-gray-500">Branch:</span>
                  <span className="ml-2 font-medium">{getStudentBranchName(selectedStudent)}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </Modal>

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