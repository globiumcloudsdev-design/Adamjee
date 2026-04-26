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
import BranchSelect from '@/components/ui/branch-select';
import FullPageLoader from '@/components/ui/full-page-loader';
import TeacherForm from '@/components/teacher/teacher-form';
import TeacherViewModal from '@/components/teacher/teacher-view-modal';
import ConfirmDeleteModal from '@/components/modals/ConfirmDeleteModal';
import UserManagementTable from '@/components/common/UserManagementTable';

export default function TeachersPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [teachers, setTeachers] = useState([]);
  const [branches, setBranches] = useState([]);
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
  const [selectedBranch, setSelectedBranch] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedDesignation, setSelectedDesignation] = useState('');

  // Stats
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    onLeave: 0,
    terminated: 0,
  });

  useEffect(() => {
    fetchTeachers();
  }, [searchTerm, selectedBranch, selectedStatus, selectedDesignation]);

  useEffect(() => {
    fetchBranches();
    fetchDepartments();
    fetchClasses();
    fetchSubjects();
  }, []);

  const fetchTeachers = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        limit: '100',
        ...(searchTerm && { search: searchTerm }),
        ...(selectedBranch && { branchId: selectedBranch }),
        ...(selectedStatus && { status: selectedStatus }),
        ...(selectedDesignation && { designation: selectedDesignation }),
      });

      const response = await apiClient.get(`${API_ENDPOINTS.SUPER_ADMIN.TEACHERS.LIST}?${params}`);
      if (response?.success) {
        const list = response.data || [];
        setTeachers(list);

        const total = list.length;
        const active = list.filter(t => t.status === 'active').length;
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

  const fetchBranches = async () => {
    try {
      const response = await apiClient.get(`${API_ENDPOINTS.SUPER_ADMIN.BRANCHES.LIST}?limit=200`);
      if (response?.success) {
        setBranches(response.data?.branches || response.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch branches:', error);
    }
  };

  const fetchDepartments = async () => {
    try {
      const response = await apiClient.get(`${API_ENDPOINTS.SUPER_ADMIN.DEPARTMENTS.LIST}?limit=200`);
      if (response?.success) {
        setDepartments(response.data?.departments || response.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch departments:', error);
    }
  };

  const fetchClasses = async () => {
    try {
      const response = await apiClient.get(`${API_ENDPOINTS.SUPER_ADMIN.CLASSES.LIST}?limit=200`);
      if (response?.success) {
        setClasses(response.data?.classes || response.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch classes:', error);
    }
  };

  const fetchSubjects = async () => {
    try {
      const response = await apiClient.get(`${API_ENDPOINTS.SUPER_ADMIN.SUBJECTS.LIST}?limit=200`);
      if (response?.success) {
        setSubjects(response.data || []);
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
      const response = await apiClient.delete(API_ENDPOINTS.SUPER_ADMIN.TEACHERS.DELETE.replace(':id', teacherToDelete.id));
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
    router.push(`/super-admin/teacher-management/teachers/${teacher.id}`);
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
      <div className="mb-6 pt-8">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
          <Users className="h-8 w-8 text-blue-600" />
          Teacher Management
        </h1>
        <p className="text-gray-600 mt-1">Manage teachers, assignments, and QR codes</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {/* ... Stats cards same as before ... */}
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

          <div className="w-full lg:w-48">
            <BranchSelect
              value={selectedBranch}
              onChange={(e) => setSelectedBranch(e.target.value)}
              branches={branches}
              placeholder="All Branches"
            />
          </div>

          {/* 
          <div className="w-full lg:w-48">
            <Dropdown
              value={selectedDesignation}
              onChange={(e) => setSelectedDesignation(e.target.value)}
              options={[
                { label: 'All Designations', value: '' },
                { label: 'Principal', value: 'Principal' },
                { label: 'Vice Principal', value: 'Vice Principal' },
                { label: 'Head Teacher', value: 'Head Teacher' },
                { label: 'Senior Teacher', value: 'Senior Teacher' },
                { label: 'Teacher', value: 'Teacher' },
              ]}
              placeholder="All Designations"
            />
          </div>
          */}

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
        data={teachers}
        loading={loading}
        onView={handleView}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onToggleStatus={async (teacher) => {
          try {
            const response = await apiClient.put(API_ENDPOINTS.SUPER_ADMIN.TEACHERS.UPDATE.replace(':id', teacher.id), {
              is_active: !teacher.is_active
            });
            if (response.success) {
              toast.success(`Teacher ${!teacher.is_active ? 'activated' : 'deactivated'} successfully`);
              fetchTeachers();
            }
          } catch (error) {
            toast.error('Failed to update status');
          }
        }}
      />

      {/* Teacher Form Modal */}
      <Modal
        open={showModal}
        onClose={handleCloseModal}
        title={editingTeacher ? 'Edit Teacher' : 'Add New Teacher'}
        size="xl"
        footer={null}
      >
        <TeacherForm
          userRole="SUPER_ADMIN"
          currentBranchId={null}
          editingTeacher={editingTeacher}
          branches={branches}
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