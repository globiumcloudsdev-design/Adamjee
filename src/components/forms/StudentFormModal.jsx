'use client';

import React, { useState, useEffect } from 'react';
import Modal from '@/components/ui/modal';
import Input from '@/components/ui/input';
import PasswordInput from '@/components/ui/password-input';
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
  FileUp,
  Loader2,
  CheckCircle
} from 'lucide-react';
import { API_ENDPOINTS } from '@/constants/api-endpoints';
import { Label } from '../ui/label';

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
  const [fetchingTeachers, setFetchingTeachers] = useState({});

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
    nationality: 'Pakistan',
    cnic: '',
    address: { street: '', city: 'Karachi', state: 'Sindh', country: 'Pakistan' },
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
    father: { name: '', occupation: '', phone: '', email: '', cnic: '' },
    mother: { name: '', occupation: '', phone: '', email: '', cnic: '' },
    guardian: { name: '', relation: '', phone: '', email: '', cnic: '' },
    // Fees & Subjects
    admission_fee: 0,
    total_fee: 0,
    discount: 0,
    fee_mention: 'Monthly',
    payment_date: '10', // Default payment date
    subjects: [], // array of { id, name, fee }
    // Files
    profile_image: null,
    profile_preview: '',
    documents: [], // array of { file, type, label }
  });

  // Load Class-specific Sections and Subjects
  useEffect(() => {
    const fetchClassDetails = async () => {
      // If neither class_id nor group_id is set, clear everything
      if (!formData.class_id && !formData.group_id) {
        setSections([]);
        setSubjectsList([]);
        return;
      }
      try {
        if (formData.class_id) {
          const secRes = await apiClient.get(`/api/sections?class_id=${formData.class_id}`);
          const sectionsData = Array.isArray(secRes) ? secRes : [];
          setSections(sectionsData);

          // Auto-select section if only one exists
          if (sectionsData.length === 1 && !formData.section_id) {
            handleFieldChange('section_id', sectionsData[0].id || sectionsData[0]._id);
          }
        } else {
          setSections([]);
        }

        // Fetch subjects using either class_id or group_id to get common subjects
        const queryParams = new URLSearchParams();
        if (formData.class_id) queryParams.append('class_id', formData.class_id);
        if (formData.group_id) queryParams.append('group_id', formData.group_id);
        
        const subRes = await apiClient.get(`/api/subjects?${queryParams.toString()}`);
        const fetchedSubjects = Array.isArray(subRes) ? subRes : [];
        setSubjectsList(fetchedSubjects);

      } catch (err) {
        console.error("Error fetching section/subject data:", err);
      }
    };
    fetchClassDetails();
  }, [formData.class_id, formData.group_id]);

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
        date_of_birth: (editingStudent.details?.academic_info?.date_of_birth) ||
          (editingStudent.dateOfBirth ? new Date(editingStudent.dateOfBirth).toISOString().split('T')[0] :
            (editingStudent.date_of_birth ? new Date(editingStudent.date_of_birth).toISOString().split('T')[0] : '')),
        nationality: editingStudent.nationality || 'Pakistani',
        cnic: editingStudent.cnic || '',
        address: editingStudent.address || { street: '', city: 'Karachi', state: 'Sindh', country: 'Pakistan' },
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
        father: profile.father || { name: '', occupation: '', phone: '', email: '', cnic: '' },
        mother: profile.mother || { name: '', occupation: '', phone: '', email: '', cnic: '' },
        guardian: profile.guardian || { name: '', relation: '', phone: '', email: '', cnic: '' },
        // Admission fee check academic_info inside details carefully
        admission_fee: editingStudent.details?.academic_info?.admission_fee || profile.admission_fee || profile.admissionFee || 0,
        total_fee: editingStudent.details?.academic_info?.total_fee || profile.feeEstimate || profile.total_fee || profile.totalFee || 0,
        discount: editingStudent.details?.academic_info?.discount || profile.feeDiscount?.amount || profile.discount || 0,
        fee_mention: editingStudent.details?.academic_info?.fee_mention || profile.feeMention || profile.fee_mention || 'Monthly',
        use_subject_wise_fee: editingStudent.details?.academic_info?.use_subject_wise_fee || profile.use_subject_wise_fee || false,
        payment_date: editingStudent.details?.academic_info?.payment_date || profile.academic_info?.payment_date || profile.payment_date || '10',
        installment_count: profile.installmentCount || profile.installment_count || profile.installments || 1,
        subjects: profile.selectedSubjects || profile.subjects || editingStudent.details?.academic_info?.subjects || editingStudent.selectedSubjects || [],
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
        nationality: 'Pakistani',
        cnic: '',
        address: { street: '', city: 'Karachi', state: 'Sindh', country: 'Pakistan' },
        remarks: '',
        installment_count: 1,
        branch_id: '',
        academic_year_id: '',
        class_id: '',
        section_id: '',
        roll_no: '',
        registration_no: '',
        admission_date: new Date().toISOString().split('T')[0],
        date_of_birth: new Date().toISOString().split('T')[0],
        guardian_type: 'parent',
        father: { name: '', occupation: '', phone: '', email: '', cnic: '' },
        mother: { name: '', occupation: '', phone: '', email: '', cnic: '' },
        guardian: { name: '', relation: '', phone: '', email: '', cnic: '' },
        admission_fee: 0,
        discount: 0,
        total_fee: 0,
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

  const fetchTeacherForSubject = async (subjectId, sectionId) => {
    if (!subjectId || !sectionId) return;

    setFetchingTeachers(prev => ({ ...prev, [subjectId]: true }));
    try {
      const res = await apiClient.get(API_ENDPOINTS.BRANCH_ADMIN.TIMETABLES.LIST, {
        section_id: sectionId,
        class_id: formData.class_id,
        academic_year_id: formData.academic_year_id
      });

      if (res.success && (res.data?.length > 0 || res.timetable?.length > 0)) {
        const timetable = res.data?.[0] || res.timetable?.[0];
        const period = timetable.periods?.find(p => String(p.subjectId) === String(subjectId));

        if (period && period.teacherId) {
          const teacherRes = await apiClient.get(`${API_ENDPOINTS.BRANCH_ADMIN.TEACHERS.LIST}/${period.teacherId}`);
          if (teacherRes.success) {
            const teacher = teacherRes.data;
            const teacherName = `${teacher.first_name || ''} ${teacher.last_name || ''}`.trim();
            setFormData((prev) => ({
              ...prev,
              subjects: prev.subjects.map(s => String(s.id) === String(subjectId) ? { ...s, teacher_name: teacherName } : s)
            }));
            return;
          }
        }
      }

      setFormData((prev) => ({
        ...prev,
        subjects: prev.subjects.map(s => String(s.id) === String(subjectId) ? { ...s, teacher_name: 'Not Assigned' } : s)
      }));
    } catch (err) {
      console.error("Error fetching teacher:", err);
    } finally {
      setFetchingTeachers(prev => ({ ...prev, [subjectId]: false }));
    }
  };

  const handleSubjectFieldChange = async (subjectId, field, value) => {
    setFormData((prev) => ({
      ...prev,
      subjects: prev.subjects.map(s => String(s.id) === String(subjectId) ? { ...s, [field]: value } : s)
    }));

    if (field === 'section_id' && value) {
      fetchTeacherForSubject(subjectId, value);
    }
  };

  const handleSubjectToggle = (subject) => {
    setFormData((prev) => {
      const alreadySelected = prev.subjects.find(s => 
        String(s.id) === String(subject.id) || 
        (s.name && s.name.toLowerCase() === subject.name.toLowerCase()) ||
        (typeof s === 'string' && s.toLowerCase() === subject.name.toLowerCase())
      );
      if (alreadySelected) {
        return {
          ...prev,
          subjects: prev.subjects.filter(s => {
            const isMatch = String(s.id) === String(subject.id) || 
                            (s.name && s.name.toLowerCase() === subject.name.toLowerCase()) ||
                            (typeof s === 'string' && s.toLowerCase() === subject.name.toLowerCase());
            return !isMatch;
          })
        };
      } else {
        // Auto-select first section if available
        const defaultSection = sections.length > 0 ? sections[0].id : '';
        const newSubject = {
          id: subject.id,
          name: subject.name,
          fee: subject.fee || 0,
          section_id: defaultSection,
          teacher_name: ''
        };

        // If we auto-selected a section, fetch teacher for it immediately
        if (defaultSection) {
          setTimeout(() => fetchTeacherForSubject(subject.id, defaultSection), 0);
        }

        return {
          ...prev,
          subjects: [...prev.subjects, newSubject]
        };
      }
    });
  };

  const handleSubjectFeeChange = (subjectId, fee) => {
    handleSubjectFieldChange(subjectId, 'fee', Number(fee));
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

  const isEmail = (val) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(val);
  };

  const validateTab = (tabId) => {
    switch (tabId) {
      case 'personal':
        return (
          formData.first_name &&
          formData.last_name &&
          formData.email &&
          isEmail(formData.email) &&
          formData.phone &&
          (editingStudent || formData.password) &&
          formData.gender
        );
      case 'academic':
        return (
          formData.academic_year_id &&
          formData.group_id &&
          formData.class_id
        );
      case 'parent':
        const parentValid = formData.guardian_type === 'parent'
          ? (formData.father.name && formData.father.phone)
          : (formData.guardian.name && formData.guardian.relation && formData.guardian.phone);

        return parentValid;
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

    if (!validateTab('personal') || !validateTab('academic') || !validateTab('parent')) {
      toast.error('Please fill all required fields in all tabs');
      return;
    }

    const subjectsTotal = formData.subjects.reduce((acc, sub) => acc + (sub.fee || 0), 0);
    let calculatedEstimate = subjectsTotal - Number(formData.discount);

    if (formData.fee_mention === 'LumpSum') {
      calculatedEstimate = (subjectsTotal * getAcademicMonths()) - Number(formData.discount);
    } else if (formData.fee_mention === 'Installment' && formData.installment_count > 0) {
      calculatedEstimate = Math.round(((subjectsTotal * getAcademicMonths()) - Number(formData.discount)) / formData.installment_count);
    }

    // Calculate dynamic fee base
    const finalMonthlyFee = formData.fee_mention === 'Monthly' && formData.use_subject_wise_fee
      ? formData.subjects.reduce((sum, s) => sum + (Number(s.fee) || 0), 0)
      : Number(formData.total_fee);

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
      // Section is now per subject, but we might need a default one
      section_id: formData.subjects[0]?.section_id || '',
      subjects: formData.subjects,
      admission_fee: Number(formData.admission_fee),
      discount: Number(formData.discount),
      total_fee: finalMonthlyFee,
      payment_date: formData.payment_date,
      registration_no: formData.registration_no,
      roll_no: formData.roll_no,
      academic_info: {
        admission_fee: Number(formData.admission_fee),
        gender: formData.gender,
        date_of_birth: formData.date_of_birth,
        admission_date: formData.admission_date,
        nationality: formData.nationality,
        cnic: formData.cnic,
        address: formData.address,
        remarks: formData.remarks,
        father: formData.father,
        mother: formData.mother,
        guardian: formData.guardian,
        guardian_type: formData.guardian_type,
        fee_mention: formData.fee_mention,
        fee_type: formData.fee_mention,
        group_id: formData.group_id,
        class_id: formData.class_id,
        section_id: formData.subjects[0]?.section_id || formData.section_id,
        installment_count: formData.installment_count,
        fee_estimate: finalMonthlyFee,
        total_fee: finalMonthlyFee,
        discount: Number(formData.discount),
        payment_date: formData.payment_date,
        roll_no: formData.roll_no,
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
              className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === tab.id
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input label="Account Access Email" type="email" value={formData.email} onChange={(e) => handleFieldChange('email', e.target.value)} placeholder="Access@example.com" required />
              <PhoneInput label="Phone" value={formData.phone} onChange={(val) => handleFieldChange('phone', val)} required hideDescription />
            </div>

            {!editingStudent && (
              <PasswordInput
                label="Password"
                value={formData.password}
                onChange={(e) => handleFieldChange('password', e.target.value)}
                required
              />
            )}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Dropdown
                label="Gender"
                value={formData.gender}
                onChange={(e) => handleFieldChange('gender', e.target.value)}
                options={[
                  { value: 'male', label: 'Male' },
                  { value: 'female', label: 'Female' },
                ]}
                placeholder="Select Gender"
                required
              />
              {/* <DatePicker
                label="Date of Birth"
                value={formData.date_of_birth}
                onChange={(e) => handleFieldChange('date_of_birth', e.target.value)}
                placeholder="Select DOB"
                required
              /> */}
              <Input label="Nationality" value={formData.nationality} onChange={(e) => handleFieldChange('nationality', e.target.value)} placeholder="Pakistani" />
              <CNICInput label="CNIC / B-Form" value={formData.cnic} onChange={(val) => handleFieldChange('cnic', val)} hideDescription placeholder="XXXXX-XXXXXXX-X" />
            </div>
            {/* <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            </div> */}
            <div className="border-t pt-4">
              <h4 className="font-medium text-gray-700 mb-2">Address Details</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input label="Street" value={formData.address.street} onChange={(e) => handleNestedFieldChange('address', 'street', e.target.value)} placeholder="Street address" />
                <Input label="City" value={formData.address.city} onChange={(e) => handleNestedFieldChange('address', 'city', e.target.value)} placeholder="City name" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-2">
                <Input label="State" value={formData.address.state} onChange={(e) => handleNestedFieldChange('address', 'state', e.target.value)} placeholder="Province" />
                <Input label="Country" value={formData.address.country} onChange={(e) => handleNestedFieldChange('address', 'country', e.target.value)} placeholder="Pakistan" />
              </div>
            </div>
          </div>
        )}

        {/* Academic Tab */}
        {activeTab === 'academic' && (
          <div className="space-y-4">
            <div className={`grid grid-cols-1 md:grid-cols-2 gap-6`}>
              {userRole !== 'BRANCH_ADMIN' ? (
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
              ) : (
                <Dropdown
                  label="Academic Year"
                  required={true}
                  value={formData.academic_year_id}
                  onChange={(e) => handleFieldChange('academic_year_id', e.target.value)}
                  options={[
                    { value: '', label: 'Select Year' },
                    ...academicYears.map((y) => ({ value: y.id || y._id, label: y.name })),
                  ]}
                />
              )}
              {userRole !== 'BRANCH_ADMIN' && (
                <Dropdown
                  label="Academic Year"
                  required={true}
                  value={formData.academic_year_id}
                  onChange={(e) => handleFieldChange('academic_year_id', e.target.value)}
                  options={[
                    { value: '', label: 'Select Year' },
                    ...academicYears.map((y) => ({ value: y.id || y._id, label: y.name })),
                  ]}
                />
              )}
              {userRole === 'BRANCH_ADMIN' && (
                <div className="hidden md:block"></div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
            </div>

            <div className={`grid grid-cols-1 ${editingStudent ? 'md:grid-cols-2' : ''} gap-6`}>
              {editingStudent && (
                <Input
                  label="GR No"
                  value={formData.roll_no}
                  onChange={(e) => handleFieldChange('roll_no', e.target.value)}
                  placeholder="Enter GR No"
                />
              )}
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

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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

                {/* Regular Total Fee Input for non-monthly modes */}
                {formData.fee_mention !== 'Monthly' && (
                  <Input
                    label="Total Fee Amount"
                    type="number"
                    value={formData.total_fee || ''}
                    onChange={(e) => handleFieldChange('total_fee', Number(e.target.value))}
                    placeholder="Enter total amount"
                    required
                  />
                )}

                <div className="space-y-1">
                  <Input
                    label="Payment Day (Max 25)"
                    type="number"
                    min="1"
                    max="25"
                    value={formData.payment_date || ''}
                    onChange={(e) => {
                      const val = parseInt(e.target.value);
                      if (val > 25) {
                        toast.warning('Payment day cannot exceed 25 to avoid issues in shorter months (e.g. Feb)');
                      }
                      handleFieldChange('payment_date', e.target.value);
                    }}
                    placeholder="e.g. 10"
                    error={parseInt(formData.payment_date) > 25 ? "Max day is 25" : null}
                  />
                  {parseInt(formData.payment_date) > 25 && (
                    <p className="text-[10px] text-orange-500 font-bold ml-1 italic leading-tight">Max 25 for short months.</p>
                  )}
                </div>
              </div>

              {/* Summary Section for Non-Monthly modes */}
              {formData.fee_mention !== 'Monthly' && (
                <div className="mt-2 pt-3 border-t border-slate-200 flex items-center justify-between bg-slate-50 p-4 rounded-xl shadow-sm">
                  <div className="flex flex-col">
                    <span className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">Total Payable Amount</span>
                    <span className="text-xs text-slate-400">Total ({formData.total_fee || 0}) - Discount ({formData.discount || 0})</span>
                  </div>
                  <div className="text-right">
                    <span className="text-2xl font-black text-slate-900">
                      Rs. {(Number(formData.total_fee || 0) - Number(formData.discount || 0)).toLocaleString()}
                    </span>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input label="Discount (Amount)" type="number" value={formData.discount || ''} onChange={(e) => handleFieldChange('discount', Number(e.target.value))} />
                {formData.fee_mention === 'Installment' && (
                  <Input
                    label="Installment Count"
                    type="number"
                    min="1"
                    value={formData.installment_count || 1}
                    onChange={(e) => handleFieldChange('installment_count', Number(e.target.value))}
                  />
                )}
              </div>

              {/* Admission & Monthly Fee Section (ONLY for Monthly Mode) */}
              {formData.fee_mention === 'Monthly' && (
                <div className="space-y-6">
                  <div className="flex items-center gap-4 bg-blue-50/50 p-4 rounded-xl border border-blue-100">
                    <Label className="text-sm font-bold text-blue-800">Fee Calculation Mode:</Label>
                    <div className="flex gap-4">
                      <label className="flex items-center gap-2 cursor-pointer group">
                        <input
                          type="radio"
                          name="fee_mode"
                          checked={!formData.use_subject_wise_fee}
                          onChange={() => handleFieldChange('use_subject_wise_fee', false)}
                          className="w-4 h-4 text-primary focus:ring-primary border-gray-300"
                        />
                        <span className="text-sm font-medium text-gray-700 group-hover:text-primary transition-colors">Fixed Amount (Standard)</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer group">
                        <input
                          type="radio"
                          name="fee_mode"
                          checked={!!formData.use_subject_wise_fee}
                          onChange={() => handleFieldChange('use_subject_wise_fee', true)}
                          className="w-4 h-4 text-primary focus:ring-primary border-gray-300"
                        />
                        <span className="text-sm font-medium text-gray-700 group-hover:text-primary transition-colors">Subject-wise (Automatic)</span>
                      </label>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-5 rounded-2xl bg-slate-50 border border-slate-200 shadow-sm transition-all">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 mb-1">
                        <Plus className="w-4 h-4 text-emerald-600" />
                        <Label className="text-sm font-bold text-slate-700 italic">Admission + Test Fee</Label>
                      </div>
                      <Input
                        placeholder="e.g. 2000"
                        type="number"
                        value={formData.admission_fee || ''}
                        onChange={(e) => handleFieldChange('admission_fee', Number(e.target.value))}
                        className="h-11 rounded-xl bg-white border-slate-200 focus:ring-emerald-500/20 focus:border-emerald-500"
                      />
                      <p className="text-[10px] text-slate-400 font-medium ml-1 italic leading-tight">* One-time charges (Admission, Registration, Test)</p>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center gap-2 mb-1">
                        <CreditCard className="w-4 h-4 text-indigo-600" />
                        <Label className="text-sm font-bold text-slate-700 italic">Monthly Tuition Fee</Label>
                      </div>
                      {formData.use_subject_wise_fee ? (
                        <div className="h-11 flex items-center px-4 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-700 font-bold">
                          Rs. {formData.subjects.reduce((sum, s) => sum + (Number(s.fee) || 0), 0).toLocaleString()}
                          <span className="ml-2 text-[10px] text-indigo-500 font-normal">(Calculated from {formData.subjects.length} subjects)</span>
                        </div>
                      ) : (
                        <Input
                          placeholder="e.g. 7500"
                          type="number"
                          value={formData.total_fee || ''}
                          onChange={(e) => handleFieldChange('total_fee', Number(e.target.value))}
                          className="h-11 rounded-xl bg-white border-slate-200 focus:ring-indigo-500/20 focus:border-indigo-500"
                          required
                        />
                      )}
                      <p className="text-[10px] text-slate-400 font-medium ml-1 italic leading-tight">
                        {formData.use_subject_wise_fee ? "* Sum of selected subject fees" : "* Custom monthly tuition fee"}
                      </p>
                    </div>

                    <div className="md:col-span-2 mt-2 pt-3 border-t border-slate-200 flex items-center justify-between bg-white/50 p-4 rounded-xl">
                      <div className="flex flex-col">
                        <span className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">First Month Total Bill</span>
                        <span className="text-xs text-slate-400">
                          {formData.use_subject_wise_fee ? 'Subjects Total' : 'Monthly'} ({
                            formData.use_subject_wise_fee
                              ? formData.subjects.reduce((sum, s) => sum + (Number(s.fee) || 0), 0)
                              : (formData.total_fee || 0)
                          }) + Admission/Test ({formData.admission_fee || 0}) - Discount ({formData.discount || 0})
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-2xl font-black text-slate-900">
                          Rs. {(
                            (formData.use_subject_wise_fee
                              ? formData.subjects.reduce((sum, s) => sum + (Number(s.fee) || 0), 0)
                              : Number(formData.total_fee || 0)
                            ) + Number(formData.admission_fee || 0) - Number(formData.discount || 0)
                          ).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="border-t pt-4">
                <h4 className="font-medium text-gray-700 mb-2">Subject Selection</h4>
                {!formData.class_id && !formData.group_id ? (
                  <p className="text-sm text-gray-500 italic">Please select a Group or Class first to view available subjects.</p>
                ) : subjectsList.length === 0 ? (
                  <p className="text-sm text-gray-500 italic">No subjects defined.</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-2 border rounded-md">
                    {subjectsList.map((sub) => {
                      const isMatch = (s) => String(s.id) === String(sub.id) || (s.name && s.name.toLowerCase() === sub.name.toLowerCase()) || (typeof s === 'string' && s.toLowerCase() === sub.name.toLowerCase());
                      const isChecked = formData.subjects.some(isMatch);
                      const currentSelected = formData.subjects.find(isMatch);

                      return (
                        <div
                          key={sub.id}
                          className={`flex flex-col p-4 border-2 rounded-2xl transition-all duration-300 ${isChecked
                              ? 'border-blue-500 bg-blue-50/30 shadow-md ring-4 ring-blue-500/5'
                              : 'border-gray-100 bg-gray-50 hover:border-gray-200 hover:bg-white'
                            }`}
                        >
                          <div className="flex items-center justify-between">
                            <label className="flex items-center space-x-4 cursor-pointer w-full">
                              <div className={`relative flex items-center justify-center w-6 h-6 rounded-full border-2 transition-colors ${isChecked ? 'border-blue-600 bg-blue-600' : 'border-gray-300 bg-white'
                                }`}>
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={() => handleSubjectToggle(sub)}
                                  className="absolute opacity-0 w-full h-full cursor-pointer"
                                />
                                {isChecked && <CheckCircle className="w-4 h-4 text-white" />}
                              </div>
                              <div className="flex-1">
                                <p className={`font-bold transition-colors ${isChecked ? 'text-blue-700' : 'text-gray-700'}`}>
                                  {sub.name} {sub.is_applicable_for_all_groups && <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded ml-1">(All Group)</span>}
                                </p>
                                {sub.subject_code && (
                                  <p className="text-[10px] uppercase tracking-tighter text-gray-400 font-mono">
                                    Code: {sub.subject_code}
                                  </p>
                                )}
                              </div>
                              {sub.fee > 0 && (
                                <div className="text-right">
                                  <p className="text-xs text-gray-400 uppercase font-bold">Fee</p>
                                  <p className="font-black text-gray-700">Rs. {sub.fee}</p>
                                </div>
                              )}
                            </label>
                          </div>

                          {isChecked && (
                            <div className="mt-4 pt-4 border-t border-blue-100/50 space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                              <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1">
                                  <Label className="text-[10px] uppercase text-blue-600 font-bold ml-1">Section</Label>
                                  <Dropdown
                                    value={currentSelected?.section_id || ''}
                                    onChange={(e) => handleSubjectFieldChange(sub.id, 'section_id', e.target.value)}
                                    options={[
                                      { value: '', label: 'Select' },
                                      ...sections.map(sec => ({ value: sec.id, label: sec.name }))
                                    ]}
                                    buttonClassName="h-9 text-xs rounded-xl border-blue-200"
                                    hideDescription
                                  />
                                </div>
                                {!formData.use_subject_wise_fee && (
                                  <div className="space-y-1">
                                    <Label className="text-[10px] uppercase text-blue-600 font-bold ml-1">Manual Subject Fee</Label>
                                    <Input
                                      type="number"
                                      value={currentSelected?.fee || ''}
                                      onChange={(e) => handleSubjectFeeChange(sub.id, e.target.value)}
                                      className="h-9 text-xs rounded-xl border-blue-200"
                                      placeholder="e.g. 2000"
                                      hideDescription
                                    />
                                  </div>
                                )}
                              </div>

                              {fetchingTeachers[sub.id] ? (
                                <div className="flex items-center gap-2 px-3 py-2 bg-white/50 border border-blue-100 rounded-xl text-[10px] text-blue-500 font-medium italic animate-pulse">
                                  <Loader2 className="w-3 h-3 animate-spin" />
                                  Looking for teacher...
                                </div>
                              ) : currentSelected?.teacher_name && (
                                <div className="flex items-center gap-2 px-3 py-2 bg-white border border-blue-200 rounded-xl text-[11px] text-blue-700 font-bold shadow-sm">
                                  <div className="p-1 bg-blue-100 rounded-lg">
                                    <User className="w-3 h-3" />
                                  </div>
                                  <span>Teacher: {currentSelected.teacher_name}</span>
                                </div>
                              )}
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
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <CNICInput label="CNIC" value={formData.father.cnic} onChange={(val) => handleNestedFieldChange('father', 'cnic', val)} hideDescription placeholder="XXXXX-XXXXXXX-X" />
                    <Input label="Occupation" value={formData.father.occupation} onChange={(e) => handleNestedFieldChange('father', 'occupation', e.target.value)} placeholder="e.g. Businessman" />
                  </div>
                </div>
              </>
            ) : (
              <div className="border-t pt-4">
                <h4 className="font-medium text-gray-700 mb-2">Guardian Info</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Input label="Name" value={formData.guardian.name} onChange={(e) => handleNestedFieldChange('guardian', 'name', e.target.value)} placeholder="Guardian's name" required={formData.guardian_type !== 'parent'} />
                  <Input label="Relation" value={formData.guardian.relation} onChange={(e) => handleNestedFieldChange('guardian', 'relation', e.target.value)} placeholder="e.g. Uncle" required={formData.guardian_type !== 'parent'} />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                  <PhoneInput label="Phone" value={formData.guardian.phone} onChange={(val) => handleNestedFieldChange('guardian', 'phone', val)} required={formData.guardian_type !== 'parent'} hideDescription placeholder="3XX XXXXXXX" />
                  <CNICInput label="CNIC" value={formData.guardian.cnic} onChange={(val) => handleNestedFieldChange('guardian', 'cnic', val)} hideDescription placeholder="XXXXX-XXXXXXX-X" />
                </div>
              </div>
            )}
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

            {activeTab !== tabs[tabs.length - 1].id ? (
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
