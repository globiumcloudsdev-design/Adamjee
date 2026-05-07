'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Plus, X, Eye, Trash2, User, Upload, Mail, Phone, Calendar, MapPin, FileText, BookOpen, GraduationCap, Award, DollarSign, Briefcase, Shield } from 'lucide-react';
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
import DatePicker from '@/components/ui/date-picker';
import PhoneInput from '@/components/ui/phone-input';
import CNICInput from '@/components/ui/cnic-input';

export default function TeacherForm({
  userRole = 'super_admin',
  currentBranchId = null,
  editingTeacher = null,
  branches = [],
  departments = [],
  classes = [],
  subjects = [],
  academicYears = [],
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

  const [newClassAssignment, setNewClassAssignment] = useState({
    classId: ''
  });

  // File states
  const [profilePhotoFile, setProfilePhotoFile] = useState(null);
  const [profilePhotoPreview, setProfilePhotoPreview] = useState(editingTeacher?.avatar_url || null);
  const [documentFiles, setDocumentFiles] = useState([]);
  const [documentsToDelete, setDocumentsToDelete] = useState([]); // Track publicIds to delete


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
    branchId: (userRole?.toUpperCase() === 'BRANCH_ADMIN') ? currentBranchId : '',
    academicYearId: '',
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
        totalYears: '',
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
    const loadTeacherData = async () => {
      if (!editingTeacher) return;

      let fullTeacher = editingTeacher;
      
      // If we only have basic info (common in list views), fetch full details
      const needsFullFetch = !editingTeacher.teacherProfile && !editingTeacher.details?.teacher;
      
      if (needsFullFetch) {
        try {
          const id = editingTeacher.id || editingTeacher._id;
          const isSuperAdmin = userRole?.toUpperCase() === 'SUPER_ADMIN';
          const endpoint = isSuperAdmin 
            ? API_ENDPOINTS.SUPER_ADMIN.TEACHERS.GET.replace(':id', id)
            : API_ENDPOINTS.BRANCH_ADMIN.TEACHERS.GET.replace(':id', id);
            
          const response = await apiClient.get(endpoint);
          if (response.success) {
            fullTeacher = response.data;
          }
        } catch (error) {
          console.error('Error fetching full teacher details:', error);
        }
      }

      const details = fullTeacher.details?.teacher || fullTeacher.teacherProfile || {};
      const existingDocs = fullTeacher.details?.documents || fullTeacher.documents || [];
      
      setFormData({
        firstName: fullTeacher.first_name || fullTeacher.firstName || '',
        lastName: fullTeacher.last_name || fullTeacher.lastName || '',
        email: fullTeacher.email || '',
        phone: fullTeacher.phone || '',
        alternatePhone: fullTeacher.alternate_phone || fullTeacher.alternatePhone || '',
        dateOfBirth: (fullTeacher.details?.date_of_birth || fullTeacher.dateOfBirth) 
          ? new Date(fullTeacher.details?.date_of_birth || fullTeacher.dateOfBirth).toISOString().split('T')[0] 
          : '',
        gender: fullTeacher.details?.gender || fullTeacher.gender || 'male',
        bloodGroup: fullTeacher.details?.blood_group || fullTeacher.bloodGroup || '',
        nationality: fullTeacher.details?.nationality || fullTeacher.nationality || 'Pakistani',
        cnic: fullTeacher.details?.cnic || fullTeacher.cnic || '',
        religion: fullTeacher.details?.religion || fullTeacher.religion || '',
        address: fullTeacher.details?.address || fullTeacher.address || {
          street: '',
          city: '',
          state: '',
          country: 'Pakistan',
          postalCode: '',
        },
        branchId: fullTeacher.branch_id || fullTeacher.branchId?._id || (userRole?.toUpperCase() === 'BRANCH_ADMIN' ? currentBranchId : ''),
        profilePhoto: {
          url: fullTeacher.avatar_url || fullTeacher.profilePhoto?.url || '',
          publicId: fullTeacher.details?.avatar_public_id || fullTeacher.profilePhoto?.publicId || ''
        },
        teacherProfile: {
          joiningDate: details.joiningDate || details.joining_date 
            ? new Date(details.joiningDate || details.joining_date).toISOString().split('T')[0] 
            : new Date().toISOString().split('T')[0],
          designation: details.designation || 'Teacher',
          departmentId: details.departmentId?._id || details.departmentId || details.department_id || '',
          department: details.department || '',
          qualifications: details.qualifications || [],
          experience: details.experience || { 
            totalYears: '', 
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
          documents: existingDocs,
        },
        status: fullTeacher.is_active === false ? 'inactive' : 'active',
        remarks: fullTeacher.remarks || '',
      });

      setProfilePhotoPreview(fullTeacher.avatar_url || fullTeacher.profilePhoto?.url || null);
      
      if (Array.isArray(existingDocs)) {
        setDocumentFiles(existingDocs.map(doc => ({
          ...doc,
          isExisting: true
        })));
      }
    };

    loadTeacherData();
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
      // Comprehensive validation before submission
      if (!formData.firstName?.trim() || !formData.lastName?.trim() || !formData.phone?.trim() || !formData.email?.trim() || !formData.gender || !formData.dateOfBirth) {
        setActiveTab('personal');
        toast.error('Please fill all required personal fields');
        setLoading(false);
        return;
      }
      
      if (!formData.teacherProfile?.designation || !formData.teacherProfile?.emergencyContact?.phone?.trim()) {
        setActiveTab('professional');
        toast.error('Please fill required professional and emergency contact fields');
        setLoading(false);
        return;
      }

      if (!formData.academicYearId || (userRole?.toUpperCase() === 'SUPER_ADMIN' && !formData.branchId)) {
        setActiveTab('academic');
        toast.error('Please fill required academic fields');
        setLoading(false);
        return;
      }

      // 1. Create FormData for integrated upload
      const finalFormData = new FormData();
      
      // 2. Add Profile Photo
      if (profilePhotoFile) {
        finalFormData.append('profilePhoto', profilePhotoFile);
      }
      
      // 3. Add Documents & Metadata
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
            isExisting: true,
            isDeleted: documentsToDelete.includes(doc.publicId)
          });
        }
      });
      finalFormData.append('documentMetadata', JSON.stringify(docMetadata));

      // 4. Prepare JSON data
      const payload = {
        ...formData,
        teacherProfile: {
          ...formData.teacherProfile,
          departmentId: formData.teacherProfile.departmentId || undefined,
          documents: undefined, // Let backend handle this from documentMetadata
        },
      };
      finalFormData.append('data', JSON.stringify(payload));

      let response;
      const endpoint = editingTeacher
        ? API_ENDPOINTS[userRole.toUpperCase()]?.TEACHERS?.UPDATE.replace(':id', editingTeacher.id || editingTeacher._id)
        : API_ENDPOINTS[userRole.toUpperCase()]?.TEACHERS?.CREATE;

      if (editingTeacher) {
        response = await apiClient.put(endpoint, finalFormData);
      } else {
        response = await apiClient.post(endpoint, finalFormData);
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

  // File selection handlers (no immediate upload)
  const handleProfilePhotoUpload = (e) => {
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

    setProfilePhotoFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setProfilePhotoPreview(reader.result);
    };
    reader.readAsDataURL(file);
    toast.info('Profile photo selected');
  };

  const handleDocumentUpload = (e) => {
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

    setDocumentFiles(prev => [...prev, { 
      file, 
      type: selectedDocType, 
      name: file.name,
      isExisting: false
    }]);
    
    setSelectedDocType('');
    toast.info(`${selectedDocType} document selected`);
    e.target.value = ''; // Reset input
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
    const docToRemove = documentFiles[index];
    
    if (docToRemove.isExisting) {
      // Mark for deletion on server
      setDocumentsToDelete(prev => [...prev, docToRemove.publicId]);
    }
    
    setDocumentFiles(prev => prev.filter((_, i) => i !== index));
    toast.success('Document removed from list');
  };

  // Tabs
  const tabs = [
    { id: 'personal', label: 'Personal Info', icon: User },
    { id: 'professional', label: 'Professional', icon: Briefcase },
    { id: 'academic', label: 'Academic', icon: GraduationCap },
    { id: 'documents', label: 'Documents', icon: FileText },
  ];

  const validateCurrentTab = () => {
    switch (activeTab) {
      case 'personal':
        if (!formData.firstName?.trim() || !formData.lastName?.trim() || !formData.phone?.trim() || !formData.email?.trim() || !formData.gender || !formData.dateOfBirth) {
          toast.error('Please fill all required personal fields (First Name, Last Name, Phone, Email, Gender, Date of Birth)');
          return false;
        }
        return true;
      case 'professional':
        if (!formData.teacherProfile?.designation) {
          toast.error('Please select a designation');
          return false;
        }
        if (!formData.teacherProfile?.emergencyContact?.phone?.trim()) {
          toast.error('Emergency contact phone is required');
          return false;
        }
        return true;
      case 'academic':
        if (!formData.academicYearId) {
          toast.error('Please select an Academic Year');
          return false;
        }
        if (userRole?.toUpperCase() === 'SUPER_ADMIN' && !formData.branchId) {
          toast.error('Please select a Branch');
          return false;
        }
        return true;
      default:
        return true;
    }
  };

  // Navigation handlers
  const handleNext = () => {
    if (!validateCurrentTab()) return;

    const currentIndex = tabs.findIndex(t => t.id === activeTab);
    if (currentIndex < tabs.length - 1) {
      setActiveTab(tabs[currentIndex + 1].id);
    }
  };

  const handleBack = () => {
    const currentIndex = tabs.findIndex(t => t.id === activeTab);
    if (currentIndex > 0) {
      setActiveTab(tabs[currentIndex - 1].id);
    }
  };

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-4 md:space-x-8 overflow-x-auto no-scrollbar">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                const targetIndex = tabs.findIndex(t => t.id === tab.id);
                const currentIndex = tabs.findIndex(t => t.id === activeTab);
                
                // Only allow clicking forward if current tab is valid
                if (targetIndex > currentIndex) {
                  if (validateCurrentTab()) {
                    setActiveTab(tab.id);
                  }
                } else {
                  // Always allow going back
                  setActiveTab(tab.id);
                }
              }}
              className={`flex items-center gap-2 py-4 px-1 border-b-2 font-bold text-xs md:text-sm transition-all whitespace-nowrap ${
                activeTab === tab.id
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-400 hover:text-gray-600 hover:border-gray-300'
              }`}
            >
              <div className={`p-1.5 rounded-lg ${activeTab === tab.id ? 'bg-blue-50' : 'bg-gray-50'}`}>
                <tab.icon className="h-4 w-4" />
              </div>
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Form Content */}
      <form ref={formRef} onSubmit={handleSubmit} className="space-y-6">
      <div className="max-h-[65vh] overflow-y-auto space-y-8 p-1 custom-scrollbar">
        
        {/* Personal Info Tab */}
        {activeTab === 'personal' && (
          <div className="space-y-4">
            {/* Profile Photo */}
            <div className="border-b pb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Profile Photo</label>
              <div className="flex items-center gap-4">
                {profilePhotoPreview ? (
                  <div className="relative">
                    <img
                      src={profilePhotoPreview}
                      alt="Profile"
                      className="h-24 w-24 rounded-full object-cover border-2 border-gray-200"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setProfilePhotoFile(null);
                        setProfilePhotoPreview(null);
                        setFormData({ ...formData, profilePhoto: { url: '', publicId: '' } });
                      }}
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
                    {profilePhotoPreview ? 'Change Photo' : 'Select Photo'}
                  </label>
                  <p className="text-xs text-gray-500 mt-1">Max 5MB (JPG, PNG, GIF)</p>
                </div>
              </div>
            </div>

            {/* Basic Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1.5 uppercase text-[10px] tracking-widest">
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
                <label className="block text-sm font-bold text-gray-700 mb-1.5 uppercase text-[10px] tracking-widest">
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
                <label className="block text-sm font-bold text-gray-700 mb-1.5 uppercase text-[10px] tracking-widest">
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
                <label className="block text-sm font-bold text-gray-700 mb-1.5 uppercase text-[10px] tracking-widest">Phone <span className="text-red-500 font-bold">*</span></label>
                <PhoneInput
                  value={formData.phone}
                  onChange={(val) => setFormData({ ...formData, phone: val })}
                  hideDescription
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1.5 uppercase text-[10px] tracking-widest">Alternate Phone</label>
                <PhoneInput
                  value={formData.alternatePhone}
                  onChange={(val) => setFormData({ ...formData, alternatePhone: val })}
                  hideDescription
                />
              </div>

              <DatePicker
                label="Date of Birth"
                name="dateOfBirth"
                value={formData.dateOfBirth}
                onChange={handleInputChange}
                required
              />

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

              <CNICInput
                label="CNIC"
                value={formData.cnic}
                onChange={(val) => setFormData({ ...formData, cnic: val })}
              />

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
            </div>

            {/* Address Section */}
            <div className="border-t pt-4">
              <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Address Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1.5 uppercase text-[10px] tracking-widest">Street Address</label>
                  <Input
                    type="text"
                    name="address.street"
                    value={formData.address.street}
                    onChange={handleInputChange}
                    placeholder="House #123, Street #456"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1.5 uppercase text-[10px] tracking-widest">City</label>
                  <Input
                    type="text"
                    name="address.city"
                    value={formData.address.city}
                    onChange={handleInputChange}
                    placeholder="Karachi"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1.5 uppercase text-[10px] tracking-widest">State/Province</label>
                  <Input
                    type="text"
                    name="address.state"
                    value={formData.address.state}
                    onChange={handleInputChange}
                    placeholder="Sindh"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1.5 uppercase text-[10px] tracking-widest">Postal Code</label>
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
              <DatePicker
                label="Joining Date"
                name="teacherProfile.joiningDate"
                value={formData.teacherProfile.joiningDate}
                onChange={handleInputChange}
              />

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1.5 uppercase text-[10px] tracking-widest">Designation</label>
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

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1.5 uppercase text-[10px] tracking-widest">Experience (Years)</label>
                <Input
                  type="number"
                  name="teacherProfile.experience.totalYears"
                  value={formData.teacherProfile.experience.totalYears}
                  onChange={handleInputChange}
                  placeholder="e.g. 5"
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

            <div className="border-t pt-6">
              <h3 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Shield className="h-4 w-4 text-red-500" />
                Emergency Contact Details
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1.5 uppercase text-[10px] tracking-widest">Contact Name</label>
                  <Input
                    type="text"
                    name="teacherProfile.emergencyContact.name"
                    value={formData.teacherProfile.emergencyContact.name}
                    onChange={handleInputChange}
                    placeholder="John Doe"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1.5 uppercase text-[10px] tracking-widest">Relationship</label>
                  <Input
                    type="text"
                    name="teacherProfile.emergencyContact.relationship"
                    value={formData.teacherProfile.emergencyContact.relationship}
                    onChange={handleInputChange}
                    placeholder="Father/Brother"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1.5 uppercase text-[10px] tracking-widest">Phone Number</label>
                  <PhoneInput
                    value={formData.teacherProfile.emergencyContact.phone}
                    onChange={(val) => setFormData({
                      ...formData,
                      teacherProfile: {
                        ...formData.teacherProfile,
                        emergencyContact: {
                          ...formData.teacherProfile.emergencyContact,
                          phone: val
                        }
                      }
                    })}
                    required
                    hideDescription
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Academic Tab */}
        {activeTab === 'academic' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Academic Year <span className="text-red-500">*</span>
                </label>
                <Dropdown
                  name="academicYearId"
                  value={formData.academicYearId}
                  onChange={handleInputChange}
                  options={academicYears.map(year => ({
                    label: year.year || year.name,
                    value: year.id || year._id
                  }))}
                  placeholder="Select Academic Year"
                  required
                />
              </div>

              {userRole?.toUpperCase() === 'SUPER_ADMIN' && (
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
            </div>

            <div className="border-t pt-4">
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
        )}

        {/* Documents Tab */}
        {activeTab === 'documents' && (
          <div className="space-y-4">
            {/* Document Selection Section */}
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
              <div className="text-center">
                <FileText className="h-12 w-12 mx-auto text-gray-400 mb-2" />
                <p className="text-sm font-medium text-gray-900 mb-1">Select Documents</p>
                <p className="text-xs text-gray-500 mb-4">CNIC, Degrees, Certificates, etc.</p>
                
                <div className="space-y-3 max-w-md mx-auto">
                  <DocumentTypeSelect
                    name="documentType"
                    value={selectedDocType}
                    onChange={(e) => setSelectedDocType(e.target.value)}
                  />

                  <input
                    type="file"
                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                    onChange={handleDocumentUpload}
                    className="hidden"
                    id="documentUpload"
                    disabled={!selectedDocType}
                  />
                  <label
                    htmlFor="documentUpload"
                    className={`inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg border cursor-pointer ${
                      !selectedDocType
                        ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                        : 'bg-blue-600 text-white border-blue-600 hover:bg-blue-700'
                    }`}
                  >
                    <Upload className="h-4 w-4" />
                    Select File
                  </label>
                  <p className="text-xs text-gray-500 mt-1">
                    {!selectedDocType ? 'Select document type first' : 'Max 10MB (PDF, DOC, Images)'}
                  </p>
                </div>
              </div>
            </div>

            {/* Document List */}
            {documentFiles.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-2">Selected Documents</h3>
                <div className="space-y-2">
                  {documentFiles.map((doc, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                      <div className="flex items-center gap-3">
                        <FileText className="h-5 w-5 text-gray-400" />
                        <div>
                          <p className="text-sm font-medium text-gray-900 capitalize">
                            {doc.type?.replace('_', ' ')}
                          </p>
                          <p className="text-xs text-gray-500">
                            {doc.name} {doc.isExisting ? '(Existing)' : '(New)'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {(doc.url || doc.preview) && (
                          <a
                            href={doc.url || doc.preview}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1 text-blue-600 hover:bg-blue-100 rounded"
                          >
                            <Eye className="h-4 w-4" />
                          </a>
                        )}
                        <button
                          type="button"
                          onClick={() => removeDocument(index)}
                          className="p-1 text-red-600 hover:bg-red-100 rounded"
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

      {/* Form Actions / Navigation */}
      <div className="flex justify-between items-center pt-6 border-t mt-4">
        <div className="flex gap-3">
          {activeTab !== 'personal' && (
            <button
              type="button"
              onClick={handleBack}
              className="px-6 py-2 border border-gray-300 rounded-xl hover:bg-gray-50 text-gray-700 font-bold text-sm transition-all flex items-center gap-2"
              disabled={loading}
            >
              Back
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2 text-gray-500 hover:text-gray-700 font-bold text-sm"
            disabled={loading}
          >
            Cancel
          </button>
        </div>

        <div className="flex gap-3">
          {activeTab !== 'documents' ? (
            <button
              type="button"
              onClick={handleNext}
              className="px-8 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-bold text-sm shadow-lg shadow-blue-500/20 transition-all"
            >
              Next Step
            </button>
          ) : (
            <button
              type="submit"
              className="px-8 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 font-bold text-sm shadow-lg shadow-green-500/20 transition-all flex items-center gap-2"
              disabled={loading}
            >
              {loading ? (
                <>
                  <ButtonLoader size={4} />
                  {editingTeacher ? 'Updating...' : 'Creating...'}
                </>
              ) : (
                editingTeacher ? 'Update Teacher' : 'Create Teacher'
              )}
            </button>
          )}
        </div>
      </div>
    </form>
  </div>
  );
}