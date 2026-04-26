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
  Download
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import Modal from '@/components/ui/modal';
import AddStaffModal from '@/components/modals/AddStaffModal';
import FullPageLoader from '@/components/ui/full-page-loader';
import Dropdown from '@/components/ui/dropdown';
import { toast } from 'sonner';
import UserManagementTable from '@/components/common/UserManagementTable';
import ConfirmDeleteModal from '@/components/modals/ConfirmDeleteModal';

const STATUS_OPTIONS = [
  { label: 'All Status', value: 'all' },
  { label: 'Active', value: 'active' },
  { label: 'Inactive', value: 'inactive' },
];

export default function BranchAdminStaffPage() {
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
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [staffToDelete, setStaffToDelete] = useState(null);

  // Load staff
  const loadStaff = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get(API_ENDPOINTS.BRANCH_ADMIN.STAFF.LIST);
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

  useEffect(() => {
    loadStaff();
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

    setFilteredStaff(filtered);
  }, [searchQuery, statusFilter, staff]);

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
      const endpoint = API_ENDPOINTS.BRANCH_ADMIN.STAFF.DELETE.replace(':id', staffToDelete.id);
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
      const endpoint = API_ENDPOINTS.BRANCH_ADMIN.STAFF.UPDATE.replace(':id', staffMember.id);
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

  if (loading) {
    return <FullPageLoader message="Loading staff..." />;
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Staff Management</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Manage staff members in your branch</p>
        </div>
        <Button onClick={handleAddStaff} className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Add Staff
        </Button>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
        data={filteredStaff}
        loading={loading}
        onView={handleViewStaff}
        onEdit={handleEditStaff}
        onDelete={handleDeleteStaff}
        onToggleStatus={handleToggleStatus}
        onDownloadQR={handleDownloadQR}
      />

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
          role="BRANCH_ADMIN"
        />
      )}

      {/* View Staff Modal */}
      {showViewModal && selectedStaff && (
        <Modal
          open={showViewModal}
          onClose={() => setShowViewModal(false)}
          title="Staff Profile Overview"
          size="xl"
        >
          <div className="space-y-8 p-2">
            {/* Header Section: Profile & QR */}
            <div className="flex flex-col md:flex-row gap-8 items-start bg-gray-50 dark:bg-gray-700/30 p-6 rounded-2xl border border-gray-100 dark:border-gray-700">
              <div className="relative group">
                <div className="h-40 w-40 rounded-2xl bg-white dark:bg-gray-800 flex items-center justify-center overflow-hidden border-4 border-white dark:border-gray-800 shadow-xl">
                  {selectedStaff.avatar_url ? (
                    <img
                      src={selectedStaff.avatar_url}
                      alt={`${selectedStaff.first_name} ${selectedStaff.last_name}`}
                      className="h-full w-full object-cover transition-transform group-hover:scale-110"
                    />
                  ) : (
                    <span className="text-5xl font-bold text-blue-500">
                      {selectedStaff.first_name?.charAt(0)}{selectedStaff.last_name?.charAt(0)}
                    </span>
                  )}
                </div>
                <div className={`absolute -bottom-3 -right-3 px-4 py-1 rounded-full text-xs font-bold uppercase shadow-lg ${
                  selectedStaff.is_active ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
                }`}>
                  {selectedStaff.is_active ? 'Active' : 'Inactive'}
                </div>
              </div>

              <div className="flex-1 space-y-4">
                <div>
                  <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white">
                    {selectedStaff.first_name} {selectedStaff.last_name}
                  </h2>
                  <p className="text-blue-600 dark:text-blue-400 font-semibold tracking-wide uppercase text-sm mt-1">
                    {selectedStaff.staff_sub_type || 'Staff Member'}
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-2 gap-x-6 text-sm">
                  <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                    <span className="font-bold text-gray-900 dark:text-gray-200">ID:</span>
                    {selectedStaff.registration_no}
                  </div>
                  <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                    <span className="font-bold text-gray-900 dark:text-gray-200">Email:</span>
                    {selectedStaff.email}
                  </div>
                  <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                    <span className="font-bold text-gray-900 dark:text-gray-200">Phone:</span>
                    {selectedStaff.phone || 'N/A'}
                  </div>
                  <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                    <span className="font-bold text-gray-900 dark:text-gray-200">Branch:</span>
                    {selectedStaff.branch?.name || 'N/A'}
                  </div>
                </div>
              </div>

              {selectedStaff.qr_code_url && (
                <div className="bg-white p-3 rounded-xl shadow-md border border-gray-100">
                  <img
                    src={selectedStaff.qr_code_url}
                    alt="Access QR"
                    className="h-28 w-28"
                  />
                  <p className="text-[10px] text-center mt-2 font-bold text-gray-400 uppercase tracking-tighter">Digital ID</p>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Left Column: Personal & Address */}
              <div className="lg:col-span-2 space-y-8">
                {/* Personal Information */}
                <section>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <div className="w-1.5 h-6 bg-blue-600 rounded-full" />
                    Personal Details
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-6 bg-gray-50/50 dark:bg-gray-800/40 p-5 rounded-xl border border-gray-100 dark:border-gray-700">
                    <DetailItem label="Gender" value={selectedStaff.details?.gender || selectedStaff.gender} />
                    <DetailItem label="Date of Birth" value={selectedStaff.details?.dateOfBirth || selectedStaff.details?.date_of_birth} isDate />
                    <DetailItem label="CNIC" value={selectedStaff.details?.cnic || selectedStaff.cnic} />
                    <DetailItem label="Religion" value={selectedStaff.details?.religion} />
                    <DetailItem label="Nationality" value={selectedStaff.details?.nationality} />
                    <DetailItem label="Blood Group" value={selectedStaff.details?.bloodGroup || selectedStaff.details?.blood_group} />
                    <DetailItem label="Alt. Phone" value={selectedStaff.details?.alternatePhone || selectedStaff.details?.alternate_phone} />
                  </div>
                </section>

                {/* Address Information */}
                <section>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <div className="w-1.5 h-6 bg-purple-600 rounded-full" />
                    Residential Address
                  </h3>
                  <div className="bg-gray-50/50 dark:bg-gray-800/40 p-5 rounded-xl border border-gray-100 dark:border-gray-700">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                      <div className="sm:col-span-2">
                        <DetailItem label="Street Address" value={selectedStaff.details?.address?.street} />
                      </div>
                      <DetailItem label="City" value={selectedStaff.details?.address?.city} />
                      <DetailItem label="State/Province" value={selectedStaff.details?.address?.state} />
                      <DetailItem label="Country" value={selectedStaff.details?.address?.country} />
                    </div>
                  </div>
                </section>

                {/* Documents Grid */}
                <section>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <div className="w-1.5 h-6 bg-green-600 rounded-full" />
                    Verified Documents
                  </h3>
                  {selectedStaff.documents?.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {selectedStaff.documents.map((doc, idx) => (
                        <div key={idx} className="flex items-center justify-between p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                              <Download className="w-5 h-5 text-blue-600" />
                            </div>
                            <div className="overflow-hidden">
                              <p className="text-sm font-bold text-gray-900 dark:text-white truncate max-w-[140px]">{doc.name}</p>
                              <p className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">{doc.type}</p>
                            </div>
                          </div>
                          <a href={doc.url} target="_blank" rel="noreferrer" className="text-xs font-bold text-blue-600 hover:underline">VIEW</a>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500 italic">No documents uploaded</p>
                  )}
                </section>
              </div>

              {/* Right Column: Work & Specialized */}
              <div className="space-y-8">
                {/* Employment */}
                <section>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <div className="w-1.5 h-6 bg-orange-600 rounded-full" />
                    Job Profile
                  </h3>
                  <div className="space-y-4 bg-gray-50/50 dark:bg-gray-800/40 p-5 rounded-xl border border-gray-100 dark:border-gray-700">
                    <DetailItem label="Designation" value={selectedStaff.details?.designation} />
                    <DetailItem label="Joining Date" value={selectedStaff.details?.joiningDate || selectedStaff.details?.joining_date} isDate />
                    <DetailItem label="Staff Sub-Type" value={selectedStaff.staff_sub_type} />
                  </div>
                </section>

                {/* Working Schedule */}
                <section>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <div className="w-1.5 h-6 bg-cyan-600 rounded-full" />
                    Work Schedule
                  </h3>
                  <div className="space-y-4 bg-gray-50/50 dark:bg-gray-800/40 p-5 rounded-xl border border-gray-100 dark:border-gray-700">
                    <div className="flex justify-between items-center">
                      <DetailItem label="Start Time" value={selectedStaff.details?.workingHours?.startTime || selectedStaff.details?.working_hours?.startTime} />
                      <DetailItem label="End Time" value={selectedStaff.details?.workingHours?.endTime || selectedStaff.details?.working_hours?.endTime} />
                    </div>
                    <DetailItem label="Break" value={selectedStaff.details?.workingHours?.breakDuration || selectedStaff.details?.working_hours?.breakDuration ? `${selectedStaff.details?.workingHours?.breakDuration || selectedStaff.details?.working_hours?.breakDuration} mins` : null} />
                    <div>
                      <p className="text-[10px] font-bold text-gray-400 uppercase mb-2">Working Days</p>
                      <div className="flex flex-wrap gap-1">
                        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => {
                          const workingDays = selectedStaff.details?.workingHours?.workingDays || selectedStaff.details?.working_hours?.workingDays || [];
                          return (
                            <span key={day} className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              workingDays.some(d => d.startsWith(day))
                                ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300'
                                : 'bg-gray-200 text-gray-400 dark:bg-gray-700 dark:text-gray-500'
                            }`}>
                              {day}
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </section>

                {/* Specialized Info (If any) */}
                {(selectedStaff.details?.specializedInfo?.driverLicense?.number || 
                  selectedStaff.details?.specialized_info?.driverLicense?.number ||
                  selectedStaff.details?.specializedInfo?.securityBadgeNumber || 
                  selectedStaff.details?.specialized_info?.securityBadgeNumber) && (
                  <section>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                      <div className="w-1.5 h-6 bg-red-600 rounded-full" />
                      Specialized Info
                    </h3>
                    <div className="space-y-4 bg-red-50/30 dark:bg-red-900/10 p-5 rounded-xl border border-red-100 dark:border-red-900/30">
                      {(selectedStaff.details?.specializedInfo?.driverLicense?.number || selectedStaff.details?.specialized_info?.driverLicense?.number) && (
                        <>
                          <DetailItem label="License No" value={selectedStaff.details?.specializedInfo?.driverLicense?.number || selectedStaff.details?.specialized_info?.driverLicense?.number} />
                          <DetailItem label="License Type" value={selectedStaff.details?.specializedInfo?.driverLicense?.type || selectedStaff.details?.specialized_info?.driverLicense?.type} />
                          <DetailItem label="License Expiry" value={selectedStaff.details?.specializedInfo?.driverLicense?.expiryDate || selectedStaff.details?.specialized_info?.driverLicense?.expiryDate} isDate />
                        </>
                      )}
                      {(selectedStaff.details?.specializedInfo?.securityBadgeNumber || selectedStaff.details?.specialized_info?.securityBadgeNumber) && (
                        <DetailItem label="Security Badge" value={selectedStaff.details?.specializedInfo?.securityBadgeNumber || selectedStaff.details?.specialized_info?.securityBadgeNumber} />
                      )}
                      {(selectedStaff.details?.specializedInfo?.medicalQualification || selectedStaff.details?.specialized_info?.medicalQualification) && (
                        <DetailItem label="Medical Qual." value={selectedStaff.details?.specializedInfo?.medicalQualification || selectedStaff.details?.specialized_info?.medicalQualification} />
                      )}
                    </div>
                  </section>
                )}
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

// Helper Component for Details
function DetailItem({ label, value, isDate = false }) {
  if (!value && value !== 0) return (
    <div>
      <p className="text-[10px] font-bold text-gray-400 uppercase">{label}</p>
      <p className="text-sm font-medium text-gray-400">---</p>
    </div>
  );
  
  return (
    <div>
      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{label}</p>
      <p className="text-sm font-bold text-gray-900 dark:text-gray-100 truncate">
        {isDate ? new Date(value).toLocaleDateString('en-PK', { day: 'numeric', month: 'short', year: 'numeric' }) : value}
      </p>
    </div>
  );
}
