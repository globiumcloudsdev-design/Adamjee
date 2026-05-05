"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import apiClient from '@/lib/api-client';
import { API_ENDPOINTS } from '@/constants/api-endpoints';
import { motion } from 'framer-motion';
import { 
  Users, 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Eye, 
  Download,
  Filter
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import Modal from '@/components/ui/modal';
import AddStaffModal from '@/components/modals/AddStaffModal';
import FullPageLoader from '@/components/ui/full-page-loader';
import Dropdown from '@/components/ui/dropdown';
import { toast } from 'sonner';
import UserManagementTable from '@/components/common/UserManagementTable';
import ConfirmDeleteModal from '@/components/modals/ConfirmDeleteModal';
import UserDetailModal from '@/components/modals/UserDetailModal';

const STATUS_OPTIONS = [
  { label: 'All Status', value: 'all' },
  { label: 'Active', value: 'active' },
  { label: 'Inactive', value: 'inactive' },
];

export default function SuperAdminStaffPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [staff, setStaff] = useState([]);
  const [filteredStaff, setFilteredStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [branchFilter, setBranchFilter] = useState('all');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [staffToDelete, setStaffToDelete] = useState(null);
  const [branches, setBranches] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10 });

  // Load staff
  const loadStaff = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get(API_ENDPOINTS.SUPER_ADMIN.STAFF.LIST);
      if (response.success) {
        setStaff(response.data);
        setFilteredStaff(response.data);
      }
    } catch (error) {
      console.error('Load staff error:', error);
      toast.error(error.message || 'Failed to load staff');
    } finally {
      setLoading(false);
    }
  };

  // Load branches for filter
  const loadBranches = async () => {
    try {
      const response = await apiClient.get(API_ENDPOINTS.SUPER_ADMIN.BRANCHES.LIST);
      if (response.success) {
        setBranches(response.data.branches);
      }
    } catch (error) {
      console.error('Load branches error:', error);
    }
  };

  useEffect(() => {
    loadStaff();
    loadBranches();
  }, []);

  // Filter staff
  useEffect(() => {
    let filtered = [...staff];

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(s =>
        (s.first_name + ' ' + s.last_name)?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.registration_no?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(s => s.status === statusFilter);
    }

    // Branch filter
    if (branchFilter !== 'all') {
      filtered = filtered.filter(s => s.branch_id === branchFilter);
    }

    setFilteredStaff(filtered);
    setPagination(prev => ({ ...prev, page: 1 })); // Reset to page 1 on filter change
  }, [searchQuery, statusFilter, branchFilter, staff]);

  // Paginated data
  const paginatedStaff = filteredStaff.slice(
    (pagination.page - 1) * pagination.limit,
    pagination.page * pagination.limit
  );
  const totalPages = Math.ceil(filteredStaff.length / pagination.limit);

  // Handle add staff
  const handleAddStaff = () => {
    setShowAddModal(true);
  };

  // Handle edit staff
  const handleEditStaff = (staffMember) => {
    setSelectedStaff(staffMember);
    setShowEditModal(true);
  };

  // Handle view staff
  const handleViewStaff = (staffMember) => {
    setSelectedStaff(staffMember);
    setShowViewModal(true);
  };

  // Handle delete staff
  const handleDeleteStaff = async (staffMember) => {
    setStaffToDelete(staffMember);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!staffToDelete) return;

    try {
      setLoading(true);
      const endpoint = API_ENDPOINTS.SUPER_ADMIN.STAFF.DELETE.replace(':id', staffToDelete.id);
      const response = await apiClient.delete(endpoint);
      if (response.success) {
        toast.success('Staff deleted successfully');
        loadStaff();
      }
    } catch (error) {
      console.error('Delete staff error:', error);
      toast.error(error.message || 'Failed to delete staff');
    } finally {
      setLoading(false);
      setShowDeleteModal(false);
      setStaffToDelete(null);
    }
  };

  // Handle status toggle
  const handleToggleStatus = async (staffMember) => {
    try {
      const endpoint = API_ENDPOINTS.SUPER_ADMIN.STAFF.UPDATE.replace(':id', staffMember.id);
      const response = await apiClient.put(endpoint, {
        is_active: !staffMember.is_active
      });
      if (response.success) {
        toast.success(`Staff ${!staffMember.is_active ? 'activated' : 'deactivated'} successfully`);
        loadStaff();
      }
    } catch (error) {
      console.error('Toggle status error:', error);
      toast.error(error.message || 'Failed to update status');
    }
  };

  // Download QR code
  const handleDownloadQR = (staffMember) => {
    if (staffMember.qr_code_url) {
      window.open(staffMember.qr_code_url, '_blank');
    } else {
      toast.error('QR code not available');
    }
  };


  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Staff Management</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Manage all staff members</p>
        </div>
        <Button onClick={handleAddStaff} className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Add Staff
        </Button>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search */}
          <div className="md:col-span-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name, email, or employee ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600"
              />
            </div>
          </div>

          {/* Branch Filter */}
          <div className="w-full">
            <Dropdown
              id="branchFilter"
              name="branchFilter"
              value={branchFilter}
              onChange={(e) => setBranchFilter(e.target.value)}
              options={[
                { label: 'All Branches', value: 'all' },
                ...branches.map(branch => ({ label: branch.name, value: branch.id }))
              ]}
              placeholder="Filter by Branch"
            />
          </div>

          {/* Status Filter */}
          <div className="w-full">
            <Dropdown
              id="statusFilter"
              name="statusFilter"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              options={STATUS_OPTIONS}
              placeholder="Filter by Status"
            />
          </div>
        </div>

        {/* Results count */}
        <div className="text-sm text-gray-600 dark:text-gray-400">
          Showing {filteredStaff.length} of {staff.length} staff members
        </div>
      </div>

      {/* Staff Table */}
      <UserManagementTable
        data={paginatedStaff}
        loading={loading}
        onView={handleViewStaff}
        onEdit={handleEditStaff}
        onDelete={handleDeleteStaff}
        onToggleStatus={handleToggleStatus}
      />

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-6 bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="text-sm text-gray-600 dark:text-gray-400 font-medium">
            Showing <span className="font-bold text-blue-600">{((pagination.page - 1) * pagination.limit) + 1}</span> to <span className="font-bold text-blue-600">{Math.min(pagination.page * pagination.limit, filteredStaff.length)}</span> of {filteredStaff.length} members
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
              disabled={pagination.page === 1}
              className="px-4"
            >
              Previous
            </Button>
            <div className="flex items-center gap-1">
              {[...Array(totalPages)].map((_, i) => (
                <Button
                  key={i + 1}
                  variant={pagination.page === i + 1 ? "default" : "outline"}
                  size="sm"
                  className={`w-8 h-8 p-0 ${pagination.page === i + 1 ? 'shadow-md shadow-blue-500/20' : ''}`}
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
              disabled={pagination.page >= totalPages}
              className="px-4"
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {showDeleteModal && (
        <ConfirmDeleteModal
          title="Delete Staff"
          message={`Are you sure you want to delete ${staffToDelete?.first_name} ${staffToDelete?.last_name}? This action cannot be undone.`}
          onConfirm={confirmDelete}
          onCancel={() => {
            setShowDeleteModal(false);
            setStaffToDelete(null);
          }}
        />
      )}

      {/* Add/Edit Staff Modal */}
      {(showAddModal || showEditModal) && (
        <AddStaffModal
          open={showAddModal || showEditModal}
          onClose={() => {
            setShowAddModal(false);
            setShowEditModal(false);
            setSelectedStaff(null);
          }}
          onSuccess={() => {
            setShowAddModal(false);
            setShowEditModal(false);
            setSelectedStaff(null);
            loadStaff();
          }}
          staffMember={selectedStaff}
          branches={branches}
          role="SUPER_ADMIN"
        />
      )}

      {/* View Staff Modal */}
      <UserDetailModal
        open={showViewModal}
        onClose={() => setShowViewModal(false)}
        user={selectedStaff}
        title="Staff Profile Overview"
      />
    </div>
  );
}

