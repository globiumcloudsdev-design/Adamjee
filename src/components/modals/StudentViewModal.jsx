'use client';

import React, { useState, useEffect } from 'react';
import Modal from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import {
  User,
  Mail,
  Phone,
  Calendar,
  MapPin,
  GraduationCap,
  Users,
  Heart,
  FileText,
  Download,
  Eye,
  Printer,
  Globe,
  Home,
  Briefcase,
  Shield,
  Activity,
  Building,
  Award,
  CreditCard,
  CheckCircle,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { format } from 'date-fns';
import apiClient from '@/lib/api-client';
import { API_ENDPOINTS } from '@/constants/api-endpoints';
import { toast } from 'sonner';
import IDCardViewer from '@/components/common/IDCard';
import { Badge } from '@/components/ui/badge';


const StudentViewModal = ({
  isOpen,
  onClose,
  student,
  branches = [],
  classes = [],
  departments = [],
  academicYears = [],
  groups = [],
}) => {
  const [activeTab, setActiveTab] = useState('personal');
  const [loading, setLoading] = useState(false);
  const [qrCode, setQrCode] = useState(null);
  const [sections, setSections] = useState([]);

  // Load QR code and Sections
  useEffect(() => {
    if (student && isOpen) {
      if (student.studentProfile?.qr?.url) {
        setQrCode(student.studentProfile.qr.url);
      }
      
      const fetchSections = async () => {
        try {
          const classId = student.details?.academic_info?.class_id;
          if (classId) {
            const response = await apiClient.get(`/api/sections?class_id=${classId}`);
            setSections(Array.isArray(response) ? response : []);
          }
        } catch (error) {
          console.error('Error fetching sections:', error);
        }
      };
      
      fetchSections();
    } else {
      setQrCode(null);
    }
  }, [student, isOpen]);

  if (!student) return null;

  // --- Normalize: Support both PostgreSQL snake_case and legacy camelCase ---
  const s = {
    firstName: student.firstName || student.first_name || '',
    lastName: student.lastName || student.last_name || '',
    email: student.email || '',
    phone: student.phone || '',
    gender: student.gender || student.details?.academic_info?.gender || '',
    dateOfBirth: student.dateOfBirth || student.details?.academic_info?.date_of_birth || '',
    nationality: student.nationality || student.details?.academic_info?.nationality || '',
    cnic: student.cnic || student.details?.academic_info?.cnic || '',
    address: student.address || student.details?.academic_info?.address || {},
    status: student.status || (student.is_active ? 'active' : 'inactive'),
    isActive: student.isActive ?? student.is_active ?? true,
    remarks: student.remarks || student.details?.academic_info?.remarks || '',
    branchId: student.branchId || student.branch_id,
    registrationNo: student.registration_no || student.studentProfile?.registrationNumber || '',
    profilePhoto: student.profilePhoto || (student.avatar_url ? { url: student.avatar_url } : null),
    qrCodeUrl: student.qr_code_url || student.studentProfile?.qr?.url || null,
    // Academic info (support both formats)
    studentProfile: student.studentProfile || {
      classId: student.details?.academic_info?.class_id || '',
      section: student.details?.academic_info?.section_id || '',
      groupId: student.details?.academic_info?.group_id || '',
      rollNumber: student.details?.academic_info?.roll_no || '',
      admissionDate: student.details?.academic_info?.admission_date || '',
      academicYear: student.details?.academic_info?.academic_year_id || '',
      father: student.details?.academic_info?.father || {},
      guardian: student.details?.academic_info?.guardian || {},
      guardianType: student.details?.academic_info?.guardian_type || 'parent',
      feeDiscount: student.details?.academic_info?.fee_discount || {},
      documents: student.details?.documents || student.documents || [],
      feeMention: student.details?.academic_info?.fee_mention || 'Monthly',
      installmentCount: student.details?.academic_info?.installment_count || 1,
      totalFee: student.details?.academic_info?.total_fee || 0,
      payableFee: student.details?.academic_info?.payable_fee || 0,
      discount: student.details?.academic_info?.discount || 0,
      subjects: student.details?.academic_info?.subjects || [],
      admissionFee: student.details?.academic_info?.admission_fee || 0,
    }
  };

  // Helper functions
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return format(new Date(dateString), 'dd MMM yyyy');
    } catch {
      return dateString;
    }
  };

  const getClassName = () => {
    const classId = s.studentProfile?.classId?._id || s.studentProfile?.classId;
    return classes.find(c => c.id === classId || c._id === classId)?.name || 'N/A';
  };

  const getSectionName = () => {
    const sectionId = s.studentProfile?.section;
    if (!sectionId) return 'N/A';
    const section = sections.find(sec => sec.id === sectionId || sec._id === sectionId);
    return section?.name || sectionId;
  };

  const getBranchName = () => {
    if (student.branch?.name) return student.branch.name;
    const branchId = s.branchId?._id || s.branchId;
    return branches.find(b => b.id === branchId || b._id === branchId)?.name || 'N/A';
  };
  
  const getAcademicYearName = () => {
    const yearId = s.studentProfile?.academicYear;
    if (!yearId) return 'N/A';
    const year = academicYears.find(y => y.id === yearId || y._id === yearId);
    return year?.name || yearId;
  };

  const getGroupName = () => {
    const groupId = s.studentProfile?.groupId;
    if (!groupId) return 'N/A';
    const group = groups.find(g => g.id === groupId || g._id === groupId);
    return group?.name || groupId;
  };

  const tabs = [
    { id: 'personal', label: 'Personal', icon: User },
    { id: 'academic', label: 'Academic & Fees', icon: GraduationCap },
    { id: 'parent', label: 'Family', icon: Users },
    { id: 'documents', label: 'Documents', icon: FileText },
    { id: 'idcard', label: 'ID Card', icon: CreditCard },
  ];

  // Render content based on active tab
  const renderTabContent = () => {
    switch (activeTab) {
      case 'personal':
        return renderPersonalInfo();
      case 'academic':
        return renderAcademicInfo();
      case 'parent':
        return renderParentInfo();
      case 'documents':
        return renderDocuments();
      case 'idcard':
        return renderIDCard();
      default:
        return renderPersonalInfo();
    }
  };

  const renderIDCard = () => {
    // Map 's' (normalized data) to the format expected by IDCardViewer
    const studentData = {
      full_name: `${s.firstName} ${s.lastName}`,
      parent_name: s.studentProfile?.father?.name || s.studentProfile?.guardian?.name || 'N/A',
      roll_number: s.studentProfile?.rollNumber || 'N/A',
      registration_no: s.registrationNo || 'N/A',
      class: getClassName(),
      section: getSectionName(),
      section_name: getSectionName(),
      branch_name: getBranchName(),
      shift: s.studentProfile?.shift || 'Morning',
      blood_group: s.bloodGroup || 'O+',
      valid_upto: 'AUG 2026',
      photo_url: s.profilePhoto?.url,
      qr_code_url: s.qrCodeUrl,
      avatar_url: s.gender?.toLowerCase() === 'female' ? '/assets/avatar-female.svg' : '/assets/avatar-male.svg',
      gender: s.gender
    };

    const institute = {
      name: getBranchName(),
      logo_url: "/logo.png", // Corrected path
      address: student.branch?.address || "City Branch, Pakistan",
      phone: student.branch?.phone || "+92 123 4567890",
      email: student.branch?.email || "info@adamjee.edu.pk"
    };

    return (
      <div className="flex justify-center py-4 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
        <IDCardViewer studentData={studentData} institute={institute} />
      </div>
    );
  };

  const renderPersonalInfo = () => (
    <div className="space-y-6">
      {/* Personal Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <User className="w-4 h-4 text-gray-500" />
            <h4 className="font-medium text-gray-700">Personal Details</h4>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-gray-500">Full Name</span>
              <span className="font-medium">{s.firstName} {s.lastName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-500">Gender</span>
              <span className="font-medium capitalize">{s.gender}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-500">Date of Birth</span>
              <span className="font-medium">{formatDate(s.dateOfBirth)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-500">Nationality</span>
              <span className="font-medium">{s.nationality || 'Pakistani'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-500">CNIC/B-Form</span>
              <span className="font-medium">{s.cnic || 'N/A'}</span>
            </div>
          </div>
        </div>

        {/* Contact Information */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <Mail className="w-4 h-4 text-gray-500" />
            <h4 className="font-medium text-gray-700">Contact Information</h4>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-gray-500">Account Access Email</span>
              <span className="font-medium">{s.email || 'N/A'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-500">Phone</span>
              <span className="font-medium">{s.phone || 'N/A'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Address & Remarks */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <MapPin className="w-4 h-4 text-gray-500" />
            <h4 className="font-medium text-gray-700">Address Information</h4>
          </div>
          <div className="space-y-2 text-sm">
            <p className="text-gray-900 font-medium">{s.address?.street || 'N/A'}</p>
            <p className="text-gray-600">{s.address?.city}, {s.address?.state} {s.address?.postalCode}</p>
            <p className="text-gray-500">{s.address?.country}</p>
          </div>
        </div>
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <FileText className="w-4 h-4 text-gray-500" />
            <h4 className="font-medium text-gray-700">Remarks / Extra Info</h4>
          </div>
          <p className="text-sm text-gray-600 italic">
            {s.remarks || 'No additional remarks.'}
          </p>
        </div>
      </div>

      {/* Status Information */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <Activity className="w-4 h-4 text-gray-500" />
            <h4 className="font-medium text-gray-700">Status Information</h4>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-gray-500">Status</span>
              <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                s.status === 'active' ? 'bg-green-100 text-green-700' :
                s.status === 'inactive' ? 'bg-gray-100 text-gray-700' :
                s.status === 'graduated' ? 'bg-blue-100 text-blue-700' :
                'bg-yellow-100 text-yellow-700'
              }`}>
                {s.status}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-500">Account Status</span>
              <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                s.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
              }`}>
                {s.isActive ? 'Active' : 'Inactive'}
              </span>
            </div>
          </div>
        </div>

        {/* Branch Information */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <Building className="w-4 h-4 text-gray-500" />
            <h4 className="font-medium text-gray-700">Branch Information</h4>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-gray-500">Branch</span>
              <span className="font-medium">{getBranchName()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-500">GR No.</span>
              <span className="font-medium font-mono">
                {s.studentProfile?.rollNumber || 'N/A'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-500">Admission Date</span>
              <span className="font-medium">
                {formatDate(s.studentProfile?.admissionDate)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderAcademicInfo = () => (
    <div className="space-y-6">
      {/* Current Academic Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <GraduationCap className="w-4 h-4 text-gray-500" />
            <h4 className="font-medium text-gray-700">Academic Status</h4>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-gray-500">Class</span>
              <span className="font-bold text-blue-600">{getClassName()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-500">Group</span>
              <span className="font-medium">{getGroupName()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-500">GR No</span>
              <span className="font-bold font-mono px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs">{s.studentProfile?.rollNumber || 'N/A'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-500">Academic Year</span>
              <span className="font-medium">{getAcademicYearName()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-500">Admission Date</span>
              <span className="font-medium">{formatDate(s.studentProfile?.admissionDate)}</span>
            </div>
          </div>
        </div>
        
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <CreditCard className="w-4 h-4 text-gray-500" />
            <h4 className="font-medium text-gray-700">Fee Agreement</h4>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-gray-500">Fee Mention</span>
              <span className="font-bold text-indigo-600">{s.studentProfile?.feeMention}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-500">Admission Fee</span>
              <span className="font-medium">{s.studentProfile?.admissionFee?.toLocaleString() || 0} PKR</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-500">Payment Day</span>
              <span className="font-medium">Every {student.details?.academic_info?.payment_date || '10'}th of month</span>
            </div>
            {s.studentProfile?.feeMention === 'Installment' && (
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Total Installments</span>
                <span className="font-medium">{s.studentProfile?.installmentCount || 1}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-sm text-gray-500">Agreement Total</span>
              <span className="font-medium">{s.studentProfile?.totalFee?.toLocaleString()} PKR</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-500">Total Discount</span>
              <span className="font-medium text-red-500">-{s.studentProfile?.discount?.toLocaleString()} PKR</span>
            </div>
            <div className="pt-2 mt-2 border-t flex justify-between items-center">
              <span className="text-xs font-bold uppercase text-gray-400">Net Payable</span>
              <span className="font-black text-lg text-emerald-600">
                {((s.studentProfile?.totalFee || 0) - (s.studentProfile?.discount || 0)).toLocaleString()} PKR
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Selected Subjects Table */}
      <div className="bg-gray-50 p-4 rounded-xl">
        <div className="flex items-center gap-2 mb-4">
          <FileText className="w-4 h-4 text-gray-500" />
          <h4 className="font-medium text-gray-700">Enrolled Subjects & Teachers</h4>
        </div>
        <div className="grid grid-cols-1 gap-3">
          {s.studentProfile?.subjects?.map((sub, idx) => (
            <div key={idx} className="flex flex-col md:flex-row md:items-center justify-between p-4 bg-white border border-gray-100 rounded-xl shadow-sm hover:shadow-md transition-shadow">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-gray-900">{sub.name}</span>
                  {sub.subject_code && <span className="text-[10px] font-mono bg-gray-100 px-1.5 rounded text-gray-500">{sub.subject_code}</span>}
                </div>
                <div className="flex items-center gap-4 mt-1">
                  <div className="flex items-center gap-1 text-[11px] text-indigo-600 font-bold uppercase">
                    <Building className="w-3 h-3" />
                    Section: {sections.find(sec => sec.id === sub.section_id || sec._id === sub.section_id)?.name || 'Not Assigned'}
                  </div>
                  <div className="flex items-center gap-1 text-[11px] text-emerald-600 font-bold uppercase">
                    <User className="w-3 h-3" />
                    Teacher: {sub.teacher_name || 'Not Assigned'}
                  </div>
                </div>
              </div>
              <div className="text-right mt-2 md:mt-0">
                <span className="text-sm font-bold text-gray-400">Fee:</span>
                <span className="ml-2 font-black text-gray-700">Rs. {sub.fee?.toLocaleString()}</span>
              </div>
            </div>
          ))}
          {(!s.studentProfile?.subjects || s.studentProfile.subjects.length === 0) && (
            <div className="text-center py-6 text-gray-400 italic text-sm">No subjects selected</div>
          )}
        </div>
      </div>
    </div>
  );

  const renderParentInfo = () => {
    const guardianType = s.studentProfile?.guardianType || 'parent';
    const father = s.studentProfile?.father || {};
    const guardian = s.studentProfile?.guardian || {};

    return (
      <div className="space-y-6">
        {/* Guardian Type Indicator */}
        <div className="flex justify-center mb-2">
          <Badge className={`px-6 py-2 text-sm uppercase tracking-widest font-black ${guardianType === 'parent' ? 'bg-blue-600' : 'bg-purple-600'}`}>
            {guardianType === 'parent' ? 'Parent Details' : 'Guardian Details'}
          </Badge>
        </div>

        {guardianType === 'parent' ? (
          <div className="max-w-2xl mx-auto">
            {/* Father Information */}
            <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100 shadow-sm">
              <div className="flex items-center gap-3 mb-6 border-b pb-4">
                <div className="p-2 bg-blue-100 rounded-xl">
                  <User className="w-5 h-5 text-blue-600" />
                </div>
                <h4 className="font-bold text-gray-800">Father Details</h4>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex flex-col">
                    <span className="text-[10px] uppercase font-bold text-gray-400">Full Name</span>
                    <span className="font-bold text-gray-900">{father.name || 'N/A'}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] uppercase font-bold text-gray-400">Occupation</span>
                    <span className="font-medium text-gray-700">{father.occupation || 'N/A'}</span>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex flex-col">
                    <span className="text-[10px] uppercase font-bold text-gray-400">Phone Number</span>
                    <span className="font-bold text-blue-600">{father.phone || 'N/A'}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] uppercase font-bold text-gray-400">CNIC Number</span>
                    <span className="font-medium text-gray-700">{father.cnic || 'N/A'}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Guardian Information */
          <div className="bg-gray-50 p-6 rounded-2xl border border-purple-100 shadow-sm max-w-2xl mx-auto">
            <div className="flex items-center gap-3 mb-6 border-b pb-4">
              <div className="p-2 bg-purple-100 rounded-xl">
                <Shield className="w-5 h-5 text-purple-600" />
              </div>
              <h4 className="font-bold text-gray-800">Guardian Information</h4>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex flex-col">
                  <span className="text-[10px] uppercase font-bold text-gray-400">Guardian Name</span>
                  <span className="font-bold text-gray-900">{guardian.name || 'N/A'}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] uppercase font-bold text-gray-400">Relationship</span>
                  <span className="font-bold text-purple-600 capitalize">{guardian.relation || 'N/A'}</span>
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex flex-col">
                  <span className="text-[10px] uppercase font-bold text-gray-400">Phone Number</span>
                  <span className="font-bold text-gray-900">{guardian.phone || 'N/A'}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] uppercase font-bold text-gray-400">CNIC / ID Card</span>
                  <span className="font-medium text-gray-700">{guardian.cnic || 'N/A'}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderDocuments = () => (
    <div className="space-y-6">
      {/* Document List */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-gray-500" />
            <h4 className="font-medium text-gray-700">Documents</h4>
          </div>
          <span className="text-sm text-gray-500">
            {s.studentProfile?.documents?.length || 0} document(s)
          </span>
        </div>

        {s.studentProfile?.documents?.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {s.studentProfile.documents.map((doc, index) => (
              <div
                key={doc._id || index}
                className="bg-white p-4 rounded-lg border hover:shadow-md transition-shadow"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <FileText className="w-6 h-6 text-blue-600" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {doc.name || doc.type.replace('_', ' ')}
                    </p>
                    <p className="text-xs text-gray-500 capitalize mt-1">
                      {(doc.type === 'other' ? doc.name : doc.type).replace('_', ' ')}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      {doc.uploadedAt ? formatDate(doc.uploadedAt) : 'Recent'}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <a
                    href={doc.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 px-3 py-2 text-sm text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-md transition-colors text-center"
                  >
                    <Eye className="w-4 h-4 inline mr-1" />
                    View
                  </a>
                  <a
                    href={doc.url}
                    download
                    className="flex-1 px-3 py-2 text-sm text-green-600 hover:text-green-700 hover:bg-green-50 rounded-md transition-colors text-center"
                  >
                    <Download className="w-4 h-4 inline mr-1" />
                    Download
                  </a>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No documents uploaded</p>
          </div>
        )}
      </div>

      {/* QR Code */}
      {qrCode && (
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="flex items-center gap-2 mb-4">
            <Award className="w-4 h-4 text-gray-500" />
            <h4 className="font-medium text-gray-700">Student QR Code</h4>
          </div>
          <div className="flex flex-col items-center justify-center p-4 bg-white rounded-lg border">
            <img
              src={qrCode}
              alt="Student QR Code"
              className="w-48 h-48 object-contain mb-4"
            />
            <div className="flex items-center gap-3">
              <a
                href={qrCode}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
              >
                <Eye className="w-4 h-4 inline mr-2" />
                View QR
              </a>
              <a
                href={qrCode}
                download={`${s.firstName}_${s.lastName}_QR.png`}
                className="px-4 py-2 text-sm font-medium text-green-600 hover:text-green-700 hover:bg-green-50 rounded-lg transition-colors"
              >
                <Download className="w-4 h-4 inline mr-2" />
                Download QR
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <Modal
      open={isOpen}
      onClose={onClose}
      title={`Student Details - ${s.firstName} ${s.lastName}`}
      size="xl"
      footer={
        <div className="flex justify-between items-center w-full">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">
              Reg No: <span className="font-medium">{s.registrationNo || 'N/A'}</span>
            </span>
            <span className="text-gray-300">|</span>
            <span className="text-sm text-gray-500">
              Class: <span className="font-medium">{getClassName()}</span>
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Header with Profile */}
        <div className="flex flex-col md:flex-row items-start md:items-center gap-6 pb-6 border-b">
          <div className="flex-shrink-0">
            {s.profilePhoto?.url ? (
              <img
                src={s.profilePhoto.url}
                alt={`${s.firstName} ${s.lastName}`}
                className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-lg"
              />
            ) : (
              <div className="w-24 h-24 rounded-full bg-gray-200 border-4 border-white shadow-lg flex items-center justify-center">
                <User className="w-12 h-12 text-gray-400" />
              </div>
            )}
          </div>
          <div className="flex-1">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  {s.firstName} {s.lastName}
                </h2>
                <div className="flex items-center gap-4 mt-2">
                  <span className="text-sm text-gray-600 flex items-center gap-1">
                    <Mail className="w-4 h-4" />
                    {s.email}
                  </span>
                  <span className="text-sm text-gray-600 flex items-center gap-1">
                    <Phone className="w-4 h-4" />
                    {s.phone}
                  </span>
                  <span className="text-sm text-gray-600 flex items-center gap-1">
                    <Globe className="w-4 h-4" />
                    {s.gender === 'male' ? 'Male' : 'Female'}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  student.status === 'active' 
                    ? 'bg-green-100 text-green-700' 
                    : student.status === 'graduated' 
                    ? 'bg-blue-100 text-blue-700' 
                    : 'bg-gray-100 text-gray-700'
                }`}>
                  {student.status}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b">
          <div className="flex space-x-1 overflow-x-auto">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-3 text-sm font-medium rounded-t-lg border-b-2 transition-colors whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600 bg-blue-50'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Tab Content */}
        <div className="max-h-[50vh] overflow-y-auto p-1">
          {renderTabContent()}
        </div>
      </div>
    </Modal>
  );
};

export default StudentViewModal;