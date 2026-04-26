'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Plus, X, User, Upload, Mail, Phone, Calendar, MapPin, FileText, BookOpen, GraduationCap, Award, DollarSign, Briefcase } from 'lucide-react';
import { toast } from 'sonner';
import apiClient from '@/lib/api-client';
import { API_ENDPOINTS } from '@/constants/api-endpoints';
import Input from '@/components/ui/input';
import Dropdown from '@/components/ui/dropdown';
import BranchSelect from '@/components/ui/branch-select';
import GenderSelect from '@/components/ui/gender-select';
import BloodGroupSelect from '@/components/ui/blood-group';
import DepartmentSelect from '@/components/ui/department-select';
import ClassSelect from '@/components/ui/class-select';
import DocumentTypeSelect from '@/components/ui/document-type-select';
import ButtonLoader from '@/components/ui/button-loader';

export default function TeacherForm({
  userRole = 'super_admin',
  currentBranchId = null,
  editingTeacher = null,
  branches = [],
  departments = [],
  classes = [],
  subjects = [],
  onSuccess,
  onClose
}) {
  const formRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [activeTab, setActiveTab] = useState('personal');
  const [selectedDocType, setSelectedDocType] = useState('');
    // New qualification state
  const [newQualification, setNewQualification] = useState({
    degree: '',
    institution: '',
    yearOfCompletion: '',
    grade: '',
    major: ''
  });

  // New class assignment state (only class selection, no subject)
  const [newClassAssignment, setNewClassAssignment] = useState({
    classId: ''
  });

  // Initial form data
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    alternatePhone: '',
    dateOfBirth: '',
    gender: 'male',
    bloodGroup: '',
    nationality: 'Pakistani',
    cnic: '',
    religion: '',
    address: {
      street: '',
      city: '',
      state: '',
      country: 'Pakistan',
      postalCode: '',
    },
    branchId: userRole === 'branch_admin' ? currentBranchId : '',
    profilePhoto: {
      url: '',
      publicId: '',
    },
    teacherProfile: {
      joiningDate: new Date().toISOString().split('T')[0],
      designation: 'Teacher',
      departmentId: '',
      department: '',
      qualifications: [],
      experience: {
        totalYears: 0,
        previousInstitutions: [],
      },
      subjects: [],
      classes: [],
      salaryDetails: {
        basicSalary: 0,
        allowances: {
          houseRent: 0,
          medical: 0,
          transport: 0,
          other: 0,
        },
        deductions: {
          tax: 0,
          providentFund: 0,
          insurance: 0,
          other: 0,
        },
      },
      bankAccount: {
        bankName: '',
        accountNumber: '',
        iban: '',
        branchCode: '',
      },
      emergencyContact: {
        name: '',
        relationship: '',
        phone: '',
      },
      documents: [],
    },
    status: 'active',
    remarks: '',
  });

  // Initialize form with editing teacher data
  useEffect(() => {
    if (editingTeacher) {
      const details = editingTeacher.details?.teacher || editingTeacher.teacherProfile || {};
      setFormData({
        firstName: editingTeacher.first_name || editingTeacher.firstName || '',
        lastName: editingTeacher.last_name || editingTeacher.lastName || '',
        email: editingTeacher.email || '',
        phone: editingTeacher.phone || '',
        alternatePhone: editingTeacher.alternate_phone || editingTeacher.alternatePhone || '',
        dateOfBirth: (editingTeacher.details?.date_of_birth || editingTeacher.dateOfBirth) 
          ? new Date(editingTeacher.details?.date_of_birth || editingTeacher.dateOfBirth).toISOString().split('T')[0] 
          : '',
        gender: editingTeacher.details?.gender || editingTeacher.gender || 'male',
        bloodGroup: editingTeacher.details?.blood_group || editingTeacher.bloodGroup || '',
        nationality: editingTeacher.details?.nationality || editingTeacher.nationality || 'Pakistani',
        cnic: editingTeacher.details?.cnic || editingTeacher.cnic || '',
        religion: editingTeacher.details?.religion || editingTeacher.religion || '',
        address: editingTeacher.details?.address || editingTeacher.address || {
          street: '',
          city: '',
          state: '',
          country: 'Pakistan',
          postalCode: '',
        },
        branchId: editingTeacher.branch_id || editingTeacher.branchId?._id || (userRole === 'branch_admin' ? currentBranchId : ''),
        profilePhoto: {
          url: editingTeacher.avatar_url || editingTeacher.profilePhoto?.url || '',
          publicId: editingTeacher.details?.avatar_public_id || editingTeacher.profilePhoto?.publicId || ''
        },
        teacherProfile: {
          joiningDate: details.joiningDate || details.joining_date 
            ? new Date(details.joiningDate || details.joining_date).toISOString().split('T')[0] 
            : new Date().toISOString().split('T')[0],
          designation: details.designation || 'Teacher',
          departmentId: details.departmentId?._id || details.department_id || '',
          department: details.department || '',
          qualifications: details.qualifications || [],
          experience: details.experience || { 
            totalYears: 0, 
            previousInstitutions: [] 
          },
          subjects: details.subjects?.map(s => s.id || s._id || s) || [],
          classes: details.classes || [],
          salaryDetails: details.salaryDetails || details.salary_details || {
            basicSalary: 0,
            allowances: { houseRent: 0, medical: 0, transport: 0, other: 0 },
            deductions: { tax: 0, providentFund: 0, insurance: 0, other: 0 },
          },
          bankAccount: details.bankAccount || details.bank_account || {
            bankName: '',
            accountNumber: '',
            iban: '',
            branchCode: '',
          },
          emergencyContact: details.emergencyContact || details.emergency_contact || { 
            name: '', 
            relationship: '', 
            phone: '' 
          },
          documents: editingTeacher.documents || details.documents || [],
        },
        status: editingTeacher.is_active === false ? 'inactive' : 'active',
        remarks: editingTeacher.remarks || '',
      });
    }
  }, [editingTeacher, userRole, currentBranchId]);

  // Ensure class assignments belong to the selected branch; remove any assignments that don't
  useEffect(() => {
    const branchId = formData.branchId;
    if (!branchId) return;

    const normalizeId = (id) => (id && id._id) ? String(id._id) : String(id || '');

    const validClassIds = new Set(
      classes
        .filter(c => normalizeId(c.branchId) === String(branchId))
        .map(c => String(c._id))
    );

    const currentAssignments = formData.teacherProfile?.classes || [];

    const filtered = currentAssignments.filter(a => {
      const aid = normalizeId(a.classId);
      return validClassIds.has(String(aid));
    });

    if (filtered.length !== currentAssignments.length) {
      setFormData(prev => ({
        ...prev,
        teacherProfile: {
          ...prev.teacherProfile,
          classes: filtered,
        },
      }));
      toast.info('Removed class assignments that do not belong to the selected branch');
    }
  }, [formData.branchId, classes]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    const finalValue = type === 'checkbox' ? checked : value;

    if (name.includes('.')) {
      const path = name.split('.');
      setFormData(prev => {
        const newData = { ...prev };
        let current = newData;
        
        for (let i = 0; i < path.length - 1; i++) {
          if (!current[path[i]]) {
            current[path[i]] = {};
          }
          current = current[path[i]];
        }
        
        current[path[path.length - 1]] = finalValue;
        return newData;
      });
    } else {
      setFormData(prev => ({ ...prev, [name]: finalValue }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Required field validation
      if (!formData.firstName || !formData.lastName || !formData.email || !formData.phone || !formData.dateOfBirth) {
        toast.error('Please fill all required fields (Name, Email, Phone, Date of Birth)');
        setLoading(false);
        return;
      }

      if (userRole === 'super_admin' && !formData.branchId) {
        toast.error('Please select a branch');
        setLoading(false);
        return;
      }

      // Prepare payload
      const payload = {
        ...formData,
        teacherProfile: {
          ...formData.teacherProfile,
          departmentId: formData.teacherProfile.departmentId || undefined,
        },
      };

      let response;
      if (editingTeacher) {
        response = await apiClient.put(
          `${API_ENDPOINTS[userRole.toUpperCase()]?.TEACHERS?.UPDATE.replace(':id', editingTeacher.id || editingTeacher._id)}`,
          payload
        );
      } else {
        response = await apiClient.post(
          API_ENDPOINTS[userRole.toUpperCase()]?.TEACHERS?.CREATE,
          payload
        );
      }

      if (response?.success) {
        toast.success(editingTeacher ? 'Teacher updated successfully' : 'Teacher created successfully');
        onSuccess?.();
        onClose?.();
      } else {
        toast.error(response?.message || 'Operation failed');
      }
    } catch (error) {
      toast.error(error.message || 'Failed to save teacher');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // File upload handlers
  const handleProfilePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size should be less than 5MB');
      return;
    }

    setUploading(true);
    const formDataUpload = new FormData();
    formDataUpload.append('file', file);
    formDataUpload.append('fileType', 'profile');
    formDataUpload.append('folder', 'teachers/profiles');

    if (editingTeacher) {
      formDataUpload.append('userId', editingTeacher._id);
    }

    try {
      const data = await apiClient.post(API_ENDPOINTS.COMMON.UPLOAD, formDataUpload, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (data.success) {
        const photoData = {
          url: data.url,
          publicId: data.publicId,
          uploadedAt: new Date(),
        };

        setFormData({
          ...formData,
          profilePhoto: photoData,
        });

        toast.success('Profile photo uploaded successfully');
      } else {
        toast.error(data.message || 'Upload failed');
      }
    } catch (error) {
      toast.error(error.message || 'Failed to upload image');
      console.error(error);
    } finally {
      setUploading(false);
    }
  };

  const handleDocumentUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!selectedDocType) {
      toast.error('Please select document type first');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error('Document size should be less than 10MB');
      return;
    }

    setUploading(true);
    const formDataUpload = new FormData();
    formDataUpload.append('file', file);
    formDataUpload.append('fileType', 'teacher_document');
    formDataUpload.append('documentType', selectedDocType);
    formDataUpload.append('folder', 'teachers/documents');

    if (editingTeacher) {
      formDataUpload.append('userId', editingTeacher._id);
    }

    try {
      const data = await apiClient.post(API_ENDPOINTS.COMMON.UPLOAD, formDataUpload, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (data.success) {
        const newDocument = {
          type: selectedDocType,
          name: file.name,
          url: data.url,
          publicId: data.publicId,
          uploadedAt: new Date(),
        };

        const updatedDocuments = [...(formData.teacherProfile.documents || []), newDocument];

        setFormData({
          ...formData,
          teacherProfile: {
            ...formData.teacherProfile,
            documents: updatedDocuments,
          },
        });

        setSelectedDocType('');
        toast.success('Document uploaded successfully');
      } else {
        toast.error(data.message || 'Upload failed');
      }
    } catch (error) {
      toast.error(error.message || 'Failed to upload document');
      console.error(error);
    } finally {
      setUploading(false);
    }
  };

  // Qualification methods
  const addQualification = () => {
    if (!newQualification.degree || !newQualification.institution) {
      toast.error('Please fill degree and institution');
      return;
    }
    setFormData({
      ...formData,
      teacherProfile: {
        ...formData.teacherProfile,
        qualifications: [...formData.teacherProfile.qualifications, newQualification],
      },
    });
    setNewQualification({ degree: '', institution: '', yearOfCompletion: '', grade: '', major: '' });
  };

  const removeQualification = (index) => {
    setFormData({
      ...formData,
      teacherProfile: {
        ...formData.teacherProfile,
        qualifications: formData.teacherProfile.qualifications.filter((_, i) => i !== index),
      },
    });
  };

  // Class assignment methods
  const handleClassSelection = (classId) => {
    setNewClassAssignment({ ...newClassAssignment, classId });
  };

  const addClassAssignment = () => {
    if (!newClassAssignment.classId) {
      toast.error('Please select a class');
      return;
    }

    const classObj = classes.find(c => String(c._id) === String(newClassAssignment.classId));

    const alreadyAssigned = (formData.teacherProfile.classes || []).some(a => String(a.classId?._id || a.classId || a) === String(newClassAssignment.classId));
    if (alreadyAssigned) {
      toast.error('Class already assigned to this teacher');
      return;
    }

    setFormData({
      ...formData,
      teacherProfile: {
        ...formData.teacherProfile,
        classes: [
          ...formData.teacherProfile.classes,
          {
            classId: newClassAssignment.classId,
            className: classObj?.name || ''
          }
        ],
      },
    });
    setNewClassAssignment({ classId: '' });
  };

  const removeClassAssignment = (index) => {
    setFormData({
      ...formData,
      teacherProfile: {
        ...formData.teacherProfile,
        classes: formData.teacherProfile.classes.filter((_, i) => i !== index),
      },
    });
  };

  // Return classes for selected branch and not already assigned
  const getAvailableClasses = () => {
    const branchId = formData.branchId;
    if (!branchId) return [];
    const normalizeId = (id) => (id && id._id) ? String(id._id) : String(id || '');
    const assigned = new Set((formData.teacherProfile.classes || []).map(a => normalizeId(a.classId)));
    return classes.filter(c => normalizeId(c.branchId) === String(branchId) && !assigned.has(String(c._id)));
  };

  // Document methods
  const removeDocument = (index) => {
    setFormData({
      ...formData,
      teacherProfile: {
        ...formData.teacherProfile,
        documents: formData.teacherProfile.documents.filter((_, i) => i !== index),
      },
    });
  };

  // Tabs
  const tabs = [
    { id: 'personal', label: 'Personal Info', icon: User },
    { id: 'professional', label: 'Professional', icon: Briefcase },
    { id: 'salary', label: 'Salary & Bank', icon: DollarSign },
    { id: 'documents', label: 'Documents', icon: FileText },
  ];

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="space-y-6">
      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors whitespace-nowrap ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <tab.icon className="h-5 w-5" />
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="max-h-[60vh] overflow-y-auto space-y-4 p-1">
        
        {/* Personal Info Tab */}
        {activeTab === 'personal' && (
          <div className="space-y-4">
            {/* Profile Photo */}
            <div className="border-b pb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Profile Photo</label>
              <div className="flex items-center gap-4">
                {formData.profilePhoto?.url ? (
                  <div className="relative">
                    <img
                      src={formData.profilePhoto.url}
                      alt="Profile"
                      className="h-24 w-24 rounded-full object-cover border-2 border-gray-200"
                    />
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, profilePhoto: { url: '', publicId: '' } })}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ) : (
                  <div className="h-24 w-24 rounded-full bg-gray-100 border-2 border-dashed border-gray-300 flex items-center justify-center">
                    <User className="h-12 w-12 text-gray-400" />
                  </div>
                )}
                <div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleProfilePhotoUpload}
                    className="hidden"
                    id="profilePhoto"
                    disabled={uploading}
                  />
                  <label
                    htmlFor="profilePhoto"
                    className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 border border-blue-200"
                  >
                    <Upload className="h-4 w-4" />
                    {uploading ? 'Uploading...' : (formData.profilePhoto?.url ? 'Change Photo' : 'Upload Photo')}
                  </label>
                  <p className="text-xs text-gray-500 mt-1">Max 5MB (JPG, PNG, GIF)</p>
                </div>
              </div>
            </div>

            {/* Basic Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  First Name <span className="text-red-500">*</span>
                </label>
                <Input
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleInputChange}
                  required
                  placeholder="John"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Last Name <span className="text-red-500">*</span>
                </label>
                <Input
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleInputChange}
                  required
                  placeholder="Doe"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email <span className="text-red-500">*</span>
                </label>
                <Input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  placeholder="john@example.com"
                  icon={Mail}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone <span className="text-red-500">*</span>
                </label>
                <Input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  required
                  placeholder="+92 300 1234567"
                  icon={Phone}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Alternate Phone</label>
                <Input
                  type="tel"
                  name="alternatePhone"
                  value={formData.alternatePhone}
                  onChange={handleInputChange}
                  placeholder="+92 300 1234568"
                  icon={Phone}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date of Birth <span className="text-red-500">*</span>
                </label>
                <Input
                  type="date"
                  name="dateOfBirth"
                  value={formData.dateOfBirth}
                  onChange={handleInputChange}
                  required
                  icon={Calendar}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
                <GenderSelect
                  name="gender"
                  value={formData.gender}
                  onChange={handleInputChange}
                  placeholder="Select Gender"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Blood Group</label>
                <BloodGroupSelect
                  name="bloodGroup"
                  value={formData.bloodGroup}
                  onChange={handleInputChange}
                  placeholder="Select Blood Group"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">CNIC</label>
                <Input
                  type="text"
                  name="cnic"
                  value={formData.cnic}
                  onChange={handleInputChange}
                  placeholder="42101-1234567-1"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Religion</label>
                <Input
                  type="text"
                  name="religion"
                  value={formData.religion}
                  onChange={handleInputChange}
                  placeholder="Islam"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nationality</label>
                <Input
                  type="text"
                  name="nationality"
                  value={formData.nationality}
                  onChange={handleInputChange}
                  placeholder="Pakistani"
                />
              </div>

              {userRole === 'super_admin' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Branch <span className="text-red-500">*</span>
                  </label>
                  <BranchSelect
                    name="branchId"
                    value={formData.branchId}
                    onChange={handleInputChange}
                    branches={branches}
                    placeholder="Select Branch"
                    required
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <Dropdown
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  options={[
                    { label: 'Active', value: 'active' },
                    { label: 'On Leave', value: 'on_leave' },
                    { label: 'Terminated', value: 'terminated' },
                    { label: 'Resigned', value: 'resigned' },
                  ]}
                />
              </div>
            </div>

            {/* Address Section */}
            <div className="border-t pt-4">
              <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Address Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Street Address</label>
                  <Input
                    type="text"
                    name="address.street"
                    value={formData.address.street}
                    onChange={handleInputChange}
                    placeholder="House #123, Street #456"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                  <Input
                    type="text"
                    name="address.city"
                    value={formData.address.city}
                    onChange={handleInputChange}
                    placeholder="Karachi"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">State/Province</label>
                  <Input
                    type="text"
                    name="address.state"
                    value={formData.address.state}
                    onChange={handleInputChange}
                    placeholder="Sindh"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Postal Code</label>
                  <Input
                    type="text"
                    name="address.postalCode"
                    value={formData.address.postalCode}
                    onChange={handleInputChange}
                    placeholder="75500"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Professional Tab */}
        {activeTab === 'professional' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Joining Date</label>
                <Input
                  type="date"
                  name="teacherProfile.joiningDate"
                  value={formData.teacherProfile.joiningDate}
                  onChange={handleInputChange}
                  icon={Calendar}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Designation</label>
                <Dropdown
                  name="teacherProfile.designation"
                  value={formData.teacherProfile.designation}
                  onChange={handleInputChange}
                  options={[
                    { label: 'Teacher', value: 'Teacher' },
                    { label: 'Senior Teacher', value: 'Senior Teacher' },
                    { label: 'Head Teacher', value: 'Head Teacher' },
                    { label: 'Principal', value: 'Principal' },
                    { label: 'Vice Principal', value: 'Vice Principal' },
                    { label: 'Subject Specialist', value: 'Subject Specialist' },
                  ]}
                />
              </div>

              {/* <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                <DepartmentSelect
                  name="teacherProfile.departmentId"
                  value={formData.teacherProfile.departmentId}
                  onChange={handleInputChange}
                  departments={departments}
                  placeholder="Select Department"
                />
              </div> */}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Experience (Years)</label>
                <Input
                  type="number"
                  name="teacherProfile.experience.totalYears"
                  value={formData.teacherProfile.experience.totalYears}
                  onChange={handleInputChange}
                  placeholder="5"
                  min="0"
                />
              </div>
            </div>

            {/* Qualifications */}
            <div className="border-t pt-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Qualifications</label>
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                  <input
                    type="text"
                    placeholder="Degree"
                    value={newQualification.degree}
                    onChange={(e) => setNewQualification({ ...newQualification, degree: e.target.value })}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
                  />
                  <input
                    type="text"
                    placeholder="Institution"
                    value={newQualification.institution}
                    onChange={(e) => setNewQualification({ ...newQualification, institution: e.target.value })}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
                  />
                  <input
                    type="text"
                    placeholder="Year"
                    value={newQualification.yearOfCompletion}
                    onChange={(e) => setNewQualification({ ...newQualification, yearOfCompletion: e.target.value })}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
                  />
                  <input
                    type="text"
                    placeholder="Grade/CGPA"
                    value={newQualification.grade}
                    onChange={(e) => setNewQualification({ ...newQualification, grade: e.target.value })}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
                  />
                  <button
                    type="button"
                    onClick={addQualification}
                    className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    <Plus className="h-4 w-4" />
                    Add
                  </button>
                </div>

                {formData.teacherProfile.qualifications.length > 0 && (
                  <div className="mt-3 space-y-2">
                    {formData.teacherProfile.qualifications.map((qual, index) => (
                      <div key={index} className="flex items-center justify-between bg-white p-3 rounded-lg border border-gray-200">
                        <div>
                          <div className="text-sm font-medium">{qual.degree} - {qual.institution}</div>
                          <div className="text-xs text-gray-500">{qual.yearOfCompletion} | Grade: {qual.grade}</div>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeQualification(index)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Emergency Contact */}
            <div className="border-t pt-4">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">Emergency Contact</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Contact Name</label>
                  <Input
                    type="text"
                    name="teacherProfile.emergencyContact.name"
                    value={formData.teacherProfile.emergencyContact.name}
                    onChange={handleInputChange}
                    placeholder="John Doe"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Relationship</label>
                  <Input
                    type="text"
                    name="teacherProfile.emergencyContact.relationship"
                    value={formData.teacherProfile.emergencyContact.relationship}
                    onChange={handleInputChange}
                    placeholder="Father/Brother"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                  <Input
                    type="tel"
                    name="teacherProfile.emergencyContact.phone"
                    value={formData.teacherProfile.emergencyContact.phone}
                    onChange={handleInputChange}
                    placeholder="+92 300 1234567"
                    icon={Phone}
                  />
                </div>
              </div>
            </div>
          </div>
        )}



        {/* Salary & Bank Tab */}
        {activeTab === 'salary' && (
          <div className="space-y-6">
            {/* Salary Information */}
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-3">Salary Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Basic Salary</label>
                  <Input
                    type="number"
                    name="teacherProfile.salaryDetails.basicSalary"
                    value={formData.teacherProfile.salaryDetails.basicSalary}
                    onChange={handleInputChange}
                    placeholder="50000"
                    min="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">House Rent Allowance</label>
                  <Input
                    type="number"
                    name="teacherProfile.salaryDetails.allowances.houseRent"
                    value={formData.teacherProfile.salaryDetails.allowances.houseRent}
                    onChange={handleInputChange}
                    placeholder="10000"
                    min="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Medical Allowance</label>
                  <Input
                    type="number"
                    name="teacherProfile.salaryDetails.allowances.medical"
                    value={formData.teacherProfile.salaryDetails.allowances.medical}
                    onChange={handleInputChange}
                    placeholder="5000"
                    min="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Transport Allowance</label>
                  <Input
                    type="number"
                    name="teacherProfile.salaryDetails.allowances.transport"
                    value={formData.teacherProfile.salaryDetails.allowances.transport}
                    onChange={handleInputChange}
                    placeholder="3000"
                    min="0"
                  />
                </div>
              </div>
            </div>

            {/* Bank Account Details */}
            <div className="border-t pt-4">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">Bank Account Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Bank Name</label>
                  <Input
                    type="text"
                    name="teacherProfile.bankAccount.bankName"
                    value={formData.teacherProfile.bankAccount.bankName}
                    onChange={handleInputChange}
                    placeholder="HBL, MCB, UBL"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Account Number</label>
                  <Input
                    type="text"
                    name="teacherProfile.bankAccount.accountNumber"
                    value={formData.teacherProfile.bankAccount.accountNumber}
                    onChange={handleInputChange}
                    placeholder="0123456789"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">IBAN</label>
                  <Input
                    type="text"
                    name="teacherProfile.bankAccount.iban"
                    value={formData.teacherProfile.bankAccount.iban}
                    onChange={handleInputChange}
                    placeholder="PK00ABCD1234567890123456"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Branch Code</label>
                  <Input
                    type="text"
                    name="teacherProfile.bankAccount.branchCode"
                    value={formData.teacherProfile.bankAccount.branchCode}
                    onChange={handleInputChange}
                    placeholder="1234"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Documents Tab */}
        {activeTab === 'documents' && (
          <div className="space-y-4">
            {/* Document Upload Section */}
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
              <div className="text-center">
                <FileText className="h-12 w-12 mx-auto text-gray-400 mb-2" />
                <p className="text-sm font-medium text-gray-900 mb-1">Upload Documents</p>
                <p className="text-xs text-gray-500 mb-4">CNIC, Degrees, Certificates, etc.</p>
                
                <div className="space-y-3 max-w-md mx-auto">
                  <DocumentTypeSelect
                    name="documentType"
                    value={selectedDocType}
                    onChange={(e) => setSelectedDocType(e.target.value)}
                    options={[
                      { label: 'CNIC', value: 'cnic' },
                      { label: 'Degree Certificate', value: 'degree' },
                      { label: 'CV / Resume', value: 'cv' },
                      { label: 'Experience Letter', value: 'experience_letter' },
                      { label: 'Teaching Certificate', value: 'certificate' },
                      { label: 'Other', value: 'other' },
                    ]}
                  />

                  <input
                    type="file"
                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                    onChange={handleDocumentUpload}
                    className="hidden"
                    id="documentUpload"
                    disabled={uploading || !selectedDocType}
                  />
                  <label
                    htmlFor="documentUpload"
                    className={`inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg border cursor-pointer ${
                      !selectedDocType || uploading
                        ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                        : 'bg-blue-600 text-white border-blue-600 hover:bg-blue-700'
                    }`}
                  >
                    <Upload className="h-4 w-4" />
                    {uploading ? 'Uploading...' : 'Choose File'}
                  </label>
                  <p className="text-xs text-gray-500 mt-1">
                    {!selectedDocType ? 'Select document type first' : 'Max 10MB (PDF, DOC, Images)'}
                  </p>
                </div>
              </div>
            </div>

            {/* Uploaded Documents List */}
            {formData.teacherProfile.documents.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-2">Uploaded Documents</h3>
                <div className="space-y-2">
                  {formData.teacherProfile.documents.map((doc, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                      <div className="flex items-center gap-3">
                        <FileText className="h-5 w-5 text-gray-400" />
                        <div>
                          <p className="text-sm font-medium text-gray-900 capitalize">
                            {doc.type?.replace('_', ' ')}
                          </p>
                          <p className="text-xs text-gray-500">
                            {doc.uploadedAt ? new Date(doc.uploadedAt).toLocaleDateString() : 'Uploaded'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <a
                          href={doc.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800 text-sm"
                        >
                          View
                        </a>
                        <button
                          type="button"
                          onClick={() => removeDocument(index)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Form Actions */}
      <div className="flex justify-end gap-3 pt-4 border-t">
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
          disabled={loading}
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={loading}
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <ButtonLoader size={4} />
              {editingTeacher ? 'Updating...' : 'Creating...'}
            </span>
          ) : (
            editingTeacher ? 'Update Teacher' : 'Create Teacher'
          )}
        </button>
      </div>
    </form>
  );
}