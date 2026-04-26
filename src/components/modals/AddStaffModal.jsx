"use client";

import { useState , useEffect} from 'react';
import Modal from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import apiClient from '@/lib/api-client';
import { API_ENDPOINTS } from '@/constants/api-endpoints';
import GenderSelect from '@/components/ui/gender-select';
import BloodGroupSelect from '@/components/ui/blood-group';
import BranchSelect from '@/components/ui/branch-select';
import ButtonLoader from '@/components/ui/button-loader';
import Dropdown from '@/components/ui/dropdown';
import { toast } from 'sonner';

const STAFF_TYPE_OPTIONS = [
  // Administrative Staff
  { label: 'Administrative Officer', value: 'Administrative Officer' },
  { label: 'Office Superintendent', value: 'Office Superintendent' },
  { label: 'Clerk', value: 'Clerk' },
  { label: 'Accountant', value: 'Accountant' },
  { label: 'Cashier', value: 'Cashier' },
  { label: 'Data Entry Operator', value: 'Data Entry Operator' },
  { label: 'Receptionist', value: 'Receptionist' },
  { label: 'Office Assistant', value: 'Office Assistant' },
  // Academic Support Staff
  { label: 'Librarian', value: 'Librarian' },
  { label: 'Assistant Librarian', value: 'Assistant Librarian' },
  { label: 'Lab Assistant', value: 'Lab Assistant' },
  { label: 'Lab Attendant', value: 'Lab Attendant' },
  { label: 'Computer Lab Assistant', value: 'Computer Lab Assistant' },
  { label: 'Science Lab Assistant', value: 'Science Lab Assistant' },
  // Support Staff
  { label: 'Peon', value: 'Peon' },
  { label: 'Security Guard', value: 'Security Guard' },
  { label: 'Gate Keeper', value: 'Gate Keeper' },
  { label: 'Sweeper', value: 'Sweeper' },
  { label: 'Cleaner', value: 'Cleaner' },
  { label: 'Gardener', value: 'Gardener' },
  { label: 'Mali', value: 'Mali' },
  // Health & Medical Staff
  { label: 'Coaching Nurse', value: 'Coaching Nurse' },
  { label: 'Doctor', value: 'Doctor' },
  { label: 'First Aid Assistant', value: 'First Aid Assistant' },
  // Transportation Staff
  { label: 'Driver', value: 'Driver' },
  { label: 'Transport Supervisor', value: 'Transport Supervisor' },
  { label: 'Transport Manager', value: 'Transport Manager' },
  // Kitchen & Canteen Staff
  { label: 'Cook', value: 'Cook' },
  { label: 'Helper', value: 'Helper' },
  { label: 'Canteen Manager', value: 'Canteen Manager' },
  // Hostel Staff
  { label: 'Hostel Warden', value: 'Hostel Warden' },
  { label: 'Assistant Hostel Warden', value: 'Assistant Hostel Warden' },
  { label: 'Hostel Supervisor', value: 'Hostel Supervisor' },
  // Maintenance Staff
  { label: 'Electrician', value: 'Electrician' },
  { label: 'Plumber', value: 'Plumber' },
  { label: 'Carpenter', value: 'Carpenter' },
  { label: 'Painter', value: 'Painter' },
  // Other
  { label: 'Store Keeper', value: 'Store Keeper' },
  { label: 'Inventory Manager', value: 'Inventory Manager' },
  { label: 'Sports Equipment Manager', value: 'Sports Equipment Manager' },
  { label: 'Event Coordinator', value: 'Event Coordinator' },
  { label: 'Other', value: 'Other' },
];

const SHIFT_OPTIONS = [
  { label: 'Morning', value: 'Morning' },
  { label: 'Evening', value: 'Evening' },
  { label: 'Night', value: 'Night' },
  { label: 'Rotating', value: 'Rotating' },
];

const LICENSE_TYPE_OPTIONS = [
  { label: 'LTV (Light Transport Vehicle)', value: 'LTV' },
  { label: 'HTV (Heavy Transport Vehicle)', value: 'HTV' },
  { label: 'Motorcycle', value: 'Motorcycle' },
  { label: 'Other', value: 'Other' },
];

