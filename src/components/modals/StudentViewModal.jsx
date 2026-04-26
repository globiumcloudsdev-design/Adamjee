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
  Bus,
  Stethoscope,
  AlertCircle,
} from 'lucide-react';
import { format } from 'date-fns';
import apiClient from '@/lib/api-client';
import { API_ENDPOINTS } from '@/constants/api-endpoints';
import { toast } from 'sonner';

const StudentViewModal = ({
  isOpen,
  onClose,
  student,
  branches = [],
  classes = [],
  departments = [],
}) => {
  const [activeTab, setActiveTab] = useState('personal');
  const [loading, setLoading] = useState(false);
  const [qrCode, setQrCode] = useState(null);

  // Load QR code if available
  useEffect(() => {
    if (student && isOpen && student.studentProfile?.qr?.url) {
      setQrCode(student.studentProfile.qr.url);
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
    alternatePhone: student.alternatePhone || student.details?.academic_info?.alternate_phone || '',
    gender: student.gender || student.details?.academic_info?.gender || '',
    dateOfBirth: student.dateOfBirth || student.details?.academic_info?.date_of_birth || '',
    bloodGroup: student.bloodGroup || student.details?.academic_info?.blood_group || '',
    nationality: student.nationality || student.details?.academic_info?.nationality || '',
    religion: student.religion || student.details?.academic_info?.religion || '',
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
      rollNumber: student.details?.academic_info?.roll_no || '',
      admissionDate: student.details?.academic_info?.admission_date || '',
      academicYear: student.details?.academic_info?.academic_year_id || '',
      father: student.details?.academic_info?.father || {},
      mother: student.details?.academic_info?.mother || {},
      guardian: student.details?.academic_info?.guardian || {},
      guardianType: student.details?.academic_info?.guardian_type || 'parent',
      previousCoaching: student.details?.academic_info?.previous_coaching || {},
      feeDiscount: student.details?.academic_info?.fee_discount || {},
      transportFee: student.details?.academic_info?.transport_fee || {},
      documents: student.details?.documents || student.documents || [],
    },
    medicalInfo: student.medicalInfo || student.details?.academic_info?.medical_info || {},
    emergencyContact: student.emergencyContact || student.details?.academic_info?.emergency_contact || {},
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

  const getBranchName = () => {
    if (student.branch?.name) return student.branch.name;
    const branchId = s.branchId?._id || s.branchId;
    return branches.find(b => b.id === branchId || b._id === branchId)?.name || 'N/A';
  };

  const getDepartmentName = () => {
    const deptId = s.studentProfile?.departmentId?._id || s.studentProfile?.departmentId;
    return departments.find(d => d.id === deptId || d._id === deptId)?.name || 'N/A';
  };

  const tabs = [
    { id: 'personal', label: 'Personal', icon: User },
    { id: 'academic', label: 'Academic', icon: GraduationCap },
    { id: 'parent', label: 'Parent', icon: Users },
    { id: 'medical', label: 'Medical', icon: Heart },
    { id: 'documents', label: 'Documents', icon: FileText },
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
      case 'medical':
        return renderMedicalInfo();
      case 'documents':
        return renderDocuments();
      default:
        return renderPersonalInfo();
    }
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
              <span className="text-sm text-gray-500">Blood Group</span>
              <span className="font-medium">{s.bloodGroup || 'N/A'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-500">Religion</span>
              <span className="font-medium">{s.religion || 'N/A'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-500">Nationality</span>
              <span className="font-medium">{s.nationality || 'N/A'}</span>
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
              <span className="text-sm text-gray-500">Email</span>
              <span className="font-medium">{s.email || 'N/A'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-500">Phone</span>
              <span className="font-medium">{s.phone || 'N/A'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-500">Alternate Phone</span>
              <span className="font-medium">{s.alternatePhone || 'N/A'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Address Information */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <div className="flex items-center gap-2 mb-2">
          <MapPin className="w-4 h-4 text-gray-500" />
          <h4 className="font-medium text-gray-700">Address Information</h4>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-gray-500">Street</span>
              <span className="font-medium">{s.address?.street || 'N/A'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-500">City</span>
              <span className="font-medium">{s.address?.city || 'N/A'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-500">State</span>
              <span className="font-medium">{s.address?.state || 'N/A'}</span>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-gray-500">Postal Code</span>
              <span className="font-medium">{s.address?.postalCode || 'N/A'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-500">Country</span>
              <span className="font-medium">{s.address?.country || 'N/A'}</span>
            </div>
          </div>
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
              <span className="text-sm text-gray-500">Registration No.</span>
              <span className="font-medium font-mono">
                {s.registrationNo || 'N/A'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-500">Enrollment Date</span>
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
            <h4 className="font-medium text-gray-700">Current Academic</h4>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-gray-500">Class</span>
              <span className="font-medium">{getClassName()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-500">Section</span>
              <span className="font-medium">{s.studentProfile?.section || 'N/A'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-500">Roll Number</span>
              <span className="font-medium">{s.studentProfile?.rollNumber || 'N/A'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-500">Department</span>
              <span className="font-medium">{getDepartmentName()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-500">Academic Year</span>
              <span className="font-medium">{s.studentProfile?.academicYear || 'N/A'}</span>
            </div>
          </div>
        </div>

        {/* Previous Coaching Info */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <Building className="w-4 h-4 text-gray-500" />
            <h4 className="font-medium text-gray-700">Previous Coaching</h4>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-gray-500">Coaching Name</span>
              <span className="font-medium">{student.studentProfile?.previousCoaching?.name || 'N/A'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-500">Last Class</span>
              <span className="font-medium">{student.studentProfile?.previousCoaching?.lastClass || 'N/A'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-500">Marks/Percentage</span>
              <span className="font-medium">{student.studentProfile?.previousCoaching?.marks || 'N/A'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-500">Leaving Date</span>
              <span className="font-medium">{formatDate(student.studentProfile?.previousCoaching?.leavingDate)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Fee Information */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <CreditCard className="w-4 h-4 text-gray-500" />
            <h4 className="font-medium text-gray-700">Fee Information</h4>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-gray-500">Discount Type</span>
              <span className="font-medium capitalize">
                {s.studentProfile?.feeDiscount?.type || 'None'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-500">Discount Amount</span>
              <span className="font-medium">
                {s.studentProfile?.feeDiscount?.amount 
                  ? `${s.studentProfile.feeDiscount.amount} ${s.studentProfile.feeDiscount.type === 'percentage' ? '%' : 'PKR'}`
                  : 'N/A'
                }
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-500">Discount Reason</span>
              <span className="font-medium">{s.studentProfile?.feeDiscount?.reason || 'N/A'}</span>
            </div>
          </div>
        </div>

        {/* Transport Information */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <Bus className="w-4 h-4 text-gray-500" />
            <h4 className="font-medium text-gray-700">Transport Information</h4>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-gray-500">Transport Enabled</span>
              <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                s.studentProfile?.transportFee?.enabled 
                  ? 'bg-green-100 text-green-700' 
                  : 'bg-gray-100 text-gray-700'
              }`}>
                {s.studentProfile?.transportFee?.enabled ? 'Yes' : 'No'}
              </span>
            </div>
            {s.studentProfile?.transportFee?.enabled && (
              <>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Transport Fee</span>
                  <span className="font-medium">{s.studentProfile?.transportFee?.amount || 0} PKR</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Route ID</span>
                  <span className="font-medium">{s.studentProfile?.transportFee?.routeId || 'N/A'}</span>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Remarks */}
      {s.remarks && (
        <div className="bg-gray-50 p-4 rounded-lg">
          <h4 className="font-medium text-gray-700 mb-2">Remarks</h4>
          <p className="text-sm text-gray-600">{s.remarks}</p>
        </div>
      )}
    </div>
  );

  const renderParentInfo = () => {
    const guardianType = s.studentProfile?.guardianType || 'parent';
    const father = s.studentProfile?.father || {};
    const mother = s.studentProfile?.mother || {};
    const guardian = s.studentProfile?.guardian || {};
    const emergency = s.emergencyContact || {};

    return (
      <div className="space-y-6">
        {/* Guardian Type */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="flex items-center gap-2 mb-4">
            <Shield className="w-4 h-4 text-gray-500" />
            <h4 className="font-medium text-gray-700">Guardian Type</h4>
          </div>
          <div className="flex justify-center">
            <span className={`px-4 py-2 rounded-full text-sm font-medium ${
              guardianType === 'parent' 
                ? 'bg-blue-100 text-blue-700' 
                : 'bg-purple-100 text-purple-700'
            }`}>
              {guardianType === 'parent' ? 'Parent (Father/Mother)' : 'Guardian'}
            </span>
          </div>
        </div>

        {guardianType === 'parent' ? (
          <>
            {/* Father Information */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <User className="w-4 h-4 text-gray-500" />
                <h4 className="font-medium text-gray-700">Father Information</h4>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Name</span>
                  <span className="font-medium">{father.name || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Occupation</span>
                  <span className="font-medium">{father.occupation || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Phone</span>
                  <span className="font-medium">{father.phone || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Email</span>
                  <span className="font-medium">{father.email || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">CNIC</span>
                  <span className="font-medium">{father.cnic || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Monthly Income</span>
                  <span className="font-medium">{father.income ? `${father.income} PKR` : 'N/A'}</span>
                </div>
              </div>
            </div>

            {/* Mother Information */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <User className="w-4 h-4 text-gray-500" />
                <h4 className="font-medium text-gray-700">Mother Information</h4>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Name</span>
                  <span className="font-medium">{mother.name || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Occupation</span>
                  <span className="font-medium">{mother.occupation || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Phone</span>
                  <span className="font-medium">{mother.phone || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Email</span>
                  <span className="font-medium">{mother.email || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">CNIC</span>
                  <span className="font-medium">{mother.cnic || 'N/A'}</span>
                </div>
              </div>
            </div>
          </>
        ) : (
          /* Guardian Information */
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <User className="w-4 h-4 text-gray-500" />
              <h4 className="font-medium text-gray-700">Guardian Information</h4>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Name</span>
                <span className="font-medium">{guardian.name || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Relation</span>
                <span className="font-medium">{guardian.relation || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Phone</span>
                <span className="font-medium">{guardian.phone || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Email</span>
                <span className="font-medium">{guardian.email || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">CNIC</span>
                <span className="font-medium">{guardian.cnic || 'N/A'}</span>
              </div>
            </div>
          </div>
        )}

        {/* Emergency Contact */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <AlertCircle className="w-4 h-4 text-gray-500" />
            <h4 className="font-medium text-gray-700">Emergency Contact</h4>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-gray-500">Contact Name</span>
              <span className="font-medium">{emergency.name || 'N/A'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-500">Relationship</span>
              <span className="font-medium">{emergency.relationship || 'N/A'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-500">Phone</span>
              <span className="font-medium">{emergency.phone || 'N/A'}</span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderMedicalInfo = () => {
    const medical = s.medicalInfo || {};

    return (
      <div className="space-y-6">
        {/* Medical Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Heart className="w-4 h-4 text-gray-500" />
              <h4 className="font-medium text-gray-700">Medical Details</h4>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Blood Group</span>
                <span className="font-medium">{s.bloodGroup || 'N/A'}</span>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Stethoscope className="w-4 h-4 text-gray-500" />
              <h4 className="font-medium text-gray-700">Doctor Information</h4>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Doctor Name</span>
                <span className="font-medium">{medical.doctorName || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Doctor Phone</span>
                <span className="font-medium">{medical.doctorPhone || 'N/A'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Allergies */}
        {medical.allergies && (
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-medium text-gray-700 mb-2">Allergies</h4>
            <p className="text-sm text-gray-600 whitespace-pre-line">{medical.allergies}</p>
          </div>
        )}

        {/* Chronic Conditions */}
        {medical.chronicConditions && (
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-medium text-gray-700 mb-2">Chronic Conditions</h4>
            <p className="text-sm text-gray-600 whitespace-pre-line">{medical.chronicConditions}</p>
          </div>
        )}

        {/* Current Medications */}
        {medical.medications && (
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-medium text-gray-700 mb-2">Current Medications</h4>
            <p className="text-sm text-gray-600 whitespace-pre-line">{medical.medications}</p>
          </div>
        )}

        {!medical.allergies && !medical.chronicConditions && !medical.medications && (
          <div className="text-center py-8">
            <Heart className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No medical information recorded</p>
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
            <Button variant="outline" size="sm" onClick={() => window.print()}>
              <Printer className="w-4 h-4 mr-2" />
              Print
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