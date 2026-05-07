'use client';

import React, { useState, useEffect } from 'react';
import Modal from '@/components/ui/modal';
import Input from '@/components/ui/input';
import Dropdown from '@/components/ui/dropdown';
import DatePicker from '@/components/ui/date-picker';
import PhoneInput from '@/components/ui/phone-input';
import CNICInput from '@/components/ui/cnic-input';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import apiClient from '@/lib/api-client';
import { 
  User, 
  GraduationCap, 
  Users, 
  CreditCard, 
  FileText,
  Camera,
  Upload,
  Plus,
  X,
  FileUp
} from 'lucide-react';

const StudentFormModal = ({
  isOpen,
  onClose,
  onSubmit,
  editingStudent,
  isSubmitting,
  branches = [],
  classes = [],
  groups = [],
  academicYears = [],
  userRole,
}) => {
  const [activeTab, setActiveTab] = useState('personal');
  const [sections, setSections] = useState([]);
  const [subjectsList, setSubjectsList] = useState([]);
  
  const [formData, setFormData] = useState({
    // Personal Info
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    alternate_phone: '',
    password: '',
    gender: 'male',
    date_of_birth: '',
    blood_group: '',
    nationality: 'Pakistani',
    religion: '',
    cnic: '',
    address: { street: '', city: '', state: '', postalCode: '', country: 'Pakistan' },
    remarks: '',
    // Academic Info
    branch_id: '',
    academic_year_id: '',
    group_id: '',
    class_id: '',
    section_id: '',
    roll_no: '',
    registration_no: '',
    // Parent Info
    guardian_type: 'parent',
    father: { name: '', occupation: '', phone: '', email: '', cnic: '', income: 0 },
    mother: { name: '', occupation: '', phone: '', email: '', cnic: '' },
    guardian: { name: '', relation: '', phone: '', email: '', cnic: '' },
    emergency_contact: { name: '', relationship: '', phone: '' },
    // Fees & Subjects
    discount: 0,
    fee_mention: 'Monthly',
    subjects: [], // array of { id, name, fee }
    // Files
    profile_image: null,
    profile_preview: '',
    documents: [], // array of { file, type, label }
  });

  // Load Class-specific Sections and Subjects
  useEffect(() => {
    const fetchClassDetails = async () => {
      if (!formData.class_id) {
        setSections([]);
        setSubjectsList([]);
        return;
      }
      try {
        const secRes = await apiClient.get(`/api/sections?class_id=${formData.class_id}`);
        setSections(Array.isArray(secRes) ? secRes : []);

        const subRes = await apiClient.get(`/api/subjects?class_id=${formData.class_id}`);
        setSubjectsList(Array.isArray(subRes) ? subRes : []);
      } catch (err) {
        console.error("Error fetching section/subject data:", err);
      }
    };
    fetchClassDetails();
  }, [formData.class_id]);

  // Populate form on edit
  useEffect(() => {
    if (editingStudent) {
      const profile = editingStudent.studentProfile || {};
      console.log("Editing Student:", editingStudent);
      
      setFormData({
        first_name: editingStudent.firstName || editingStudent.first_name || '',
        last_name: editingStudent.lastName || editingStudent.last_name || '',
        email: editingStudent.email || '',
        phone: editingStudent.phone || '',
        alternate_phone: editingStudent.alternatePhone || editingStudent.alternate_phone || '',
        password: '', // do not prefill password
        gender: editingStudent.gender || 'male',
        date_of_birth: editingStudent.dateOfBirth ? new Date(editingStudent.dateOfBirth).toISOString().split('T')[0] : 
                       (editingStudent.date_of_birth ? new Date(editingStudent.date_of_birth).toISOString().split('T')[0] : ''),
        blood_group: editingStudent.bloodGroup || editingStudent.blood_group || '',
        nationality: editingStudent.nationality || 'Pakistani',
        religion: editingStudent.religion || '',
        cnic: editingStudent.cnic || '',
        address: editingStudent.address || { street: '', city: '', state: '', postalCode: '', country: 'Pakistan' },
        remarks: editingStudent.remarks || '',
        branch_id: editingStudent.branchId || editingStudent.branch_id || '',
        academic_year_id: profile.academicYear || profile.academic_year || profile.academic_year_id || '',
        group_id: profile.groupId || profile.group_id || '',
        class_id: profile.classId || profile.class_id || '',
        section_id: profile.section || profile.section_id || '',
        roll_no: profile.rollNumber || profile.roll_no || '',
        registration_no: editingStudent.registration_no || editingStudent.registrationNo || '',
        admission_date: profile.admissionDate ? new Date(profile.admissionDate).toISOString().split('T')[0] :
                        (profile.admission_date ? new Date(profile.admission_date).toISOString().split('T')[0] : ''),
        guardian_type: profile.guardianType || profile.guardian_type || 'parent',
        father: profile.father || { name: '', occupation: '', phone: '', email: '', cnic: '', income: 0 },
        mother: profile.mother || { name: '', occupation: '', phone: '', email: '', cnic: '' },
        guardian: profile.guardian || { name: '', relation: '', phone: '', email: '', cnic: '' },
        emergency_contact: editingStudent.emergencyContact || profile.emergency_contact || { name: '', relationship: '', phone: '' },
        discount: profile.feeDiscount?.amount || profile.discount || 0,
        fee_mention: profile.feeMention || profile.fee_mention || 'Monthly',
        installment_count: profile.installmentCount || profile.installment_count || profile.installments || 1,
        subjects: profile.selectedSubjects || profile.subjects || editingStudent.selectedSubjects || [],
        profile_image: null,
        profile_preview: editingStudent.avatar_url || editingStudent.avatarUrl || '',
        documents: profile.documents || [],
      });
    } else {
      setFormData({
        first_name: '',
        last_name: '',
        email: '',
        phone: '',
        alternate_phone: '',
        password: '',
        gender: 'male',
        date_of_birth: '',
        blood_group: '',
        nationality: 'Pakistani',
        religion: '',
        cnic: '',
        address: { street: '', city: '', state: '', postalCode: '', country: 'Pakistan' },
        remarks: '',
        installment_count: 1,
        branch_id: '',
        academic_year_id: '',
        class_id: '',
        section_id: '',
        roll_no: '',
        registration_no: '',
        guardian_type: 'parent',
        father: { name: '', occupation: '', phone: '', email: '', cnic: '', income: 0 },
        mother: { name: '', occupation: '', phone: '', email: '', cnic: '' },
        guardian: { name: '', relation: '', phone: '', email: '', cnic: '' },
        emergency_contact: { name: '', relationship: '', phone: '' },
        discount: 0,
        fee_mention: 'Monthly',
        subjects: [],
        profile_image: null,
        profile_preview: '',
        documents: [],
      });
    }
    setActiveTab('personal');
  }, [editingStudent, isOpen]);

  const handleFieldChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleNestedFieldChange = (section, field, value) => {
    setFormData((prev) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }));
  };

  const handleSubjectToggle = (subject) => {
    setFormData((prev) => {
      const alreadySelected = prev.subjects.find(s => s.id === subject.id);
      if (alreadySelected) {
        return {
          ...prev,
          subjects: prev.subjects.filter(s => s.id !== subject.id)
        };
      } else {
        return {
          ...prev,
          subjects: [...prev.subjects, { id: subject.id, fee: 0 }]
        };
      }
    });
  };

  const handleSubjectFeeChange = (subjectId, fee) => {
    setFormData((prev) => ({
      ...prev,
      subjects: prev.subjects.map(s => s.id === subjectId ? { ...s, fee: Number(fee) } : s)
    }));
  };

  const getAcademicMonths = () => {
    if (!formData.academic_year_id || !academicYears || !academicYears.length) return 1;
    const activeYear = academicYears.find(y => (y.id === formData.academic_year_id || y._id === formData.academic_year_id));
    if (!activeYear || !activeYear.start_date || !activeYear.end_date) return 1;

    const start = new Date(activeYear.start_date);
    const end = new Date(activeYear.end_date);
    
    let months = (end.getFullYear() - start.getFullYear()) * 12;
    months -= start.getMonth();
    months += end.getMonth();
    
    return months <= 0 ? 1 : months + 1; 
  };

  const getAcademicRangeText = () => {
    if (!formData.academic_year_id || !academicYears || !academicYears.length) return '';
    const activeYear = academicYears.find(y => (y.id === formData.academic_year_id || y._id === formData.academic_year_id));
    if (!activeYear || !activeYear.start_date || !activeYear.end_date) return '';

    const options = { year: 'numeric', month: 'long' };
    const start = new Date(activeYear.start_date).toLocaleDateString('en-US', options);
    const end = new Date(activeYear.end_date).toLocaleDateString('en-US', options);

    return `(${start} to ${end})`;
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({
          ...prev,
          profile_image: file,
          profile_preview: reader.result
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const addDocument = (file, type = 'other') => {
    const reader = new FileReader();
    reader.onloadend = () => {
      setFormData(prev => ({
        ...prev,
        documents: [...prev.documents, { file, type, label: file.name, base64: reader.result }]
      }));
    };
    reader.readAsDataURL(file);
  };

  const removeDocument = (index) => {
    setFormData(prev => ({
      ...prev,
      documents: prev.documents.filter((_, i) => i !== index)
    }));
  };

  const validateTab = (tabId) => {
    switch (tabId) {
      case 'personal':
        return (
          formData.first_name && 
          formData.last_name && 
          formData.phone && 
          (editingStudent || formData.password) &&
          formData.gender &&
          formData.date_of_birth
        );
      case 'academic':
        return (
          formData.group_id &&
          formData.class_id &&
          formData.section_id
        );
      case 'parent':
        const parentValid = formData.guardian_type === 'parent' 
          ? (formData.father.name && formData.father.phone)
          : (formData.guardian.name && formData.guardian.relation && formData.guardian.phone);
        
        const emergencyValid = (
          formData.emergency_contact.name && 
          formData.emergency_contact.relationship && 
          formData.emergency_contact.phone
        );
        
        return parentValid && emergencyValid;
      case 'documents':
        return true;
      default:
        return true;
    }
  };

  const handleNext = () => {
    if (!validateTab(activeTab)) {
      toast.error('Please fill all required fields marked with *');
      return;
    }
    const currentIndex = tabs.findIndex(t => t.id === activeTab);
    if (currentIndex < tabs.length - 1) {
      setActiveTab(tabs[currentIndex + 1].id);
    }
  };

  const handlePrevious = () => {
    const currentIndex = tabs.findIndex(t => t.id === activeTab);
    if (currentIndex > 0) {
      setActiveTab(tabs[currentIndex - 1].id);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const subjectsTotal = formData.subjects.reduce((acc, sub) => acc + (sub.fee || 0), 0);
    let calculatedEstimate = subjectsTotal - Number(formData.discount);

    if (formData.fee_mention === 'LumpSum') {
      calculatedEstimate = (subjectsTotal * getAcademicMonths()) - Number(formData.discount);
    } else if (formData.fee_mention === 'Installment' && formData.installment_count > 0) {
      calculatedEstimate = Math.round(((subjectsTotal * getAcademicMonths()) - Number(formData.discount)) / formData.installment_count);
    }

    const payload = {
      first_name: formData.first_name,
      last_name: formData.last_name,
      email: formData.email,
      phone: formData.phone,
      password: formData.password || undefined,
      branch_id: formData.branch_id,
      academic_year_id: formData.academic_year_id,
      class_id: formData.class_id,
      group_id: formData.group_id,
      section_id: formData.section_id,
      subjects: formData.subjects,
      discount: Number(formData.discount),
      registration_no: formData.registration_no,
      roll_no: formData.roll_no,
      academic_info: {
        alternate_phone: formData.alternate_phone,
        gender: formData.gender,
        date_of_birth: formData.date_of_birth,
        blood_group: formData.blood_group,
        admission_date: formData.admission_date,
        nationality: formData.nationality,
        religion: formData.religion,
        cnic: formData.cnic,
        address: formData.address,
        remarks: formData.remarks,
        father: formData.father,
        mother: formData.mother,
        guardian: formData.guardian,
        guardian_type: formData.guardian_type,
        emergency_contact: formData.emergency_contact,
        fee_mention: formData.fee_mention,
        fee_type: formData.fee_mention,
        group_id: formData.group_id,
        installment_count: formData.installment_count,
        fee_estimate: calculatedEstimate,
        discount: Number(formData.discount),
      },
      isEditMode: Boolean(editingStudent),
      studentId: editingStudent?.id || editingStudent?._id,
      // File data for backend handling
      pendingProfileFile: formData.profile_preview, // Base64 preview
      pendingDocuments: formData.documents.map(doc => ({
        file: doc.base64, // Base64 string
        name: doc.label,
        type: doc.type
      })),
    };

    try {
      await onSubmit(payload);
    } catch (err) {
      console.error(err);
      toast.error(err.message || 'Failed to submit student data');
    }
  };

  const filteredGroups = groups.filter(g => 
    (!formData.branch_id || g.branch_id === formData.branch_id)
  );

  const filteredClasses = classes.filter(c => 
    (!formData.branch_id || c.branch_id === formData.branch_id) &&
    (!formData.group_id || c.group_id === formData.group_id)
  );

  if (!isOpen) return null;

  const tabs = [
    { id: 'personal', label: 'Personal', icon: User },
    { id: 'academic', label: 'Academic & Fees', icon: GraduationCap },
    { id: 'parent', label: 'Family', icon: Users },
    { id: 'documents', label: 'Documents', icon: FileUp },
  ];

  return (
    <Modal open={isOpen} onClose={onClose} title={editingStudent ? 'Edit Student' : 'Enroll New Student'} size="xl">
      <div className="flex border-b px-4 gap-4">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                // Prevent jumping to tabs ahead if current isn't valid
                const targetIndex = tabs.findIndex(t => t.id === tab.id);
                const currentIndex = tabs.findIndex(t => t.id === activeTab);
                
                if (targetIndex > currentIndex && !validateTab(activeTab)) {
                  toast.error('Please fill required fields before moving forward');
                  return;
                }
                setActiveTab(tab.id);
              }}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-primary text-primary'
                  : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Personal Tab */}
        {activeTab === 'personal' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input label="First Name" value={formData.first_name} onChange={(e) => handleFieldChange('first_name', e.target.value)} placeholder="Enter first name" required />
              <Input label="Last Name" value={formData.last_name} onChange={(e) => handleFieldChange('last_name', e.target.value)} placeholder="Enter last name" required />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-1">
                <Input label="Account Access Email" type="email" value={formData.email} onChange={(e) => handleFieldChange('email', e.target.value)} placeholder="Access@example.com" />
              </div>
              <div className="md:col-span-1">
                <PhoneInput label="Phone" value={formData.phone} onChange={(val) => handleFieldChange('phone', val)} required hideDescription />
              </div>
              <div className="md:col-span-1">
                <PhoneInput label="Alternate Phone" value={formData.alternate_phone} onChange={(val) => handleFieldChange('alternate_phone', val)} hideDescription />
              </div>
            </div>

            {!editingStudent && (
              <Input label="Password" type="password" value={formData.password} onChange={(e) => handleFieldChange('password', e.target.value)} placeholder="••••••••" required />
            )}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Dropdown
                label="Gender"
                value={formData.gender}
                onChange={(e) => handleFieldChange('gender', e.target.value)}
                options={[
                  { value: 'male', label: 'Male' },
                  { value: 'female', label: 'Female' },
                  { value: 'other', label: 'Other' },
                ]}
                placeholder="Select Gender"
                required
              />
              <DatePicker
                label="Date of Birth"
                value={formData.date_of_birth}
                onChange={(e) => handleFieldChange('date_of_birth', e.target.value)}
                placeholder="Select DOB"
                required
              />
              <Input label="Blood Group" value={formData.blood_group} onChange={(e) => handleFieldChange('blood_group', e.target.value)} placeholder="e.g. A+" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Input label="Nationality" value={formData.nationality} onChange={(e) => handleFieldChange('nationality', e.target.value)} placeholder="Pakistani" />
              <Input label="Religion" value={formData.religion} onChange={(e) => handleFieldChange('religion', e.target.value)} placeholder="e.g. Islam" />
              <CNICInput label="CNIC / B-Form" value={formData.cnic} onChange={(val) => handleFieldChange('cnic', val)} hideDescription placeholder="XXXXX-XXXXXXX-X" />
            </div>
            <div className="border-t pt-4">
              <h4 className="font-medium text-gray-700 mb-2">Address Details</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input label="Street" value={formData.address.street} onChange={(e) => handleNestedFieldChange('address', 'street', e.target.value)} placeholder="Street address" />
                <Input label="City" value={formData.address.city} onChange={(e) => handleNestedFieldChange('address', 'city', e.target.value)} placeholder="City name" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-2">
                <Input label="State" value={formData.address.state} onChange={(e) => handleNestedFieldChange('address', 'state', e.target.value)} placeholder="Province" />
                <Input label="Postal Code" value={formData.address.postalCode} onChange={(e) => handleNestedFieldChange('address', 'postalCode', e.target.value)} placeholder="Zip code" />
                <Input label="Country" value={formData.address.country} onChange={(e) => handleNestedFieldChange('address', 'country', e.target.value)} placeholder="Pakistan" />
              </div>
            </div>
          </div>
        )}

        {/* Academic Tab */}
        {activeTab === 'academic' && (
          <div className="space-y-4">
            <div className={`grid grid-cols-1 ${userRole !== 'BRANCH_ADMIN' ? 'md:grid-cols-2' : ''} gap-4`}>
              {userRole !== 'BRANCH_ADMIN' && (
                <Dropdown
                  label="Branch"
                  value={formData.branch_id}
                  onChange={(e) => handleFieldChange('branch_id', e.target.value)}
                  options={[
                    { value: '', label: 'Select Branch' },
                    ...branches.map((b) => ({ value: b.id || b._id, label: b.name })),
                  ]}
                  disabled={userRole === 'BRANCH_ADMIN'}
                />
              )}
              <Dropdown
                label="Academic Year"
                value={formData.academic_year_id}
                onChange={(e) => handleFieldChange('academic_year_id', e.target.value)}
                options={[
                  { value: '', label: 'Select Year' },
                  ...academicYears.map((y) => ({ value: y.id || y._id, label: y.name })),
                ]}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Dropdown
                label="Group"
                value={formData.group_id}
                onChange={(e) => handleFieldChange('group_id', e.target.value)}
                options={[
                  { value: '', label: 'Select Group' },
                  ...filteredGroups.map((g) => ({ value: g.id || g._id, label: g.name })),
                ]}
                required
              />

              <Dropdown
                label="Class"
                value={formData.class_id}
                onChange={(e) => handleFieldChange('class_id', e.target.value)}
                options={[
                  { value: '', label: 'Select Class' },
                  ...filteredClasses.map((c) => ({ value: c.id || c._id, label: c.name })),
                ]}
                required
              />

              <Dropdown
                label="Section"
                value={formData.section_id}
                onChange={(e) => handleFieldChange('section_id', e.target.value)}
                options={[
                  { value: '', label: sections.length ? 'Select Section' : 'No Sections Found for this Class' },
                  ...sections.map((s) => ({ value: s.id || s._id, label: s.name })),
                ]}
                required
                disabled={!formData.class_id}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Input label="GR No (Auto-generate)" value={formData.roll_no} onChange={(e) => handleFieldChange('roll_no', e.target.value)} placeholder="Enter GR No" />
              <Input label="Registration No" value={formData.registration_no} onChange={(e) => handleFieldChange('registration_no', e.target.value)} placeholder="Reg-2024-XXX"/>
              <DatePicker
                label="Admission Date"
                value={formData.admission_date}
                onChange={(e) => handleFieldChange('admission_date', e.target.value)}
                placeholder="Select date"
              />
            </div>

            {/* Fees & Subjects (Merged) */}
            <div className="border-t pt-6 space-y-6">
              <div className="flex items-center gap-2 mb-4">
                <CreditCard className="w-5 h-5 text-primary" />
                <h4 className="font-semibold text-gray-800">Fees & Subjects</h4>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Dropdown
                  label="Fee Mention"
                  value={formData.fee_mention}
                  onChange={(e) => handleFieldChange('fee_mention', e.target.value)}
                  options={[
                    { value: 'Monthly', label: 'Monthly' },
                    { value: 'LumpSum', label: 'Lump Sum' },
                    { value: 'Installment', label: 'Installments' },
                  ]}
                />
                <Input label="Discount (Amount)" type="number" value={formData.discount || ''} onChange={(e) => handleFieldChange('discount', Number(e.target.value))} />
              </div>

              {formData.fee_mention === 'Installment' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border p-4 rounded-md bg-gray-50">
                  <Input
                    label="Installment Count"
                    type="number"
                    value={formData.installment_count || 0}
                    onChange={(e) => handleFieldChange('installment_count', Number(e.target.value))}
                  />
                  <div className="flex flex-col justify-center">
                    <span className="text-xs text-gray-500 font-medium">Per Installment Estimate</span>
                    <span className="text-xs text-primary/80 font-medium mb-1">{getAcademicRangeText()}</span>
                    <span className="text-lg font-bold text-primary">
                      {formData.installment_count > 0
                        ? Math.round(
                            ((formData.subjects.reduce((acc, sub) => acc + (sub.fee || 0), 0) * getAcademicMonths()) - formData.discount) /
                              formData.installment_count
                          )
                        : 0}{' '}
                      PKR
                    </span>
                  </div>
                </div>
              )}

              {formData.fee_mention === 'LumpSum' && (
                <div className="border p-4 rounded-md bg-gray-50">
                  <span className="text-xs text-gray-500 font-medium">Lump Sum Course Clearance ({getAcademicMonths()} Months)</span>
                  <span className="text-xs text-primary/80 font-medium block mb-1">{getAcademicRangeText()}</span>
                  <span className="text-xl font-bold block text-primary">
                    {(formData.subjects.reduce((acc, sub) => acc + (sub.fee || 0), 0) * getAcademicMonths()) - formData.discount} PKR
                  </span>
                </div>
              )}

              <div className="border-t pt-4">
                <h4 className="font-medium text-gray-700 mb-2">Subject Selection</h4>
                {!formData.class_id ? (
                  <p className="text-sm text-gray-500 italic">Please select a Class first to view available subjects.</p>
                ) : subjectsList.length === 0 ? (
                  <p className="text-sm text-gray-500 italic">No subjects defined for this class.</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[40vh] overflow-y-auto p-2 border rounded-md">
                    {subjectsList.map((sub) => {
                      const isChecked = formData.subjects.some(s => s.id === sub.id);
                      const currentSelected = formData.subjects.find(s => s.id === sub.id);

                      return (
                        <div key={sub.id} className="flex flex-col p-3 border rounded-lg bg-gray-50 hover:shadow-sm transition-shadow">
                          <div className="flex items-center justify-between">
                            <label className="flex items-center space-x-3 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => handleSubjectToggle(sub)}
                                className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
                              />
                              <div>
                                <p className="font-medium text-gray-800 text-sm">{sub.name}</p>
                                {sub.subject_code && <p className="text-xs text-gray-500 font-mono">{sub.subject_code}</p>}
                              </div>
                            </label>
                          </div>
                          {isChecked && (
                            <div className="mt-2 pt-2 border-t flex items-center gap-2">
                              <label className="text-xs font-medium text-gray-600 shrink-0">Subject Fee (PKR)</label>
                              <input
                                type="number"
                                placeholder="Fee (PKR)"
                                value={currentSelected?.fee || ''}
                                onChange={(e) => handleSubjectFeeChange(sub.id, e.target.value)}
                                className="w-full px-2 py-1 text-sm border rounded focus:outline-none focus:border-primary"
                              />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Parent Tab */}
        {activeTab === 'parent' && (
          <div className="space-y-6">
            <Dropdown
              label="Guardian Type"
              value={formData.guardian_type}
              onChange={(e) => handleFieldChange('guardian_type', e.target.value)}
              options={[
                { value: 'parent', label: 'Parent (Father & Mother)' },
                { value: 'other', label: 'Other Guardian' },
              ]}
            />

            {formData.guardian_type === 'parent' ? (
              <>
                <div className="border-t pt-4">
                  <h4 className="font-medium text-gray-700 mb-2">Father Info</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Input label="Name" value={formData.father.name} onChange={(e) => handleNestedFieldChange('father', 'name', e.target.value)} placeholder="Father's full name" required={formData.guardian_type === 'parent'} />
                    <PhoneInput label="Phone" value={formData.father.phone} onChange={(val) => handleNestedFieldChange('father', 'phone', val)} required={formData.guardian_type === 'parent'} hideDescription placeholder="3XX XXXXXXX" />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-2">
                    <CNICInput label="CNIC" value={formData.father.cnic} onChange={(val) => handleNestedFieldChange('father', 'cnic', val)} hideDescription placeholder="XXXXX-XXXXXXX-X" />
                    <Input label="Occupation" value={formData.father.occupation} onChange={(e) => handleNestedFieldChange('father', 'occupation', e.target.value)} placeholder="e.g. Businessman" />
                    <Input label="Income" type="number" value={formData.father.income} onChange={(e) => handleNestedFieldChange('father', 'income', Number(e.target.value))} placeholder="Monthly income" />
                  </div>
                </div>
              </>
            ) : (
              <div className="border-t pt-4">
                <h4 className="font-medium text-gray-700 mb-2">Guardian Info</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <Input label="Name" value={formData.guardian.name} onChange={(e) => handleNestedFieldChange('guardian', 'name', e.target.value)} placeholder="Guardian's name" required={formData.guardian_type !== 'parent'} />
                  <Input label="Relation" value={formData.guardian.relation} onChange={(e) => handleNestedFieldChange('guardian', 'relation', e.target.value)} placeholder="e.g. Uncle" required={formData.guardian_type !== 'parent'} />
                  <PhoneInput label="Phone" value={formData.guardian.phone} onChange={(val) => handleNestedFieldChange('guardian', 'phone', val)} required={formData.guardian_type !== 'parent'} hideDescription placeholder="3XX XXXXXXX" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-2">
                  <Input label="Email" type="email" value={formData.guardian.email} onChange={(e) => handleNestedFieldChange('guardian', 'email', e.target.value)} placeholder="guardian@example.com" />
                  <CNICInput label="CNIC" value={formData.guardian.cnic} onChange={(val) => handleNestedFieldChange('guardian', 'cnic', val)} hideDescription placeholder="XXXXX-XXXXXXX-X" />
                </div>
              </div>
            )}

            <div className="border-t pt-4">
              <h4 className="font-medium text-gray-700 mb-2">Emergency Contact</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Input label="Name" value={formData.emergency_contact.name} onChange={(e) => handleNestedFieldChange('emergency_contact', 'name', e.target.value)} placeholder="Contact person name" required />
                <Input label="Relationship" value={formData.emergency_contact.relationship} onChange={(e) => handleNestedFieldChange('emergency_contact', 'relationship', e.target.value)} placeholder="e.g. Brother" required />
                <PhoneInput label="Phone" value={formData.emergency_contact.phone} onChange={(val) => handleNestedFieldChange('emergency_contact', 'phone', val)} required hideDescription placeholder="3XX XXXXXXX" />
              </div>
            </div>
          </div>
        )}

        {/* Documents Tab */}
        {activeTab === 'documents' && (
          <div className="space-y-8">
            {/* Profile Picture Section */}
            <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-xl bg-gray-50/50 border-gray-200">
              <div className="relative group">
                <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-white shadow-lg bg-gray-100 flex items-center justify-center">
                  {formData.profile_preview ? (
                    <img src={formData.profile_preview} alt="Profile Preview" className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-12 h-12 text-gray-300" />
                  )}
                </div>
                <label className="absolute bottom-0 right-0 p-2 bg-primary text-white rounded-full shadow-lg cursor-pointer hover:scale-110 transition-transform">
                  <Camera className="w-4 h-4" />
                  <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
                </label>
              </div>
              <div className="mt-4 text-center">
                <h4 className="font-semibold text-gray-800">Profile Picture</h4>
                <p className="text-xs text-gray-500 mt-1">Upload a clear photo of the student (JPG, PNG)</p>
              </div>
            </div>

            {/* Supporting Documents Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold text-gray-800 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-primary" />
                  Supporting Documents
                </h4>
                <label className="flex items-center gap-2 px-3 py-1.5 bg-indigo-50 text-indigo-600 rounded-lg text-xs font-bold cursor-pointer hover:bg-indigo-100 transition-colors">
                  <Plus className="w-3.5 h-3.5" />
                  Add Document
                  <input 
                    type="file" 
                    className="hidden" 
                    multiple 
                    onChange={(e) => {
                      Array.from(e.target.files).forEach(file => addDocument(file));
                    }} 
                  />
                </label>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {formData.documents.map((doc, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-xl bg-white shadow-sm group hover:border-indigo-200 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-indigo-50 rounded-lg">
                        <FileUp className="w-4 h-4 text-indigo-500" />
                      </div>
                      <div className="max-w-[150px]">
                        <p className="text-sm font-medium text-gray-800 truncate">{doc.label || doc.file?.name || 'Document'}</p>
                        <p className="text-[10px] text-gray-500 uppercase tracking-wider">{doc.type || 'Other'}</p>
                      </div>
                    </div>
                    <button 
                      type="button"
                      onClick={() => removeDocument(index)}
                      className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}

                {formData.documents.length === 0 && (
                  <div className="col-span-full py-8 text-center border-2 border-dashed rounded-xl border-gray-100">
                    <FileUp className="w-8 h-8 text-gray-200 mx-auto mb-2" />
                    <p className="text-sm text-gray-400">No documents added yet</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-between items-center border-t pt-6 mt-4">
          <div className="flex gap-3">
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
          </div>

          <div className="flex gap-3">
            {activeTab !== 'personal' && (
              <Button type="button" variant="outline" onClick={handlePrevious} disabled={isSubmitting}>
                Previous
              </Button>
            )}
            
            {activeTab !== 'documents' ? (
              <Button type="button" onClick={handleNext} disabled={isSubmitting}>
                Next Step
              </Button>
            ) : (
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Saving...' : editingStudent ? 'Update Student' : 'Enroll Student'}
              </Button>
            )}
          </div>
        </div>
      </form>
    </Modal>
  );
};

export default StudentFormModal;