export default function AddStaffModal({ open, onClose, onSuccess, branches, role, staffMember = null }) {
  const [loading, setLoading] = useState(false);
  const [profilePhotoFile, setProfilePhotoFile] = useState(null);
  const [profilePhotoPreview, setProfilePhotoPreview] = useState(staffMember?.avatar_url || staffMember?.profilePhoto?.url || null);
  const [documentFiles, setDocumentFiles] = useState([]);
  const [formData, setFormData] = useState({
    firstName: staffMember?.first_name || staffMember?.firstName || '',
    lastName: staffMember?.last_name || staffMember?.lastName || '',
    email: staffMember?.email || '',
    phone: staffMember?.phone || '',
    alternatePhone: staffMember?.details?.alternate_phone || staffMember?.alternatePhone || '',
    dateOfBirth: (staffMember?.details?.date_of_birth || staffMember?.dateOfBirth) ? new Date(staffMember?.details?.date_of_birth || staffMember.dateOfBirth).toISOString().split('T')[0] : '',
    gender: staffMember?.details?.gender || staffMember?.gender || '',
    cnic: staffMember?.details?.cnic || staffMember?.cnic || '',
    bloodGroup: staffMember?.details?.blood_group || staffMember?.bloodGroup || '',
    branchId: staffMember?.branch_id || staffMember?.branchId?._id || staffMember?.branchId || '',
    joiningDate: (staffMember?.details?.joining_date || staffMember?.staffProfile?.joiningDate) ? new Date(staffMember?.details?.joining_date || staffMember.staffProfile.joiningDate).toISOString().split('T')[0] : '',
    staffType: staffMember?.staff_sub_type || staffMember?.staffProfile?.staffType || '',
    designation: staffMember?.details?.designation || staffMember?.staffProfile?.designation || '',
    registrationNo: staffMember?.registration_no || staffMember?.registrationNo || '',
    address: {
      street: staffMember?.details?.address?.street || staffMember?.address?.street || '',
      city: staffMember?.details?.address?.city || staffMember?.address?.city || '',
      state: staffMember?.details?.address?.state || staffMember?.address?.state || '',
      country: staffMember?.details?.address?.country || staffMember?.address?.country || 'Pakistan'
    },
    workingHours: {
      startTime: staffMember?.details?.working_hours?.startTime || staffMember?.staffProfile?.workingHours?.startTime || '',
      endTime: staffMember?.details?.working_hours?.endTime || staffMember?.staffProfile?.workingHours?.endTime || '',
      breakDuration: staffMember?.details?.working_hours?.breakDuration || staffMember?.staffProfile?.workingHours?.breakDuration || 60,
      workingDays: staffMember?.details?.working_hours?.workingDays || staffMember?.staffProfile?.workingHours?.workingDays || []
    },
    specializedInfo: {
      driverLicense: {
        number: staffMember?.details?.specialized_info?.driverLicense?.number || staffMember?.staffProfile?.specializedInfo?.driverLicense?.number || '',
        type: staffMember?.details?.specialized_info?.driverLicense?.type || staffMember?.staffProfile?.specializedInfo?.driverLicense?.type || '',
        expiryDate: (staffMember?.details?.specialized_info?.driverLicense?.expiryDate || staffMember?.staffProfile?.specializedInfo?.driverLicense?.expiryDate) ? new Date(staffMember?.details?.specialized_info?.driverLicense?.expiryDate || staffMember.staffProfile.specializedInfo.driverLicense.expiryDate).toISOString().split('T')[0] : ''
      },
      securityBadgeNumber: staffMember?.details?.specialized_info?.securityBadgeNumber || staffMember?.staffProfile?.specializedInfo?.securityBadgeNumber || '',
      medicalQualification: staffMember?.details?.specialized_info?.medicalQualification || staffMember?.staffProfile?.specializedInfo?.medicalQualification || '',
      tradeCertificate: staffMember?.details?.specialized_info?.tradeCertificate || staffMember?.staffProfile?.specializedInfo?.tradeCertificate || '',
      foodHandlingCertificate: staffMember?.details?.specialized_info?.foodHandlingCertificate || staffMember?.staffProfile?.specializedInfo?.foodHandlingCertificate || ''
    }
  });

  // Initialize with existing documents for edit mode
  useEffect(() => {
    const existingDocs = staffMember?.documents || staffMember?.details?.documents;
    if (existingDocs && Array.isArray(existingDocs)) {
      setDocumentFiles(existingDocs.map(doc => ({
        type: doc.type,
        name: doc.name,
        preview: doc.url,
        isExisting: true,
        url: doc.url,
        publicId: doc.publicId
      })));
    }
  }, [staffMember]);

  // Handle profile photo selection (no upload yet)
  const handleProfilePhotoChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size must be less than 5MB');
      return;
    }

    // Store file and create preview
    setProfilePhotoFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setProfilePhotoPreview(reader.result);
    };
    reader.readAsDataURL(file);
    toast.success('Profile photo selected');
  };

  // Handle document selection (no upload yet)
  const handleDocumentSelect = (e, docType) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('File size must be less than 10MB');
      return;
    }

    // Check if document type already exists
    const existingIndex = documentFiles.findIndex(doc => doc.type === docType);
    
    if (existingIndex !== -1) {
      // Replace existing document of same type
      const newDocs = [...documentFiles];
      newDocs[existingIndex] = { file, type: docType, name: file.name };
      setDocumentFiles(newDocs);
      toast.success(`${docType} replaced`);
    } else {
      // Add new document
      setDocumentFiles(prev => [...prev, { file, type: docType, name: file.name }]);
      toast.success(`${docType} selected`);
    }
    
    e.target.value = ''; // Reset input
  };

  // Remove document
  const handleRemoveDocument = (index) => {
    setDocumentFiles(prev => prev.filter((_, i) => i !== index));
    toast.success('Document removed');
  };

  const handleChange = (e) => {
    const { name, value, type: inputType, checked } = e.target;
    
    // Handle checkbox for working days
    if (name === 'workingDays') {
      const currentDays = formData.workingHours.workingDays || [];
      const newDays = checked 
        ? [...currentDays, value]
        : currentDays.filter(day => day !== value);
      
      setFormData(prev => ({
        ...prev,
        workingHours: {
          ...prev.workingHours,
          workingDays: newDays
        }
      }));
      return;
    }
    
    if (name.includes('.')) {
      const parts = name.split('.');
      if (parts.length === 2) {
        const [parent, child] = parts;
        setFormData(prev => ({
          ...prev,
          [parent]: {
            ...prev[parent],
            [child]: value
          }
        }));
      } else if (parts.length === 3) {
        const [parent, child, grandchild] = parts;
        setFormData(prev => ({
          ...prev,
          [parent]: {
            ...prev[parent],
            [child]: {
              ...prev[parent][child],
              [grandchild]: value
            }
          }
        }));
      }
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate required fields
    if (!formData.firstName || !formData.email || !formData.staffType) {
      toast.error('First name, email and staff type are required');
      return;
    }

    const isSuperAdmin = role?.toUpperCase() === 'SUPER_ADMIN';

    // Super admin must select branch
    if (isSuperAdmin && !formData.branchId) {
      toast.error('Please select a branch');
      return;
    }

    try {
      setLoading(true);
      const isEditMode = !!staffMember;

      // Prepare a single FormData for everything
      const finalFormData = new FormData();
      
      // 1. Add Profile Photo
      if (profilePhotoFile) {
        finalFormData.append('profilePhoto', profilePhotoFile);
      }
      
      // 2. Add Documents & Metadata
      const docMetadata = [];
      documentFiles.forEach((doc) => {
        if (doc.file) {
          finalFormData.append('documents', doc.file);
          docMetadata.push({
            type: doc.type,
            name: doc.name,
            isExisting: false
          });
        } else if (doc.isExisting) {
          docMetadata.push({
            type: doc.type,
            name: doc.name,
            url: doc.url,
            publicId: doc.publicId,
            isExisting: true
          });
        }
      });
      finalFormData.append('documentMetadata', JSON.stringify(docMetadata));
      
      // 3. Add JSON data (excluding base64 previews)
      const submitData = { ...formData };
      finalFormData.append('data', JSON.stringify(submitData));

      // 4. Determine Endpoint
      const isSuperAdmin = role?.toUpperCase() === 'SUPER_ADMIN';
      const endpoint = isEditMode
        ? (isSuperAdmin 
            ? API_ENDPOINTS.SUPER_ADMIN.STAFF.UPDATE.replace(':id', staffMember.id)
            : API_ENDPOINTS.BRANCH_ADMIN.STAFF.UPDATE.replace(':id', staffMember.id))
        : (isSuperAdmin 
            ? API_ENDPOINTS.SUPER_ADMIN.STAFF.CREATE
            : API_ENDPOINTS.BRANCH_ADMIN.STAFF.CREATE);

      console.log('Integrated Submission Started...');

      const response = isEditMode
        ? await apiClient.put(endpoint, finalFormData, { headers: { 'Content-Type': 'multipart/form-data' } })
        : await apiClient.post(endpoint, finalFormData, { headers: { 'Content-Type': 'multipart/form-data' } });
      
      if (response.success) {
        toast.success(isEditMode ? 'Staff updated successfully' : 'Staff added successfully');
        onSuccess();
        onClose();
      }
    } catch (error) {
      console.error('Staff operation error:', error);
      toast.error(error.message || `Failed to ${staffMember ? 'update' : 'add'} staff`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={staffMember ? "Edit Staff Member" : "Add New Staff"}
      size="xl"
      footer={
        <div className="flex justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={loading}
            className="flex items-center gap-2"
          >
            {loading ? (
              <>
                <ButtonLoader size={4} />
                {staffMember ? 'Updating...' : 'Adding...'}
              </>
            ) : (
              staffMember ? 'Update Staff' : 'Add Staff'
            )}
          </Button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Profile Photo Upload */}
        <div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Profile Photo</h3>
          <div className="flex items-center gap-4">
            {profilePhotoPreview ? (
              <div className="relative">
                <img
                  src={profilePhotoPreview}
                  alt="Profile Preview"
                  className="w-24 h-24 rounded-full object-cover border-2 border-gray-200 dark:border-gray-600"
                />
                <button
                  type="button"
                  onClick={() => {
                    setProfilePhotoFile(null);
                    setProfilePhotoPreview(null);
                  }}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600"
                >
                  ×
                </button>
              </div>
            ) : (
              <div className="w-24 h-24 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                <span className="text-gray-400 text-sm">No Photo</span>
              </div>
            )}
            <div>
              <label className="cursor-pointer">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleProfilePhotoChange}
                  className="hidden"
                />
                <span className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-700">
                  {profilePhotoFile ? 'Change Photo' : 'Upload Photo'}
                </span>
              </label>
              <p className="text-xs text-gray-500 mt-1">Max 5MB (JPG, PNG)</p>
            </div>
          </div>
        </div>

        {/* Basic Information */}
        <div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Basic Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                First Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Last Name (Optional)
              </label>
              <input
                type="text"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Email <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                disabled={!!staffMember}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 disabled:bg-gray-100 dark:disabled:bg-gray-800"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Phone (Optional)
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="+92 300 1234567"
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Alternate Phone
              </label>
              <input
                type="tel"
                name="alternatePhone"
                value={formData.alternatePhone}
                onChange={handleChange}
                placeholder="+92 300 1234567"
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Date of Birth
              </label>
              <input
                type="date"
                name="dateOfBirth"
                value={formData.dateOfBirth}
                onChange={handleChange}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Gender
              </label>
              <GenderSelect
                name="gender"
                value={formData.gender}
                onChange={handleChange}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                CNIC
              </label>
              <input
                type="text"
                name="cnic"
                value={formData.cnic}
                onChange={handleChange}
                placeholder="XXXXX-XXXXXXX-X"
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600"
              />
            </div>



            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Religion
              </label>
              <input
                type="text"
                name="religion"
                value={formData.religion}
                onChange={handleChange}
                placeholder="Islam, Christianity, etc."
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Nationality
              </label>
              <input
                type="text"
                name="nationality"
                value={formData.nationality}
                onChange={handleChange}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600"
              />
            </div>
          </div>
        </div>

        {/* Employment Information */}
        <div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Employment Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {(role === 'super_admin' || role === 'SUPER_ADMIN') && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Branch <span className="text-red-500">*</span>
                </label>
                <BranchSelect
                  name="branchId"
                  value={formData.branchId}
                  onChange={handleChange}
                  branches={branches}
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Staff Type <span className="text-red-500">*</span>
              </label>
              <Dropdown
                id="staffType"
                name="staffType"
                value={formData.staffType}
                onChange={handleChange}
                options={STAFF_TYPE_OPTIONS}
                placeholder="Select Staff Type"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Registration No (Staff ID)
              </label>
              <input
                type="text"
                name="registrationNo"
                value={formData.registrationNo}
                onChange={handleChange}
                placeholder="Leave blank for auto-generation"
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600"
              />
              <p className="text-xs text-gray-500 mt-1">If blank, system will auto-generate based on branch & position.</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Designation
              </label>
              <input
                type="text"
                name="designation"
                value={formData.designation}
                onChange={handleChange}
                placeholder="e.g., Senior Clerk, Head Security, etc."
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600"
              />
            </div>



            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Joining Date
              </label>
              <input
                type="date"
                name="joiningDate"
                value={formData.joiningDate}
                onChange={handleChange}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600"
              />
            </div>
          </div>
        </div>



        {/* Address */}
        <div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Address</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Street
              </label>
              <input
                type="text"
                name="address.street"
                value={formData.address.street}
                onChange={handleChange}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                City
              </label>
              <input
                type="text"
                name="address.city"
                value={formData.address.city}
                onChange={handleChange}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                State/Province
              </label>
              <input
                type="text"
                name="address.state"
                value={formData.address.state}
                onChange={handleChange}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600"
              />
            </div>


          </div>
        </div>



        {/* Working Hours */}
        <div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Working Hours</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Start Time
              </label>
              <input
                type="time"
                name="workingHours.startTime"
                value={formData.workingHours.startTime}
                onChange={handleChange}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                End Time
              </label>
              <input
                type="time"
                name="workingHours.endTime"
                value={formData.workingHours.endTime}
                onChange={handleChange}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Break Duration (minutes)
              </label>
              <input
                type="number"
                name="workingHours.breakDuration"
                value={formData.workingHours.breakDuration}
                onChange={handleChange}
                placeholder="60"
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Working Days
              </label>
              <div className="flex flex-wrap gap-2 mt-2">
                {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(day => (
                  <label key={day} className="flex items-center gap-1">
                    <input
                      type="checkbox"
                      name="workingDays"
                      value={day}
                      checked={formData.workingHours.workingDays.includes(day)}
                      onChange={handleChange}
                      className="rounded"
                    />
                    <span className="text-sm">{day.substring(0, 3)}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </div>



        {/* Specialized Information - Conditional based on staff type */}
        {(formData.staffType === 'Driver' || formData.staffType === 'Transporter') && (
          <div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Driver Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  License Number
                </label>
                <input
                  type="text"
                  name="specializedInfo.driverLicense.number"
                  value={formData.specializedInfo.driverLicense.number}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  License Type
                </label>
                <Dropdown
                  id="licenseType"
                  name="specializedInfo.driverLicense.type"
                  value={formData.specializedInfo.driverLicense.type}
                  onChange={handleChange}
                  options={LICENSE_TYPE_OPTIONS}
                  placeholder="Select License Type"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  License Expiry Date
                </label>
                <input
                  type="date"
                  name="specializedInfo.driverLicense.expiryDate"
                  value={formData.specializedInfo.driverLicense.expiryDate}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600"
                />
              </div>
            </div>
          </div>
        )}

        {formData.staffType === 'Security Guard' && (
          <div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Security Information</h3>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Security Badge Number
              </label>
              <input
                type="text"
                name="specializedInfo.securityBadgeNumber"
                value={formData.specializedInfo.securityBadgeNumber}
                onChange={handleChange}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600"
              />
            </div>
          </div>
        )}

        {(formData.staffType === 'Doctor' || formData.staffType === 'Nurse') && (
          <div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Medical Information</h3>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Medical Qualification
              </label>
              <input
                type="text"
                name="specializedInfo.medicalQualification"
                value={formData.specializedInfo.medicalQualification}
                onChange={handleChange}
                placeholder="MBBS, BDS, RN, etc."
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600"
              />
            </div>
          </div>
        )}

        {/* Documents Upload */}
        <div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Documents</h3>
          <div className="space-y-4">
            {/* Document Upload Buttons */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {['cnic', 'cv', 'certificate', 'driver_license', 'medical_certificate', 'police_verification', 'contract', 'other'].map(docType => {
                const isAdded = documentFiles.some(doc => doc.type === docType);
                return (
                  <label key={docType} className="cursor-pointer">
                    <input
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={(e) => handleDocumentSelect(e, docType)}
                      className="hidden"
                    />
                    <div className={`px-4 py-2 border-2 border-dashed rounded-lg text-center transition-colors ${
                      isAdded 
                        ? 'border-green-500 bg-green-50 dark:bg-green-900/20' 
                        : 'border-gray-300 hover:border-blue-500 hover:bg-blue-50 dark:border-gray-600 dark:hover:border-blue-400 dark:hover:bg-blue-900/20'
                    }`}>
                      <span className="text-sm font-medium capitalize">
                        {docType.replace('_', ' ')} {isAdded && '✓'}
                      </span>
                    </div>
                  </label>
                );
              })}
            </div>

            {/* Uploaded Documents List */}
            {documentFiles.length > 0 && (
              <div className="mt-4 space-y-2">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Selected Documents ({documentFiles.length})
                </p>
                <div className="space-y-2">
                  {documentFiles.map((doc, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded flex items-center justify-center">
                          <span className="text-blue-600 dark:text-blue-300 text-xs font-semibold">
                            {doc.type.substring(0, 3).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {doc.name}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                            {doc.type.replace('_', ' ')}
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveDocument(index)}
                        className="text-red-500 hover:text-red-700 font-medium text-sm"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <p className="text-xs text-gray-500 dark:text-gray-400">
              Supported formats: PDF, JPG, PNG (Max 10MB per file). Click same type to replace document.
            </p>
          </div>
        </div>
      </form>
    </Modal>
  );
}
