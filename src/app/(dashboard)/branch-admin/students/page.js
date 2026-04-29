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

export default function BranchAdminStudentsPage() {
  const { user } = useAuth();

  // Branch Admin is locked to own branch
  const currentBranchId = user?.branch_id;

  const [students, setStudents] = useState([]);
  const [classes, setClasses] = useState([]);
  const [branchGroups, setBranchGroups] = useState([]);
  const [academicYears, setAcademicYears] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  const [viewingStudent, setViewingStudent] = useState(null);

  const [submitting, setSubmitting] = useState(false);
  const [search, setSearch] = useState('');
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
      if (classFilter) params.class_id = classFilter;

      const response = await apiClient.get(API_ENDPOINTS.BRANCH_ADMIN.STUDENTS.LIST, params);
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

  const fetchGroups = async () => {
    try {
      const response = await apiClient.get('/api/groups');
      const groupsData = Array.isArray(response) ? response : (response.data || []);
      setBranchGroups(groupsData);
    } catch (error) {
      console.error('Error fetching groups:', error);
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
    fetchClasses();
    fetchGroups();
    fetchAcademicYears();
  }, []);

  // Fetch students when filters change
  useEffect(() => {
    fetchStudents();
  }, [classFilter, statusFilter]);

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
        API_ENDPOINTS.BRANCH_ADMIN.STUDENTS.UPDATE.replace(':id', student.id),
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

  const generateCard = async () => {
    if (!selectedStudent) return;

    try {
      setSubmitting(true);
      const qrUrl = await generateQRCode(selectedStudent);
      if (!qrUrl) {
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
        profilePhoto: selectedStudent.avatar_url ? { url: selectedStudent.avatar_url } : null,
      };

      const blob = await pdf(
        <StudentCardPDF
          student={cardStudent}
          qrCodeUrl={qrUrl}
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
              <p className="text-sm text-gray-600 mt-1">Manage students in your branch</p>
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Input
              placeholder="Search students..."
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
                ...classes.map(c => ({ value: c.id, label: c.name })),
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
          <div className="border rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <Table>
              <TableHeader className="bg-gray-50">
                <TableRow>
                  <TableHead className="font-semibold">Student</TableHead>
                  <TableHead className="font-semibold">Registration #</TableHead>
                  <TableHead className="font-semibold">Class</TableHead>
                  <TableHead className="font-semibold">Parent</TableHead>
                  <TableHead className="font-semibold">Status</TableHead>
                  <TableHead className="font-semibold text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedStudents.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                      <User className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                      <p>No students found</p>
                      <p className="text-sm mt-1">Add your first student to get started</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedStudents.map((student) => {
                    const parentInfo = getParentInfo(student);
                    return (
                      <TableRow key={student.id} className="hover:bg-gray-50">
                        <TableCell>
                          <div className="flex items-center gap-3">
                            {student.avatar_url ? (
                              <img 
                                src={student.avatar_url} 
                                alt="" 
                                className="w-10 h-10 rounded-full object-cover border" 
                              />
                            ) : (
                              <div className="w-10 h-10 rounded-full bg-gray-100 border flex items-center justify-center">
                                <User className="w-5 h-5 text-gray-400" />
                              </div>
                            )}
                            <div>
                              <div className="font-medium text-gray-900">
                                {getStudentName(student)}
                              </div>
                              <div className="text-xs text-gray-500 flex items-center gap-1">
                                <Mail className="w-3 h-3" />
                                {student.email || '-'}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="font-mono text-sm font-medium text-gray-900">
                            {getStudentRegistrationNo(student)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm text-gray-900">
                            {getStudentClassName(student)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="text-sm font-medium">
                              {parentInfo.name}
                            </div>
                            <div className="text-xs text-gray-500 flex items-center gap-1">
                              <Phone className="w-3 h-3" />
                              {parentInfo.phone}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              role="switch"
                              aria-checked={student.is_active}
                              onClick={() => handleToggleStatus(student)}
                              className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center justify-center rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                                student.is_active ? 'bg-green-500 hover:bg-green-600' : 'bg-gray-300 hover:bg-gray-400'
                              }`}
                              title={`Click to ${student.is_active ? 'deactivate' : 'activate'}`}
                            >
                              <span
                                aria-hidden="true"
                                className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                                  student.is_active ? 'translate-x-4' : 'translate-x-0'
                                }`}
                              />
                            </button>
                            <span className={`text-xs font-medium ${student.is_active ? 'text-green-700' : 'text-gray-500'}`}>
                              {student.is_active ? 'Active' : 'Inactive'}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              onClick={() => handleView(student)}
                              title="View Details"
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              onClick={() => handleDownloadCard(student)}
                              title="Download Card"
                            >
                              <Download className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              onClick={() => handleEdit(student)}
                              title="Edit"
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              onClick={() => setDeleteModal({ open: true, student })}
                              title="Delete"
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="w-4 h-4" />
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
          </div>

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
                  <span className="text-gray-500">Roll No:</span>
                  <span className="ml-2 font-medium">{selectedStudent.details?.academic_info?.roll_no || '-'}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
