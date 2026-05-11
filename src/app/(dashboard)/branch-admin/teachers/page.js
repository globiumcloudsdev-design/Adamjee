
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import apiClient from '@/lib/api-client';
import { API_ENDPOINTS } from '@/constants/api-endpoints';
import { toast } from 'sonner';
import {
  Users, Plus, Search
} from 'lucide-react';
import Modal from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import Input from '@/components/ui/input';
import Dropdown from '@/components/ui/dropdown';
import FullPageLoader from '@/components/ui/full-page-loader';
import TeacherForm from '@/components/teacher/teacher-form';
import UserDetailModal from '@/components/modals/UserDetailModal';
import ConfirmDeleteModal from '@/components/modals/ConfirmDeleteModal';
import UserManagementTable from '@/components/common/UserManagementTable';
import Skeleton from '@/components/ui/skeleton';
import AdminChangeUserPasswordModal from '@/components/modals/AdminChangeUserPasswordModal';

export default function TeachersPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [teachers, setTeachers] = useState([]);
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
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    onLeave: 0,
    terminated: 0,
  });

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [academicYears, setAcademicYears] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10 });

  useEffect(() => {
    const branchId = user?.branch_id || user?.branchId?._id;
    if (branchId) {
      fetchTeachers();
      fetchClasses();
      fetchSubjects();
      fetchAcademicYears();
    }
  }, [user?.branch_id, user?.branchId?._id, searchTerm, selectedStatus]);

  const fetchAcademicYears = async () => {
    try {
      const response = await apiClient.get('/api/academic-years');
      if (response?.academic_years) {
        setAcademicYears(response.academic_years);
      }
    } catch (error) {
      console.error('Failed to fetch academic years:', error);
    }
  };

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
      });

      const response = await apiClient.get(`${API_ENDPOINTS.BRANCH_ADMIN.TEACHERS.LIST}?${params}`);
      if (response?.success) {
        const list = response.data || [];
        setTeachers(list);

        const total = list.length;
        const active = list.filter(t => t.status === 'active' || t.is_active).length;
        const onLeave = list.filter(t => t.status === 'on_leave').length;
        const terminated = list.filter(t => t.status === 'terminated').length;

        setStats({ total, active, onLeave, terminated });
      }
    } catch (error) {
      toast.error('Failed to fetch teachers');
      console.error(error);
    } finally {
      setLoading(false);
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

  const handleToggleStatus = async (teacher) => {
    try {
      // Build FormData as the backend expects multipart/form-data
      const formData = new FormData();
      formData.append('data', JSON.stringify({
        status: !teacher.is_active ? 'active' : 'inactive'
      }));

      const response = await apiClient.put(
        API_ENDPOINTS.BRANCH_ADMIN.TEACHERS.UPDATE.replace(':id', teacher.id), 
        formData
      );
      
      if (response.success) {
        toast.success(`Teacher ${!teacher.is_active ? 'activated' : 'deactivated'} successfully`);
        fetchTeachers();
      }
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  const handleChangePassword = (teacher) => {
    setViewingTeacher(teacher);
    setShowPasswordModal(true);
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

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {loading ? (
          <>
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <Skeleton className="h-4 w-24 mb-2" />
                <Skeleton className="h-8 w-16" />
              </div>
            ))}
          </>
        ) : (
          <>
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">Total Teachers</p>
                  <h3 className="text-2xl font-bold text-gray-900 mt-1">{stats.total}</h3>
                </div>
                <div className="h-12 w-12 bg-blue-50 rounded-xl flex items-center justify-center">
                  <Users className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">Active</p>
                  <h3 className="text-2xl font-bold text-green-600 mt-1">{stats.active}</h3>
                </div>
                <div className="h-12 w-12 bg-green-50 rounded-xl flex items-center justify-center">
                  <Users className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">On Leave</p>
                  <h3 className="text-2xl font-bold text-orange-600 mt-1">{stats.onLeave}</h3>
                </div>
                <div className="h-12 w-12 bg-orange-50 rounded-xl flex items-center justify-center">
                  <Users className="h-6 w-6 text-orange-600" />
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">Terminated</p>
                  <h3 className="text-2xl font-bold text-red-600 mt-1">{stats.terminated}</h3>
                </div>
                <div className="h-12 w-12 bg-red-50 rounded-xl flex items-center justify-center">
                  <Users className="h-6 w-6 text-red-600" />
                </div>
              </div>
            </div>
          </>
        )}
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
      <UserManagementTable
        data={teachers.slice((pagination.page - 1) * pagination.limit, pagination.page * pagination.limit)}
        loading={loading}
        onView={handleView}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onToggleStatus={handleToggleStatus}
        onChangePassword={handleChangePassword}
      />

      {/* Pagination Controls */}
      {Math.ceil(teachers.length / pagination.limit) > 1 && (
        <div className="flex items-center justify-between mt-6 bg-white p-4 rounded-xl shadow-sm border border-gray-200">
          <div className="text-sm text-gray-600 font-medium">
            Showing <span className="font-bold text-blue-600">{((pagination.page - 1) * pagination.limit) + 1}</span> to <span className="font-bold text-blue-600">{Math.min(pagination.page * pagination.limit, teachers.length)}</span> of {teachers.length} teachers
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
              {[...Array(Math.ceil(teachers.length / pagination.limit))].map((_, i) => (
                <Button
                  key={i + 1}
                  variant={pagination.page === i + 1 ? "default" : "outline"}
                  size="sm"
                  className="w-8 h-8 p-0"
                  onClick={() => setPagination(prev => ({ ...prev, page: i + 1 }))}
                >
                  {i + 1}
                </Button>
              ))}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
              disabled={pagination.page >= Math.ceil(teachers.length / pagination.limit)}
            >
              Next
            </Button>
          </div>
        </div>
      )}

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
          classes={classes}
          subjects={subjects}
          academicYears={academicYears}
          onSuccess={handleSuccess}
          onClose={handleCloseModal}
        />
      </Modal>

      {/* Teacher View Modal */}
      <UserDetailModal
        user={viewingTeacher}
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

      <AdminChangeUserPasswordModal
        isOpen={showPasswordModal}
        onClose={() => {
          setShowPasswordModal(false);
          setViewingTeacher(null);
        }}
        userToEdit={viewingTeacher}
        userRole="teacher"
        adminRole="BRANCH_ADMIN"
      />
    </div>
  );
}