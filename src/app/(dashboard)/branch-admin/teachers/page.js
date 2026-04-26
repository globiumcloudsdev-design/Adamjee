
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import apiClient from '@/lib/api-client';
import { API_ENDPOINTS } from '@/constants/api-endpoints';
import { toast } from 'sonner';
import {
  Users, Plus, Search, Edit, Trash2, Phone, Mail,
  Calendar, GraduationCap, Award, FileText, Eye
} from 'lucide-react';
import Modal from '@/components/ui/modal';
import Table, { TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import Input from '@/components/ui/input';
import Dropdown from '@/components/ui/dropdown';
import FullPageLoader from '@/components/ui/full-page-loader';
import TeacherForm from '@/components/teacher/teacher-form';
import TeacherViewModal from '@/components/teacher/teacher-view-modal';
import ConfirmDeleteModal from '@/components/modals/ConfirmDeleteModal';

export default function TeachersPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [teachers, setTeachers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [viewingTeacher, setViewingTeacher] = useState(null);
  const [editingTeacher, setEditingTeacher] = useState(null);
  const [fullPageLoading, setFullPageLoading] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [teacherToDelete, setTeacherToDelete] = useState(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('');

  useEffect(() => {
    const branchId = user?.branch_id || user?.branchId?._id;
    if (branchId) {
      fetchTeachers();
      fetchDepartments();
      fetchClasses();
      fetchSubjects();
    }
  }, [user?.branch_id, user?.branchId?._id, searchTerm, selectedStatus, selectedDepartment]);

  console.log('Login User', user);
  

  const fetchTeachers = async () => {
    try {
      setLoading(true);
      const branchId = user?.branch_id || user?.branchId?._id;
      const params = new URLSearchParams({
        limit: '100',
        branchId: branchId,
        ...(searchTerm && { search: searchTerm }),
        ...(selectedStatus && { status: selectedStatus }),
        ...(selectedDepartment && { departmentId: selectedDepartment }),
      });

      const response = await apiClient.get(`${API_ENDPOINTS.BRANCH_ADMIN.TEACHERS.LIST}?${params}`);
      if (response?.success) {
        setTeachers(response.data || []);
      }
    } catch (error) {
      toast.error('Failed to fetch teachers');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const fetchDepartments = async () => {
    try {
      const branchId = user?.branch_id || user?.branchId?._id;
      const response = await apiClient.get(
        `${API_ENDPOINTS.BRANCH_ADMIN.DEPARTMENTS.LIST}?limit=200&branchId=${branchId}`
      );
      if (response?.success) {
        setDepartments(response.data?.departments || response.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch departments:', error);
    }
  };

  const fetchClasses = async () => {
    try {
      const branchId = user?.branch_id || user?.branchId?._id;
      const response = await apiClient.get(
        `${API_ENDPOINTS.BRANCH_ADMIN.CLASSES.LIST}?limit=200&branchId=${branchId}`
      );
      console.log('Classes Response', response);
      
      if (response?.success) {
        setClasses(response.data?.classes || response.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch classes:', error);
    }
  };

  const fetchSubjects = async () => {
    try {
      const branchId = user?.branch_id || user?.branchId?._id;
      const response = await apiClient.get(
        `${API_ENDPOINTS.BRANCH_ADMIN.SUBJECTS.LIST}?limit=200&branchId=${branchId}`
      );
      if (response?.success) {
        setSubjects(response.data.subjects || []);
      }
    } catch (error) {
      console.error('Failed to fetch subjects:', error);
    }
  };

  const handleDelete = async (teacher) => {
    setTeacherToDelete(teacher);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!teacherToDelete) return;
    
    setFullPageLoading(true);
    setShowDeleteModal(false);

    try {
      const response = await apiClient.delete(API_ENDPOINTS.BRANCH_ADMIN.TEACHERS.DELETE.replace(':id', teacherToDelete.id));
      if (response.success) {
        toast.success('Teacher deleted successfully');
        fetchTeachers();
      }
    } catch (error) {
      toast.error(error.message || 'Failed to delete teacher');
      console.error(error);
    } finally {
      setFullPageLoading(false);
      setTeacherToDelete(null);
    }
  };

  const handleEdit = (teacher) => {
    setEditingTeacher(teacher);
    setShowModal(true);
  };

  const handleView = (teacher) => {
    setViewingTeacher(teacher);
    setShowViewModal(true);
  };

  const handleAddNew = () => {
    setEditingTeacher(null);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingTeacher(null);
  };

  const handleSuccess = () => {
    fetchTeachers();
    handleCloseModal();
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {fullPageLoading && <FullPageLoader message="Processing..." />}
      
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
          <Users className="h-8 w-8 text-blue-600" />
          Teacher Management
        </h1>
        <p className="text-gray-600 mt-1">Manage teachers for {user?.branchId?.name || 'your branch'}</p>
      </div>

      {/* Filters and Actions */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-6">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1">
            <Input
              placeholder="Search by name, email, phone, employee ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              icon={Search}
            />
          </div>

          {/* Department Filter Removed */}


          <div className="w-full lg:w-48">
            <Dropdown
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              options={[
                { label: 'All Status', value: '' },
                { label: 'Active', value: 'active' },
                { label: 'Inactive', value: 'inactive' },
                { label: 'On Leave', value: 'on_leave' },
                { label: 'Terminated', value: 'terminated' },
              ]}
              placeholder="All Status"
            />
          </div>

          <Button onClick={handleAddNew} variant="default" className="whitespace-nowrap">
            <Plus className="h-5 w-5" />
            Add Teacher
          </Button>
        </div>
      </div>

      {/* Teachers Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading teachers...</div>
        ) : teachers.length === 0 ? (
          <div className="p-12 text-center">
            <Users className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">No teachers found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-gray-50">
                <TableRow>
                  <TableHead>Teacher</TableHead>
                  <TableHead>Contact</TableHead>
                  {/* <TableHead>Department</TableHead> */}
                  <TableHead>Designation</TableHead>
                  <TableHead>Classes/Subjects</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {teachers.map((teacher) => (
                  <TableRow key={teacher.id} className="hover:bg-gray-50">
                    <TableCell>
                      <div>
                        <div className="font-medium">
                          {teacher.fullName || `${teacher.first_name} ${teacher.last_name}`}
                        </div>
                        <div className="text-sm text-gray-500">{teacher.registration_no}</div>
                      </div>
                    </TableCell>

                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex items-center gap-1 text-sm text-gray-600">
                          <Mail className="h-3 w-3" />
                          {teacher.email}
                        </div>
                        <div className="flex items-center gap-1 text-sm text-gray-600">
                          <Phone className="h-3 w-3" />
                          {teacher.phone}
                        </div>
                      </div>
                    </TableCell>

                    <TableCell>
                      <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full bg-purple-100 text-purple-800">
                        <Award className="h-3 w-3" />
                        {teacher.details?.teacher?.designation || 'Teacher'}
                      </span>
                    </TableCell>

                    <TableCell>
                      <div className="text-sm text-gray-900">
                        {teacher.details?.teacher?.classes?.length || 0} Classes
                      </div>
                      <div className="text-xs text-gray-500">
                        {teacher.details?.teacher?.subjects?.length || 0} Subjects
                      </div>
                    </TableCell>

                    <TableCell>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        teacher.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {teacher.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </TableCell>

                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button 
                          onClick={() => handleView(teacher)} 
                          variant="ghost" 
                          size="icon-sm"
                          title="View Details"
                        >
                          <Eye className="h-4 w-4 text-blue-600" />
                        </Button>
                        <Button onClick={() => handleEdit(teacher)} variant="ghost" size="icon-sm" title="Edit">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button onClick={() => handleDelete(teacher)} variant="ghost" size="icon-sm" title="Delete">
                          <Trash2 className="h-4 w-4 text-red-600" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      {/* Teacher Form Modal */}
      <Modal
        open={showModal}
        onClose={handleCloseModal}
        title={editingTeacher ? 'Edit Teacher' : 'Add New Teacher'}
        size="xl"
        footer={null}
      >
        <TeacherForm
          userRole="BRANCH_ADMIN"
          currentBranchId={user?.branch_id || user?.branchId?._id}
          editingTeacher={editingTeacher}
          departments={departments}
          classes={classes}
          subjects={subjects}
          onSuccess={handleSuccess}
          onClose={handleCloseModal}
        />
      </Modal>

      {/* Teacher View Modal */}
      <TeacherViewModal
        teacher={viewingTeacher}
        open={showViewModal}
        onClose={() => {
          setShowViewModal(false);
          setViewingTeacher(null);
        }}
      />

      {showDeleteModal && (
        <ConfirmDeleteModal
          title="Delete Teacher"
          message={`Are you sure you want to delete ${teacherToDelete?.first_name} ${teacherToDelete?.last_name}? This action cannot be undone.`}
          onConfirm={confirmDelete}
          onCancel={() => {
            setShowDeleteModal(false);
            setTeacherToDelete(null);
          }}
        />
      )}
    </div>
  );
}