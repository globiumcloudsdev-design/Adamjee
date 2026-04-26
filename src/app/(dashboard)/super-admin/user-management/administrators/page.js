"use client";
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Input from "@/components/ui/input";
import Modal from "@/components/ui/modal";
import BranchSelect from "@/components/ui/branch-select";
import GenderSelect from "@/components/ui/gender-select";
import BloodGroupSelect from "@/components/ui/blood-group";
import DocumentTypeSelect from "@/components/ui/document-type-select";
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
} from "lucide-react";
import { toast } from "sonner";
import Tabs, { TabPanel } from "@/components/ui/tabs";
import UserManagementTable from "@/components/common/UserManagementTable";
import ConfirmDeleteModal from "@/components/modals/ConfirmDeleteModal";

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
    limit: 50,
  });
  const [showModal, setShowModal] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [viewingAdmin, setViewingAdmin] = useState(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [adminToDelete, setAdminToDelete] = useState(null);
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
  const [docFile, setDocFile] = useState(null);
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
    setDocFile(null);
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

      // Build request body for branch-admins specific API (snake_case)
      const body = {
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
      };

      console.log("Creating/Updating branch admin with data:", body);
      const response = editingAdmin
        ? await apiClient.put(url, body)
        : await apiClient.post(url, body);

      if (response?.success) {
        toast.success(
          editingAdmin
            ? "Administrator updated successfully"
            : "Administrator created successfully",
        );

        // If created and files are waiting to be uploaded, upload them now using returned user id
        const createdUser = response.data;
        if (!editingAdmin && createdUser) {
          try {
            if (profileFile) {
              const fd = new FormData();
              fd.append("file", profileFile);
              fd.append("fileType", "profile");
              fd.append("userId", createdUser._id);
              await apiClient.post("/api/upload", fd, {
                headers: { "Content-Type": "multipart/form-data" },
              });
            }

            if (docFile && formData && formData.selectedDocumentType) {
              const fd2 = new FormData();
              fd2.append("file", docFile);
              fd2.append("fileType", "admin_document");
              fd2.append("documentType", formData.selectedDocumentType);
              fd2.append("userId", createdUser._id);
              await apiClient.post("/api/upload", fd2, {
                headers: { "Content-Type": "multipart/form-data" },
              });
            }
          } catch (uploadErr) {
            console.error("Post-create upload failed:", uploadErr);
            toast.error(
              "Profile/document upload failed. You can upload from edit later.",
            );
          }
        }

        setShowModal(false);
        loadAdmins();
        loadBranches(); // Reload to update available branches
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
              "Update Administrator"
            ) : (
              "Create Administrator"
            )}
          </Button>
        )}
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
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
          />
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
        title={editingAdmin ? "Edit Administrator" : "Add New Administrator"}
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
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                  placeholder="+92 300 1234567"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Date of Birth <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={formData.dateOfBirth}
                    onChange={(e) =>
                      setFormData({ ...formData, dateOfBirth: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    CNIC / ID Card
                  </label>
                  <input
                    type="text"
                    value={formData.cnic}
                    onChange={(e) =>
                      setFormData({ ...formData, cnic: e.target.value })
                    }
                    placeholder="42101-XXXXXXX-X"
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Password <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) =>
                      setFormData({ ...formData, password: e.target.value })
                    }
                    placeholder="Minimum 6 characters"
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    New Password (Optional)
                  </label>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) =>
                      setFormData({ ...formData, password: e.target.value })
                    }
                    placeholder="Leave empty to keep current password"
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
            <div className="space-y-4 pt-4 border-t border-gray-200 dark:border-gray-700">
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
            {/* Account Status & Permissions Section */}
            <div className="space-y-3 pt-4 border-t border-gray-200 dark:border-gray-700">
              {/* Profile Photo Upload */}
              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                  Profile Photo
                </h4>
                {editingAdmin && editingAdmin.profilePhoto?.url ? (
                  <div className="flex items-center gap-3">
                    <img
                      src={editingAdmin.profilePhoto.url}
                      alt="profile"
                      className="w-20 h-20 rounded-full object-cover"
                    />
                    <div>
                      <p className="text-sm">Current photo</p>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() =>
                          window.open(editingAdmin.profilePhoto.url, "_blank")
                        }
                      >
                        View
                      </Button>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-gray-500">
                    No profile photo uploaded
                  </p>
                )}
                <div className="flex items-center gap-2">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={async (e) => {
                      const f = e.target.files[0];
                      if (!f) return;
                      if (!editingAdmin) {
                        setProfileFile(f);
                        toast.success(
                          "Profile photo queued - will upload after creating admin",
                        );
                        return;
                      }
                      try {
                        setProfileUploading(true);
                        const fd = new FormData();
                        fd.append("file", f);
                        fd.append("fileType", "profile");
                        fd.append("userId", editingAdmin.id);
                        await apiClient.post("/api/upload", fd, {
                          headers: { "Content-Type": "multipart/form-data" },
                        });
                        toast.success("Profile photo uploaded");
                        loadAdmins();
                      } catch (err) {
                        console.error("Profile upload failed:", err);
                        toast.error("Profile upload failed");
                      } finally {
                        setProfileUploading(false);
                      }
                    }}
                  />
                  {profileUploading && (
                    <span className="text-sm">Uploading...</span>
                  )}
                </div>
              </div>

              {/* Admin Documents Upload */}
              <div className="pt-3">
                <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">
                  Documents
                </h4>
                <p className="text-xs text-gray-500 mb-2">
                  Upload admin documents (CNIC, CV, ID card). Already uploaded
                  types are hidden.
                </p>
                <div className="flex items-center gap-2">
                  <DocumentTypeSelect
                    id="adminDocumentType"
                    name="adminDocumentType"
                    value={formData.selectedDocumentType || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        selectedDocumentType: e.target?.value ?? e,
                      })
                    }
                    options={ADMIN_DOC_TYPES.filter(
                      (t) => !uploadedAdminDocTypes.includes(t),
                    ).map((t) => ({ label: t.replace(/_/g, " "), value: t }))}
                    placeholder="Select document type"
                    className="w-56"
                  />

                  <input
                    type="file"
                    onChange={(e) => setDocFile(e.target.files[0] || null)}
                  />
                  <Button
                    onClick={async () => {
                      if (!formData.selectedDocumentType) {
                        toast.error("Select document type");
                        return;
                      }
                      if (!docFile) {
                        toast.error("Select a file");
                        return;
                      }
                      if (!editingAdmin) {
                        toast.error(
                          "Upload documents after creating the admin (they will be queued)",
                        );
                        return;
                      }
                      try {
                        setDocUploading(true);
                        const fd = new FormData();
                        fd.append("file", docFile);
                        fd.append("fileType", "admin_document");
                        fd.append(
                          "documentType",
                          formData.selectedDocumentType,
                        );
                        fd.append("userId", editingAdmin.id);
                        await apiClient.post("/api/upload", fd, {
                          headers: { "Content-Type": "multipart/form-data" },
                        });
                        toast.success("Document uploaded");
                        // mark as uploaded so dropdown hides it
                        setUploadedAdminDocTypes((s) => [
                          ...s,
                          formData.selectedDocumentType,
                        ]);
                        setDocFile(null);
                        setFormData({ ...formData, selectedDocumentType: "" });
                        loadAdmins();
                      } catch (err) {
                        console.error("Document upload failed:", err);
                        toast.error("Document upload failed");
                      } finally {
                        setDocUploading(false);
                      }
                    }}
                  >
                    Upload
                  </Button>
                </div>

                {uploadedAdminDocTypes.length > 0 && (
                  <div className="mt-3 text-xs text-gray-600">
                    <strong>Uploaded:</strong>{" "}
                    {uploadedAdminDocTypes.join(", ")}
                  </div>
                )}
              </div>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 uppercase tracking-wide">
                Account Status
              </h3>
              <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                <label className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) =>
                      setFormData({ ...formData, isActive: e.target.checked })
                    }
                    className="w-4 h-4 text-blue-600 border-gray-300 dark:border-gray-600 rounded focus:ring-blue-500"
                  />
                  <div>
                    <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      Active Account
                    </span>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Account will be immediately accessible
                    </p>
                  </div>
                </label>
              </div>

              {/* Permissions removed as per request - no permissions UI */}
            </div>
          </TabPanel>
        </div>
      </Modal>

      {/* View Modal - Readonly full administrator details */}
      <Modal
        open={showViewModal}
        onClose={() => {
          setShowViewModal(false);
          setViewingAdmin(null);
        }}
        title="Administrator Details"
        size="lg"
        footer={
          <div className="flex justify-end">
            <Button
              variant="outline"
              onClick={() => {
                setShowViewModal(false);
                setViewingAdmin(null);
              }}
            >
              Close
            </Button>
          </div>
        }
      >
        {viewingAdmin ? (
          <div className="space-y-6 max-h-[80vh] overflow-y-auto pr-2 custom-scrollbar">
            {/* Header Section with Profile Banner */}
            <div className="relative rounded-xl bg-gradient-to-r from-blue-600 to-indigo-700 p-6 text-white overflow-hidden shadow-lg mb-4">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl" />
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-blue-400/20 rounded-full -ml-12 -mb-12 blur-xl" />

              <div className="relative flex flex-col md:flex-row items-center gap-6">
                <div className="relative">
                  {viewingAdmin.avatar_url ? (
                    <img
                      src={viewingAdmin.avatar_url}
                      alt="profile"
                      className="w-24 h-24 rounded-2xl object-cover ring-4 ring-white/20 shadow-xl"
                    />
                  ) : (
                    <div className="w-24 h-24 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white ring-4 ring-white/10 shadow-xl">
                      <UserCog className="w-12 h-12" />
                    </div>
                  )}
                  <div
                    className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-2 border-white shadow-sm ${viewingAdmin.is_active ? "bg-green-500" : "bg-red-500"}`}
                  />
                </div>

                <div className="text-center md:text-left">
                  <h2 className="text-2xl font-bold tracking-tight">
                    {viewingAdmin.first_name} {viewingAdmin.last_name}
                  </h2>
                  <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 mt-2 text-blue-100">
                    <span className="bg-white/10 backdrop-blur-sm px-3 py-0.5 rounded-full text-xs font-medium border border-white/10">
                      Branch Administrator
                    </span>
                    <span className="flex items-center gap-1 text-xs text-sh-0">
                      <Building2 className="w-3.5 h-3.5" />
                      {viewingAdmin.branch?.name || "Global Head Office"}
                    </span>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-4 text-xs">
                    <div className="flex items-center gap-2 bg-black/10 px-3 py-2 rounded-lg">
                      <span className="text-blue-200">Reg:</span>
                      <span className="font-mono font-semibold">
                        {viewingAdmin.registration_no || "N/A"}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 bg-black/10 px-3 py-2 rounded-lg">
                      <span className="text-blue-200">Status:</span>
                      <span className="font-semibold uppercase tracking-wider">
                        {viewingAdmin.is_active ? "Active" : "Inactive"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Contact Card */}
              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-5 shadow-sm hover:shadow-md transition-shadow">
                <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
                  <Mail className="w-4 h-4 text-blue-500" />
                  Contact Details
                </h3>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center shrink-0">
                      <Mail className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-500 uppercase font-medium">
                        Primary Email
                      </p>
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100 break-all">
                        {viewingAdmin.email}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 w-8 h-8 rounded-lg bg-green-50 dark:bg-green-900/30 flex items-center justify-center shrink-0">
                      <Phone className="w-4 h-4 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-500 uppercase font-medium">
                        Phone Number
                      </p>
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {viewingAdmin.phone || "—"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Personal Card */}
              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-5 shadow-sm hover:shadow-md transition-shadow">
                <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
                  <UserCog className="w-4 h-4 text-indigo-500" />
                  Personal Info
                </h3>
                <div className="grid grid-cols-1 gap-y-3">
                  <div className="flex justify-between items-center bg-gray-50 dark:bg-gray-700/30 p-2 rounded-lg">
                    <span className="text-xs text-gray-500">Date of Birth</span>
                    <span className="text-sm font-medium dark:text-gray-100">
                      {viewingAdmin.details?.date_of_birth
                        ? new Date(
                            viewingAdmin.details.date_of_birth,
                          ).toLocaleDateString()
                        : "—"}
                    </span>
                  </div>
                  <div className="flex justify-between items-center bg-gray-50 dark:bg-gray-700/30 p-2 rounded-lg">
                    <span className="text-xs text-gray-500">Gender</span>
                    <span className="text-sm font-medium dark:text-gray-100">
                      {viewingAdmin.details?.gender || "—"}
                    </span>
                  </div>
                  <div className="flex justify-between items-center bg-gray-50 dark:bg-gray-700/30 p-2 rounded-lg">
                    <span className="text-xs text-gray-500 text-red-500 font-bold">
                      Blood Group
                    </span>
                    <span className="text-sm font-bold text-red-600">
                      {viewingAdmin.details?.blood_group || "—"}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
              {/* Address Card */}
              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-5 shadow-sm hover:shadow-md transition-shadow">
                <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-red-500" />
                  Address Details
                </h3>
                <div className="flex gap-4">
                  <div className="w-10 h-10 rounded-full bg-red-50 dark:bg-red-900/20 flex items-center justify-center shrink-0">
                    <MapPin className="w-5 h-5 text-red-600 dark:text-red-400" />
                  </div>
                  <div className="text-sm text-gray-700 dark:text-gray-300 space-y-1">
                    <p className="font-semibold text-gray-900 dark:text-white">
                      {viewingAdmin.details?.address?.street ||
                        "No street address"}
                    </p>
                    <p>
                      {viewingAdmin.details?.address?.city || "—"}
                      {viewingAdmin.details?.address?.state
                        ? `, ${viewingAdmin.details.address.state}`
                        : ""}
                    </p>
                    <p className="text-xs font-mono text-gray-400">
                      {viewingAdmin.details?.address?.postalCode || ""}
                    </p>
                  </div>
                </div>
              </div>

              {/* Identity Card */}
              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-5 shadow-sm hover:shadow-md transition-shadow">
                <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  Identity & Registration
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-500">CNIC / ID</span>
                    <span className="font-medium dark:text-gray-200">
                      {viewingAdmin.details?.cnic || "—"}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-500">Religion</span>
                    <span className="font-medium dark:text-gray-200">
                      {viewingAdmin.details?.religion || "—"}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-500">Nationality</span>
                    <span className="font-medium dark:text-gray-200">
                      {viewingAdmin.details?.nationality || "Pakistani"}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Documents Section */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-5 shadow-sm mt-6 mb-4">
              <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
                <Eye className="w-4 h-4 text-purple-500" />
                Verification Documents
              </h3>
              {(viewingAdmin.documents || []).length === 0 ? (
                <div className="flex flex-col items-center justify-center py-6 bg-gray-50 dark:bg-gray-900/30 rounded-lg border border-dashed border-gray-200">
                  <Eye className="w-8 h-8 text-gray-300 mb-2" />
                  <p className="text-xs text-gray-500 font-medium">
                    No documents uploaded for this profile
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {viewingAdmin.documents.map((doc, idx) => (
                    <div
                      key={doc.id || idx}
                      className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-900/50 border border-gray-100 dark:border-gray-700 group hover:border-blue-200 dark:hover:border-blue-900 transition-all hover:shadow-sm"
                    >
                      <div className="flex items-center gap-3 overflow-hidden">
                        <div className="w-10 h-10 rounded-lg bg-white dark:bg-gray-800 flex items-center justify-center shadow-sm shrink-0">
                          <Eye className="w-5 h-5 text-gray-400 group-hover:text-blue-500 transition-colors" />
                        </div>
                        <div className="overflow-hidden">
                          <p className="text-xs font-bold text-gray-900 dark:text-white truncate uppercase tracking-tighter">
                            {doc.type?.replace("_", " ") || "DOCUMENT"}
                          </p>
                          <p className="text-[10px] text-gray-500 truncate">
                            {doc.filename || "Original.pdf"}
                          </p>
                        </div>
                      </div>
                      {doc.url && (
                        <a
                          href={doc.url}
                          target="_blank"
                          rel="noreferrer"
                          className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-full transition-colors flex items-center justify-center shrink-0"
                          title="View Document"
                        >
                          <Eye className="w-4 h-4" />
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="h-60 flex flex-col items-center justify-center text-gray-500 space-y-3">
            <div className="w-12 h-12 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin" />
            <p className="text-sm font-medium animate-pulse text-blue-600">
              Retrieving personnel file...
            </p>
          </div>
        )}
      </Modal>
    </div>
  );
}
