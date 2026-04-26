'use client';

import { useState, useEffect } from 'react';
import {
  Building2,
  Plus,
  Search,
  Edit,
  Trash2,
  Users,
  GraduationCap,
  UserCheck,
  MapPin,
  Phone,
  Mail,
  Calendar,
  X,
  Eye,
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import apiClient from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Dropdown from '@/components/ui/dropdown';
import Modal from '@/components/ui/modal';
import dynamic from 'next/dynamic';
import Skeleton, { CardSkeleton } from '@/components/ui/skeleton';

// Branch Components
import BranchCard from '@/components/branch/BranchCard';
import BranchViewModal from '@/components/branch/BranchViewModal';
import BranchFormModal from '@/components/branch/BranchFormModal';
import ConfirmDeleteModal from '@/components/modals/ConfirmDeleteModal';

import { withAuth } from '@/hooks/useAuth';
import { ROLES } from '@/constants/roles';

function BranchesPage() {
  const [branches, setBranches] = useState([]);

  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingBranch, setEditingBranch] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [branchToDelete, setBranchToDelete] = useState(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [viewingBranch, setViewingBranch] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    code: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    country: 'Pakistan',
    postalCode: '',
    establishedDate: '',
    status: 'active',
    location: {
      latitude: 33.6844,
      longitude: 73.0479,
    },
    bankAccounts: [
      {
        accountTitle: '',
        serviceName: '',
        accountNo: '',
        iban: '',
        isDefault: true,
      },
    ],
  });

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 500); // 500ms delay

    return () => clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    loadBranches();
  }, [debouncedSearchTerm, statusFilter]);

  const loadBranches = async () => {
    try {
      setLoading(true);
      let url = '/api/super-admin/branches?limit=100';
      if (debouncedSearchTerm) url += `&search=${debouncedSearchTerm}`;
      if (statusFilter) url += `&is_active=${statusFilter === 'active'}`;
      
      const response = await apiClient.get(url);
      if (response?.data?.branches) {
        setBranches(response.data.branches);
      }
    } catch (error) {
      toast.error('Failed to load branches');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddNew = () => {
    setEditingBranch(null);
    setFormData({
      name: '',
      code: '',
      email: '',
      phone: '',
      address: '',
      city: '',
      state: '',
      country: 'Pakistan',
      postalCode: '',
      establishedDate: '',
      status: 'active',
      location: {
        latitude: 33.6844,
        longitude: 73.0479,
      },
      bankAccounts: [
        {
          accountTitle: '',
          serviceName: '',
          accountNo: '',
          iban: '',
          isDefault: true,
        },
      ],
    });
    setShowModal(true);
  };

  const addBankAccount = () => {
    // Moved to BranchFormModal
  };

  const removeBankAccount = (index) => {
    // Moved to BranchFormModal
  };

  const updateBankAccount = (index, field, value) => {
    // Moved to BranchFormModal
  };

  const handleView = (branch) => {
    setViewingBranch(branch);
    setShowViewModal(true);
  };

  const handleEdit = (branch) => {
    setEditingBranch(branch);
    setFormData({
      name: branch.name || '',
      code: branch.code || '',
      email: branch.contact?.email || branch.email || '',
      phone: branch.contact?.phone || branch.phone || '',
      address: branch.address?.street || branch.address || '',
      city: branch.address?.city || branch.city || '',
      state: branch.address?.state || branch.state || '',
      country: branch.address?.country || branch.country || 'Pakistan',
      postalCode: branch.address?.zipCode || branch.postalCode || '',
      establishedDate: branch.settings?.establishedDate
        ? format(new Date(branch.settings.establishedDate), 'yyyy-MM-dd')
        : '',
      status: branch.is_active ? 'active' : 'inactive',
      location: {
        latitude: branch.location?.latitude || 33.6844,
        longitude: branch.location?.longitude || 73.0479,
      },
      bankAccounts: branch.bankAccounts?.length > 0
        ? branch.bankAccounts
        : [{ accountTitle: '', serviceName: '', accountNo: '', iban: '', isDefault: true }],
    });
    setShowModal(true);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        name: formData.name,
        code: formData.code,
        is_active: formData.status === 'active',
        address: {
          street: formData.address,
          city: formData.city,
          state: formData.state,
          country: formData.country,
          zipCode: formData.postalCode,
        },
        contact: {
          email: formData.email,
          phone: formData.phone,
        },
        location: formData.location,
        bankAccounts: formData.bankAccounts,
        settings: {
          establishedDate: formData.establishedDate,
        }
      };

      if (editingBranch) {
        await apiClient.put(`/api/super-admin/branches/${editingBranch.id}`, payload);
        toast.success('Branch updated successfully');
      } else {
        await apiClient.post('/api/super-admin/branches', payload);
        toast.success('Branch created successfully');
      }
      
      setShowModal(false);
      loadBranches();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to save branch');
      console.error(error);
    }
  };

  const handleDelete = async () => {
    try {
      if (!branchToDelete) return;
      await apiClient.delete(`/api/super-admin/branches/${branchToDelete.id}`);
      toast.success('Branch deleted successfully');
      setShowDeleteModal(false);
      setBranchToDelete(null);
      loadBranches();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to delete branch');
    }
  };

  // Calculate totals - Safely check for mock data vs real data
  const totalStudents = branches.reduce((sum, b) => sum + (b.stats?.students || 0), 0);
  const totalTeachers = branches.reduce((sum, b) => sum + (b.stats?.teachers || 0), 0);
  const totalStaff = branches.reduce((sum, b) => sum + (b.stats?.staff || 0), 0);


  return (
    <div className="p-4 md:p-6 space-y-4 md:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex-1 pt-8">
          <h1 className="text-xl md:text-2xl font-bold text-gray-900">Branch Management</h1>
          <p className="text-sm text-gray-600 mt-1">Manage all coaching branches and locations</p>
        </div>
        {branches.length < 3 ? (
          <Button
            onClick={handleAddNew}
          >
            <Plus className="w-4 h-4" />
            Add Branch
          </Button>
        ) : (
          <div className="flex items-center gap-2 bg-amber-50 text-amber-700 px-4 py-2 rounded-lg border border-amber-200 text-sm font-medium">
            <Building2 className="w-4 h-4" />
            Branch creation limit reached (Max 3)
          </div>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <div className="bg-white p-4 md:p-6 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs md:text-sm text-gray-600">Total Branches</p>
              <p className="text-xl md:text-2xl font-bold text-gray-900 mt-1">{branches.length}</p>
            </div>
            <div className="w-10 h-10 md:w-12 md:h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <Building2 className="w-5 h-5 md:w-6 md:h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-4 md:p-6 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs md:text-sm text-gray-600">Total Students</p>
              <p className="text-xl md:text-2xl font-bold text-gray-900 mt-1">{totalStudents}</p>
            </div>
            <div className="w-10 h-10 md:w-12 md:h-12 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <GraduationCap className="w-5 h-5 md:w-6 md:h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-4 md:p-6 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs md:text-sm text-gray-600">Total Teachers</p>
              <p className="text-xl md:text-2xl font-bold text-gray-900 mt-1">{totalTeachers}</p>
            </div>
            <div className="w-10 h-10 md:w-12 md:h-12 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <UserCheck className="w-5 h-5 md:w-6 md:h-6 text-purple-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-4 md:p-6 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs md:text-sm text-gray-600">Total Staff</p>
              <p className="text-xl md:text-2xl font-bold text-gray-900 mt-1">{totalStaff}</p>
            </div>
            <div className="w-10 h-10 md:w-12 md:h-12 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <Users className="w-5 h-5 md:w-6 md:h-6 text-orange-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg border border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="min-w-0">
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search branches..."
            />
          </div>

          <Dropdown
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            options={[
              { value: '', label: 'All Status' },
              { value: 'active', label: 'Active' },
              { value: 'inactive', label: 'Inactive' },
            ]}
            placeholder={null}
          />
        </div>
      </div>

      {/* Branches Grid */}
      <div className="min-h-[400px]">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading && branches.length === 0 ? (
            // Initial loading skeletons
            <>
              <CardSkeleton />
              <CardSkeleton />
              <CardSkeleton />
            </>
          ) : branches.length === 0 && !loading ? (
            <div className="col-span-full bg-white p-12 rounded-lg border border-gray-200 text-center">
              <Building2 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No branches found. Create your first branch to get started.</p>
            </div>
          ) : (
            <>
              {loading && branches.length > 0 && (
                <div className="col-span-full mb-4">
                  <div className="flex items-center gap-2 text-blue-600 animate-pulse bg-blue-50 w-max px-4 py-1.5 rounded-full border border-blue-100 shadow-sm">
                    <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce"></div>
                    <span className="text-xs font-semibold uppercase tracking-wider">Refreshing Branches...</span>
                  </div>
                </div>
              )}
              {branches.map((branch) => (
                <BranchCard
                  key={branch.id}
                  branch={branch}
                  onView={handleView}
                  onEdit={handleEdit}
                  onDelete={(b) => {
                    setBranchToDelete(b);
                    setShowDeleteModal(true);
                  }}
                />
              ))}
            </>
          )}
        </div>
      </div>

      {/* Create/Edit Modal */}
      <BranchFormModal
        open={showModal}
        onClose={() => setShowModal(false)}
        editingBranch={editingBranch}
        formData={formData}
        setFormData={setFormData}
        onSubmit={handleFormSubmit}
      />

      {showDeleteModal && (
        <ConfirmDeleteModal
          title="Delete Branch"
          message={`Are you sure you want to delete "${branchToDelete?.name}"? This action cannot be undone and will remove all data associated with this branch.`}
          onConfirm={handleDelete}
          onCancel={() => {
            setShowDeleteModal(false);
            setBranchToDelete(null);
          }}
        />
      )}

      {/* View Details Modal */}
      <BranchViewModal
        open={showViewModal}
        onClose={() => setShowViewModal(false)}
        branch={viewingBranch}
        onEdit={handleEdit}
      />
    </div>
  );
}

export default withAuth(BranchesPage, { requiredRole: [ROLES.SUPER_ADMIN] });
