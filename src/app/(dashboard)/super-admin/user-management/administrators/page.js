"use client";
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Input from "@/components/ui/input";
import PasswordInput from "@/components/ui/password-input";
import Modal from "@/components/ui/modal";
import BranchSelect from "@/components/ui/branch-select";
import GenderSelect from "@/components/ui/gender-select";
import BloodGroupSelect from "@/components/ui/blood-group";
import DocumentTypeSelect from "@/components/ui/document-type-select";
import PhoneInput from "@/components/ui/phone-input";
import CNICInput from "@/components/ui/cnic-input";
import DatePicker from "@/components/ui/date-picker";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import apiClient from "@/lib/api-client";
import { API_ENDPOINTS } from "@/constants/api-endpoints";
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Eye,
  UserCog,
  Mail,
  Phone,
  MapPin,
  CheckCircle,
  XCircle,
  Building2,
  X,
} from "lucide-react";
import dynamic from "next/dynamic";
import Skeleton, { CardSkeleton, TableSkeleton, AdminManagementSkeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import Tabs, { TabPanel } from "@/components/ui/tabs";
import UserManagementTable from "@/components/common/UserManagementTable";
import ConfirmDeleteModal from "@/components/modals/ConfirmDeleteModal";
import UserDetailModal from "@/components/modals/UserDetailModal";
import AdminChangeUserPasswordModal from "@/components/modals/AdminChangeUserPasswordModal";

export default function AdministratorsPage() {
  const [admins, setAdmins] = useState([]);
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({
    totalPages: 1,
    totalItems: 0,
    limit: 10,
  });
  const [showModal, setShowModal] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [viewingAdmin, setViewingAdmin] = useState(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [adminToDelete, setAdminToDelete] = useState(null);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    password: "",
    role: "branch_admin",
    branchId: "",
    isActive: true,
    dateOfBirth: "",
    gender: "",
    nationality: "Pakistani",
    cnic: "",
    religion: "",
    bloodGroup: "",
    address: { street: "", city: "", state: "", postalCode: "" },
  });

  const [activeTab, setActiveTab] = useState(1);
  const TOTAL_TABS = 3;
  const [profileFile, setProfileFile] = useState(null);
  const [profileUploading, setProfileUploading] = useState(false);
  const [queuedDocuments, setQueuedDocuments] = useState([]); // [{ file, type }]
  const [docUploading, setDocUploading] = useState(false);
  const [uploadedAdminDocTypes, setUploadedAdminDocTypes] = useState([]);

  const ADMIN_DOC_TYPES = [
    "cnic",
    "id_card",
    "cv",
    "certificate",
    "photo",
    "other",
  ];

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setCurrentPage(1); // reset to first page on search
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    loadAdmins();
  }, [debouncedSearch, currentPage]);

  useEffect(() => {
    loadBranches();
  }, []);

  const loadAdmins = async () => {
    try {
      setLoading(true);
      const query = new URLSearchParams({
        page: currentPage,
        limit: pagination.limit || 50,
        search: debouncedSearch,
      }).toString();

      const response = await apiClient.get(
        `${API_ENDPOINTS.SUPER_ADMIN.BRANCH_ADMINS.LIST}?${query}`,
      );

      if (response?.success) {
        const adminData = response.data?.admins || response.branch_admins || [];
        setAdmins(adminData);
        if (response.data?.pagination) {
          setPagination(response.data.pagination);
        }
      } else {
        setAdmins([]);
      }
    } catch (error) {
      console.error("Failed to load administrators:", error);
      toast.error("Failed to load administrators");
      setAdmins([]);
    } finally {
      setLoading(false);
    }
  };

  const loadBranches = async () => {
    try {
      const response = await apiClient.get(
        `${API_ENDPOINTS.SUPER_ADMIN.BRANCHES.LIST}?limit=200`,
      );

      if (response?.success) {
        const branchList = response.data?.branches || response.data || [];
        setBranches(branchList);
      }
    } catch (error) {
      console.error("Failed to load branches:", error);
      toast.error("Failed to load branches");
    }
  };

  // Optimization: Use the full branches list directly as multiple admins per branch are allowed
  const availableBranches = branches;

  const handleAddNew = () => {
    setEditingAdmin(null);
    setFormData({
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      password: "",
      role: "branch_admin",
      branchId: "",
      isActive: true,
      dateOfBirth: "",
      gender: "",
      nationality: "Pakistani",
      cnic: "",
      religion: "",
      bloodGroup: "",
      address: { street: "", city: "", state: "", postalCode: "" },
      permissions: [],
    });
    setUploadedAdminDocTypes([]);
    setProfileFile(null);
    setQueuedDocuments([]);
    setShowModal(true);
  };

  const handleEdit = (admin) => {
    setEditingAdmin(admin);
    const currentBranchId = admin.branch_id?.id || admin.branch_id || "";
    setFormData({
      firstName: admin.first_name || "",
      lastName: admin.last_name || "",
      email: admin.email || "",
      phone: admin.phone || "",
      password: "", // Leave empty for edit
      role: admin.role || "BRANCH_ADMIN",
      branchId: currentBranchId,
      isActive: admin.is_active !== false,
      dateOfBirth: admin.details?.date_of_birth
        ? new Date(admin.details.date_of_birth).toISOString().slice(0, 10)
        : "",
      gender: admin.details?.gender || "",
      nationality: admin.details?.nationality || "Pakistani",
      cnic: admin.details?.cnic || "",
      religion: admin.details?.religion || "",
      bloodGroup: admin.details?.blood_group || "",
      address: {
        street: admin.details?.address?.street || "",
        city: admin.details?.address?.city || "",
        state: admin.details?.address?.state || "",
        postalCode: admin.details?.address?.postalCode || "",
      },
    });
    // Populate uploaded admin document types (if any)
    const existingAdminDocs = admin.documents || [];
    setUploadedAdminDocTypes(existingAdminDocs.map((d) => d.type));
    setShowModal(true);
  };

  const handleDelete = async (admin) => {
    setAdminToDelete(admin);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!adminToDelete) return;

    try {
      setLoading(true);
      const response = await apiClient.delete(
        API_ENDPOINTS.SUPER_ADMIN.BRANCH_ADMINS.DELETE.replace(":id", adminToDelete.id),
      );

      if (response?.success) {
        toast.success("Administrator deleted successfully");
        loadAdmins();
      } else {
        toast.error(response?.message || "Failed to delete administrator");
      }
    } catch (error) {
      toast.error("Failed to delete administrator");
      console.error(error);
    } finally {
      setLoading(false);
      setShowDeleteModal(false);
      setAdminToDelete(null);
    }
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (!formData.firstName || !formData.lastName) {
      toast.error("First name and last name are required");
      return;
    }

    if (!formData.email) {
      toast.error("Email is required");
      return;
    }

    if (!formData.phone) {
      toast.error("Phone is required");
      return;
    }

    if (!formData.dateOfBirth) {
      toast.error("Date of birth is required");
      return;
    }

    if (!formData.gender) {
      toast.error("Gender is required");
      return;
    }

    if (!editingAdmin && !formData.password) {
      toast.error("Password is required for new administrator");
      return;
    }

    if (!editingAdmin && formData.password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    if (formData.role === "branch_admin" && !formData.branchId) {
      toast.error("Please select a branch for branch admin");
      return;
    }

    try {
      setSubmitting(true);

      const url = editingAdmin
        ? API_ENDPOINTS.SUPER_ADMIN.BRANCH_ADMINS.UPDATE.replace(
            ":id",
            editingAdmin.id,
          )
        : API_ENDPOINTS.SUPER_ADMIN.BRANCH_ADMINS.CREATE;

      // Build text data
      const textData = {
        branch_id: formData.branchId,
        first_name: formData.firstName,
        last_name: formData.lastName,
        email: formData.email,
        phone: formData.phone,
        password: formData.password || undefined,
        is_active: formData.isActive,
        details: {
          date_of_birth: formData.dateOfBirth,
          gender: formData.gender,
          nationality: formData.nationality,
          cnic: formData.cnic,
          religion: formData.religion,
          blood_group: formData.bloodGroup,
          address: formData.address,
        },
        documents: editingAdmin ? editingAdmin.documents : undefined, // Keep existing docs on edit
      };

      // Use FormData for integrated upload
      const fd = new FormData();
      fd.append("data", JSON.stringify(textData));

      if (profileFile) {
        fd.append("profilePhoto", profileFile);
      }

      if (queuedDocuments.length > 0) {
        const docMetadata = [];
        queuedDocuments.forEach((doc) => {
          fd.append("documents", doc.file);
          docMetadata.push({
            type: doc.type,
            name: doc.file.name,
            isExisting: false,
          });
        });

        // Add existing documents if editing
        if (editingAdmin && editingAdmin.documents) {
          editingAdmin.documents.forEach((doc) => {
            docMetadata.push({ ...doc, isExisting: true });
          });
        }
        fd.append("documentMetadata", JSON.stringify(docMetadata));
      } else if (editingAdmin && editingAdmin.documents) {
        // If no new docs but editing, we still need to send existing doc structure in JSON if changed
        // Actually, the API handles 'documents' in textData too.
      }

      console.log("Submitting branch admin with integrated files...");
      const response = editingAdmin
        ? await apiClient.put(url, fd, { headers: { "Content-Type": "multipart/form-data" } })
        : await apiClient.post(url, fd, { headers: { "Content-Type": "multipart/form-data" } });

      if (response?.success) {
        toast.success(
          editingAdmin
            ? "Administrator updated successfully"
            : "Administrator created successfully",
        );
        
        setQueuedDocuments([]);
        setProfileFile(null);
        setShowModal(false);
        loadAdmins();
        loadBranches();
      } else {
        toast.error(response?.message || "Failed to save administrator");
      }
    } catch (error) {
      console.error("Form submission failed:", error);
      toast.error(
        error?.message || "Failed to save administrator. Please try again.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  // No client-side filtering needed with server-side search, but keep for robustness if small batch
  const filteredAdmins = admins;

  const isLastTab = activeTab === TOTAL_TABS;

  const modalFooter = (
    <div className="flex justify-between items-center w-full">
      <div>
        {activeTab > 1 && (
          <Button
            variant="ghost"
            onClick={() => setActiveTab((s) => Math.max(1, s - 1))}
          >
            Back
          </Button>
        )}
      </div>
      <div className="flex items-center space-x-3">
        <Button
          type="button"
          variant="outline"
          onClick={() => setShowModal(false)}
          disabled={submitting}
        >
          Cancel
        </Button>
        {!isLastTab && (
          <Button
            onClick={() => setActiveTab((s) => Math.min(TOTAL_TABS, s + 1))}
          >
            Next
          </Button>
        )}
        {isLastTab && (
          <Button
            type="submit"
            disabled={submitting}
            onClick={handleFormSubmit}
          >
            {submitting ? (
              <span className="flex items-center">
                <svg
                  className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Saving...
              </span>
            ) : editingAdmin ? (
              "Update"
            ) : (
              "Create"
            )}
          </Button>
        )}
      </div>
    </div>
  );

  if (loading && admins.length === 0) {
    return (
      <div className="p-4 sm:p-6 min-h-screen">
        <AdminManagementSkeleton />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pt-4 sm:pt-8 gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100">
            Administrators Management
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1 text-sm sm:text-base">
            Manage system and branch administrators
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Branch Admins</p>
                <p className="text-2xl font-bold text-gray-900">
                  {admins.length}
                </p>
              </div>
              <UserCog className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active</p>
                <p className="text-2xl font-bold text-green-600">
                  {admins.filter((a) => a.is_active).length}
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Inactive</p>
                <p className="text-2xl font-bold text-red-600">
                  {admins.filter((a) => !a.is_active).length}
                </p>
              </div>
              <XCircle className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Assigned Branches</p>
                <p className="text-2xl font-bold text-purple-600">
                  {admins.filter((a) => a.branch_id).length}
                </p>
              </div>
              <Building2 className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-4">
          <Input
            icon={Search}
            type="text"
            placeholder="Search by name, email, or phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            fullWidth={true}
          />
        </CardContent>
      </Card>

      {/* Administrators Table */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
            <CardTitle className="text-lg sm:text-xl">
              All Administrators ({filteredAdmins.length})
            </CardTitle>
            <Button onClick={handleAddNew} className="w-full sm:w-auto">
              <Plus className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Add Administrator</span>
              <span className="sm:hidden">Add Admin</span>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <UserManagementTable
            data={filteredAdmins}
            loading={loading}
            onView={(admin) => {
              setViewingAdmin(admin);
              setShowViewModal(true);
            }}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onToggleStatus={async (admin) => {
              try {
                const response = await apiClient.put(API_ENDPOINTS.SUPER_ADMIN.BRANCH_ADMINS.UPDATE.replace(":id", admin.id), {
                  is_active: !admin.is_active
                });
                if (response.success) {
                  toast.success(`Administrator ${!admin.is_active ? 'activated' : 'deactivated'} successfully`);
                  loadAdmins();
                }
              } catch (error) {
                toast.error('Failed to update status');
              }
            }}
            onChangePassword={(admin) => {
              setViewingAdmin(admin);
              setShowPasswordModal(true);
            }}
          />

          {/* Pagination Controls */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between mt-6 bg-white dark:bg-gray-900 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800">
              <div className="text-sm text-gray-600 dark:text-gray-400 font-medium">
                Showing <span className="font-bold text-blue-600">{((currentPage - 1) * pagination.limit) + 1}</span> to <span className="font-bold text-blue-600">{Math.min(currentPage * pagination.limit, pagination.totalItems)}</span> of {pagination.totalItems} administrators
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="px-4"
                >
                  Previous
                </Button>
                <div className="flex items-center gap-1">
                  {[...Array(pagination.totalPages)].map((_, i) => (
                    <Button
                      key={i + 1}
                      variant={currentPage === i + 1 ? "default" : "outline"}
                      size="sm"
                      className={`w-8 h-8 p-0 ${currentPage === i + 1 ? 'shadow-md shadow-blue-500/20' : ''}`}
                      onClick={() => setCurrentPage(i + 1)}
                    >
                      {i + 1}
                    </Button>
                  ))}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.min(pagination.totalPages, prev + 1))}
                  disabled={currentPage >= pagination.totalPages}
                  className="px-4"
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {showDeleteModal && (
        <ConfirmDeleteModal
          title="Delete Administrator"
          message={`Are you sure you want to delete ${adminToDelete?.first_name} ${adminToDelete?.last_name}? This action cannot be undone.`}
          onConfirm={confirmDelete}
          onCancel={() => {
            setShowDeleteModal(false);
            setAdminToDelete(null);
          }}
        />
      )}

      {/* Create/Edit Modal */}
      <Modal
        open={showModal}
        onClose={() => setShowModal(false)}
        title={editingAdmin ? "Update Administrator" : "Create Administrator"}
        size="lg"
        footer={modalFooter}
      >
        <div className="text-sm text-gray-500 dark:text-gray-400 mb-6">
          {editingAdmin
            ? "Update administrator information"
            : "Create a new administrator account"}
        </div>

        <div className="space-y-5">
          <Tabs
            tabs={[
              { id: 1, label: "Personal" },
              { id: 2, label: "Account" },
              { id: 3, label: "Profile" },
            ]}
            activeTab={activeTab}
            onChange={(id) => setActiveTab(id)}
            className="mb-4"
          />

          <TabPanel value={1} activeTab={activeTab}>
            {/* Personal Information Section */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 uppercase tracking-wide">
                Personal Information
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    First Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.firstName}
                    onChange={(e) =>
                      setFormData({ ...formData, firstName: e.target.value })
                    }
                    placeholder="Enter first name"
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Last Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.lastName}
                    onChange={(e) =>
                      setFormData({ ...formData, lastName: e.target.value })
                    }
                    placeholder="Enter last name"
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Email Address <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  placeholder="admin@example.com"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <PhoneInput
                  label="Phone Number"
                  value={formData.phone}
                  onChange={(val) => setFormData({ ...formData, phone: val })}
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <DatePicker
                    label="Date of Birth"
                    value={formData.dateOfBirth}
                    onChange={(e) =>
                      setFormData({ ...formData, dateOfBirth: e.target.value })
                    }
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Gender <span className="text-red-500">*</span>
                  </label>
                  <GenderSelect
                    id="gender"
                    name="gender"
                    value={formData.gender}
                    onChange={(e) =>
                      setFormData({ ...formData, gender: e.target?.value ?? e })
                    }
                    placeholder="Select gender"
                    className="w-full"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <CNICInput
                    label="CNIC / ID Card"
                    value={formData.cnic}
                    onChange={(val) => setFormData({ ...formData, cnic: val })}
                    placeholder="42101-XXXXXXX-X"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Religion
                  </label>
                  <input
                    type="text"
                    value={formData.religion}
                    onChange={(e) =>
                      setFormData({ ...formData, religion: e.target.value })
                    }
                    placeholder="e.g. Islam"
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Blood Group
                  </label>
                  <BloodGroupSelect
                    value={formData.bloodGroup}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        bloodGroup: e.target?.value ?? e,
                      })
                    }
                    className="w-full"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Nationality
                  </label>
                  <input
                    type="text"
                    value={formData.nationality}
                    onChange={(e) =>
                      setFormData({ ...formData, nationality: e.target.value })
                    }
                    placeholder="Pakistani"
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 uppercase tracking-wide">
                  Address Information
                </h3>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Street Address
                  </label>
                  <input
                    type="text"
                    value={formData.address.street}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        address: {
                          ...formData.address,
                          street: e.target.value,
                        },
                      })
                    }
                    placeholder="123 Main St"
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      City
                    </label>
                    <input
                      type="text"
                      value={formData.address.city}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          address: {
                            ...formData.address,
                            city: e.target.value,
                          },
                        })
                      }
                      placeholder="Karachi"
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      State / Province
                    </label>
                    <input
                      type="text"
                      value={formData.address.state}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          address: {
                            ...formData.address,
                            state: e.target.value,
                          },
                        })
                      }
                      placeholder="Sindh"
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div className="col-span-2 lg:col-span-1">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Postal Code
                    </label>
                    <input
                      type="text"
                      value={formData.address.postalCode}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          address: {
                            ...formData.address,
                            postalCode: e.target.value,
                          },
                        })
                      }
                      placeholder="75000"
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>

              {!editingAdmin && (
                <div>
                  <PasswordInput
                    label="Password"
                    value={formData.password}
                    onChange={(e) =>
                      setFormData({ ...formData, password: e.target.value })
                    }
                    placeholder="Minimum 6 characters"
                    required={!editingAdmin}
                    minLength={6}
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Password must be at least 6 characters long
                  </p>
                </div>
              )}

              {editingAdmin && (
                <div>
                  <PasswordInput
                    label="New Password (Optional)"
                    value={formData.password}
                    onChange={(e) =>
                      setFormData({ ...formData, password: e.target.value })
                    }
                    placeholder="Leave empty to keep current password"
                    minLength={6}
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Only fill this if you want to change the password
                  </p>
                </div>
              )}
            </div>
          </TabPanel>

          <TabPanel value={2} activeTab={activeTab}>
            {/* Account Configuration Section */}
            <div className="space-y-4 pt-4 border-t border-gray-200 dark:border-gray-700 min-h-[400px]">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 uppercase tracking-wide">
                Account Configuration
              </h3>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Branch Assignment <span className="text-red-500">*</span>
                </label>
                <BranchSelect
                  id="branchId"
                  name="branchId"
                  value={formData.branchId}
                  onChange={(e) =>
                    setFormData({ ...formData, branchId: e.target?.value ?? e })
                  }
                  branches={availableBranches}
                  placeholder="Select Branch"
                  className="w-full"
                />
                {availableBranches.length === 0 && (
                  <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                    ⚠️ All branches already have administrators assigned
                  </p>
                )}
                {availableBranches.length > 0 && !editingAdmin && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    ✓ {availableBranches.length} branch
                    {availableBranches.length > 1 ? "es" : ""} available without
                    admin
                  </p>
                )}
              </div>

              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <p className="text-sm text-blue-800 dark:text-blue-300">
                  <strong className="font-semibold">Branch Admin</strong> will
                  manage all operations for the assigned branch only.
                </p>
              </div>
            </div>
          </TabPanel>

          <TabPanel value={3} activeTab={activeTab}>
            <div className="space-y-6 pt-4 border-t border-gray-200 dark:border-gray-700 min-h-[400px]">
              {/* Profile Photo Section */}
              <div className="flex flex-col items-center justify-center p-6 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800 transition-all hover:border-indigo-400/50 group">
                <div className="relative">
                  <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-white dark:border-slate-800 shadow-xl bg-white dark:bg-slate-800 flex items-center justify-center group-hover:scale-105 transition-transform duration-300">
                    {profileFile || (editingAdmin && (editingAdmin.avatar_url || editingAdmin.profilePhoto?.url)) ? (
                      <img
                        src={profileFile ? URL.createObjectURL(profileFile) : (editingAdmin.avatar_url || editingAdmin.profilePhoto?.url)}
                        alt="Profile Preview"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <UserCog className="w-12 h-12 text-slate-300" />
                    )}
                    
                    {profileUploading && (
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                        <div className="w-8 h-8 border-4 border-white/30 border-t-white rounded-full animate-spin" />
                      </div>
                    )}
                  </div>
                  
                  <label className="absolute bottom-0 right-0 p-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full shadow-lg cursor-pointer transition-all hover:scale-110 active:scale-95 group-hover:ring-4 group-hover:ring-indigo-500/20">
                    <Plus className="w-5 h-5" />
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const f = e.target.files[0];
                        if (!f) return;
                        setProfileFile(f);
                        toast.success("Profile photo selected. It will be saved when you update the administrator.");
                      }}
                    />
                  </label>
                </div>
                <div className="mt-4 text-center">
                  <h4 className="text-sm font-bold text-slate-700 dark:text-slate-200">Administrator Photo</h4>
                  <p className="text-xs text-slate-500 mt-1">PNG, JPG or JPEG (Max. 2MB)</p>
                </div>
              </div>
 
               {/* Documents Section */}
               <div className="space-y-4">
                 <div className="flex items-center justify-between">
                   <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                     <Building2 className="w-4 h-4 text-indigo-500" />
                     Management Documents
                   </h4>
                 </div>
 
                 <div className="grid grid-cols-1 gap-4">
                   <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
                     <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
                       <DocumentTypeSelect
                         label="Document Category"
                         value={formData.selectedDocumentType || ""}
                         onChange={(e) => setFormData({ ...formData, selectedDocumentType: e.target?.value ?? e })}
                         options={ADMIN_DOC_TYPES.map(t => ({ label: t.replace(/_/g, " "), value: t }))}
                         placeholder="Choose Category..."
                       />
                     </div>
                     
                     <div className="p-6">
                       <label 
                         htmlFor="doc-upload"
                         className="flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-2xl transition-all cursor-pointer border-slate-200 dark:border-slate-800 hover:border-indigo-400 dark:hover:border-indigo-500 hover:bg-slate-50 dark:hover:bg-slate-800/50"
                       >
                         <input
                           id="doc-upload"
                           type="file"
                           className="hidden"
                           onChange={(e) => {
                             const f = e.target.files[0];
                             if (f) {
                               if (!formData.selectedDocumentType) {
                                 toast.error("Please select a document category first");
                                 return;
                               }
                               // Add to queue
                               const newDoc = { file: f, type: formData.selectedDocumentType, id: Math.random().toString(36).substr(2, 9) };
                               setQueuedDocuments(prev => [...prev, newDoc]);
                               toast.success(`${formData.selectedDocumentType.replace(/_/g, " ")} added to queue`);
                             }
                           }}
                         />
                         
                         <div className="flex flex-col items-center text-center">
                           <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-xl flex items-center justify-center mb-3 text-slate-400">
                             <Plus className="w-6 h-6" />
                           </div>
                           <span className="text-sm font-bold text-slate-600 dark:text-slate-300">
                             Click to add document
                           </span>
                           <span className="text-xs text-slate-400 mt-1">
                             You can add multiple documents to the queue
                           </span>
                         </div>
                       </label>
                     </div>
 
                     {/* Queued Documents List */}
                     {queuedDocuments.length > 0 && (
                       <div className="px-6 pb-4 space-y-2">
                         <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest px-1">Waiting to Upload ({queuedDocuments.length})</p>
                         {queuedDocuments.map((doc) => (
                           <div key={doc.id} className="flex items-center justify-between p-3 bg-indigo-50/50 dark:bg-indigo-900/10 border border-indigo-100 dark:border-indigo-900/30 rounded-xl">
                             <div className="flex items-center gap-3">
                               <div className="w-8 h-8 bg-indigo-100 dark:bg-indigo-900/50 rounded-lg flex items-center justify-center text-indigo-600">
                                 <Building2 className="w-4 h-4" />
                               </div>
                               <div>
                                 <p className="text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-tight">{doc.type.replace(/_/g, " ")}</p>
                                 <p className="text-[10px] text-slate-500 truncate max-w-[150px]">{doc.file.name}</p>
                               </div>
                             </div>
                             <button 
                               onClick={() => setQueuedDocuments(prev => prev.filter(d => d.id !== doc.id))}
                               className="p-1.5 hover:bg-red-100 hover:text-red-600 rounded-lg transition-colors text-slate-400"
                             >
                               <X className="w-4 h-4" />
                             </button>
                           </div>
                         ))}
                       </div>
                     )}
 
                      <div className="px-6 pb-6">
                        {/* Integrated upload logic - no separate button needed */}
                        <p className="text-[10px] text-slate-400 text-center italic">
                          Files will be uploaded when you click "Save Administrator"
                        </p>
                      </div>
                   </div>
 
                   {uploadedAdminDocTypes.length > 0 && (
                     <div className="space-y-2">
                       <p className="text-[10px] font-bold text-green-500 uppercase tracking-widest px-1">Successfully Uploaded</p>
                       <div className="flex flex-wrap gap-2">
                         {uploadedAdminDocTypes.map((type, index) => (
                           <div key={`${type}-${index}`} className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-slate-900 border border-green-100 dark:border-green-900/50 rounded-xl shadow-sm">
                             <div className="w-6 h-6 bg-green-50 dark:bg-green-900/30 rounded-lg flex items-center justify-center text-green-600">
                               <CheckCircle className="w-3.5 h-3.5" />
                             </div>
                             <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase">
                               {type.replace(/_/g, " ")}
                             </span>
                           </div>
                         ))}
                       </div>
                     </div>
                   )}
                 </div>
               </div>

              {/* Status Section */}
              <div className="bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">Account Status</h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">Control if this admin can login to the system</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 dark:peer-focus:ring-indigo-800 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-indigo-600"></div>
                </label>
              </div>
            </div>
          </TabPanel>
        </div>
      </Modal>

      {/* View Modal - Detailed administrator profile */}
      <UserDetailModal
        open={showViewModal}
        onClose={() => {
          setShowViewModal(false);
          setViewingAdmin(null);
        }}
        user={viewingAdmin}
        title="Administrator Details"
      />

      {/* Change Password Modal */}
      <AdminChangeUserPasswordModal
        isOpen={showPasswordModal}
        onClose={() => {
          setShowPasswordModal(false);
          setViewingAdmin(null);
        }}
        userToEdit={viewingAdmin}
        userRole="branch_admin"
        adminRole="SUPER_ADMIN"
      />
    </div>
  );
}
