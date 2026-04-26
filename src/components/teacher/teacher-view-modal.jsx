'use client';

import React from 'react';
import { format } from 'date-fns';
import {
  User, Mail, Phone, Calendar, MapPin, FileText, 
  GraduationCap, Award, DollarSign, BookOpen, Briefcase,
  Users, Hash, Building, School, CreditCard
} from 'lucide-react';
import Modal from '@/components/ui/modal';

export default function TeacherViewModal({ teacher, open, onClose }) {
  if (!teacher) return null;

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'on_leave': return 'bg-yellow-100 text-yellow-800';
      case 'terminated': return 'bg-red-100 text-red-800';
      case 'resigned': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Teacher Details"
      size="xl"
      footer={
        <div className="flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
          >
            Close
          </button>
        </div>
      }
    >
      <div className="space-y-6 max-h-[70vh] overflow-y-auto">
        {/* Header with Profile Photo */}
        <div className="flex items-center gap-6 bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-xl border border-blue-100">
          <div className="flex-shrink-0">
            {teacher.profilePhoto?.url ? (
              <img
                src={teacher.profilePhoto.url}
                alt={teacher.fullName}
                className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-lg"
              />
            ) : (
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-3xl font-bold shadow-lg border-4 border-white">
                {teacher.firstName?.[0]}{teacher.lastName?.[0]}
              </div>
            )}
          </div>
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-gray-900 mb-1">
              {teacher.fullName || `${teacher.first_name} ${teacher.last_name}`}
            </h2>
            <p className="text-sm text-gray-600 font-medium mb-2">
              {teacher.details?.teacher?.designation || teacher.teacherProfile?.designation || 'Teacher'}
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <span className="flex items-center gap-1 text-sm text-gray-600">
                <Award className="h-4 w-4" />
                {teacher.registration_no || teacher.teacherProfile?.employeeId || 'N/A'}
              </span>
              <span className={`px-3 py-1 text-xs font-medium rounded-full ${teacher.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                {teacher.is_active ? 'ACTIVE' : 'INACTIVE'}
              </span>
              {(teacher.branch?.name || teacher.branchId?.name) && (
                <span className="flex items-center gap-1 text-sm text-gray-600">
                  <Building className="h-4 w-4" />
                  {teacher.branch?.name || teacher.branchId.name}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Personal Information */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <User className="h-5 w-5 text-blue-600" />
            Personal Information
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-start gap-3">
              <Mail className="h-5 w-5 text-gray-400 mt-0.5" />
              <div>
                <p className="text-xs text-gray-500">Email</p>
                <p className="text-sm font-medium text-gray-900">{teacher.email}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Phone className="h-5 w-5 text-gray-400 mt-0.5" />
              <div>
                <p className="text-xs text-gray-500">Phone</p>
                <p className="text-sm font-medium text-gray-900">{teacher.phone}</p>
              </div>
            </div>
            {teacher.details?.cnic && (
              <div className="flex items-start gap-3">
                <Hash className="h-5 w-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-xs text-gray-500">CNIC</p>
                  <p className="text-sm font-medium text-gray-900">{teacher.details.cnic}</p>
                </div>
              </div>
            )}
            <div className="flex items-start gap-3">
              <Calendar className="h-5 w-5 text-gray-400 mt-0.5" />
              <div>
                <p className="text-xs text-gray-500">Date of Birth</p>
                <p className="text-sm font-medium text-gray-900">
                  {teacher.details?.date_of_birth ? format(new Date(teacher.details.date_of_birth), 'dd MMM yyyy') : 'N/A'}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Users className="h-5 w-5 text-gray-400 mt-0.5" />
              <div>
                <p className="text-xs text-gray-500">Gender</p>
                <p className="text-sm font-medium text-gray-900 capitalize">{teacher.details?.gender || 'N/A'}</p>
              </div>
            </div>
            {teacher.details?.blood_group && (
              <div className="flex items-start gap-3">
                <Briefcase className="h-5 w-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-xs text-gray-500">Blood Group</p>
                  <p className="text-sm font-medium text-gray-900">{teacher.details.blood_group}</p>
                </div>
              </div>
            )}
            {teacher.details?.religion && (
              <div className="flex items-start gap-3">
                <FileText className="h-5 w-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-xs text-gray-500">Religion</p>
                  <p className="text-sm font-medium text-gray-900">{teacher.details.religion}</p>
                </div>
              </div>
            )}
            {teacher.address && (
              <div className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-xs text-gray-500">Address</p>
                  <p className="text-sm font-medium text-gray-900">
                    {[teacher.address?.street, teacher.address?.city, teacher.address?.country]
                      .filter(Boolean).join(', ') || 'N/A'}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Professional Information */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Briefcase className="h-5 w-5 text-blue-600" />
            Professional Information
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-start gap-3">
              <Calendar className="h-5 w-5 text-gray-400 mt-0.5" />
              <div>
                <p className="text-xs text-gray-500">Joining Date</p>
                <p className="text-sm font-medium text-gray-900">
                  {teacher.teacherProfile?.joiningDate 
                    ? format(new Date(teacher.teacherProfile.joiningDate), 'dd MMM yyyy') 
                    : 'N/A'}
                </p>
              </div>
            </div>
            {teacher.teacherProfile?.departmentId?.name && (
              <div className="flex items-start gap-3">
                <School className="h-5 w-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-xs text-gray-500">Department</p>
                  <p className="text-sm font-medium text-gray-900">
                    {teacher.teacherProfile.departmentId.name}
                  </p>
                </div>
              </div>
            )}
            {teacher.teacherProfile?.experience?.totalYears && (
              <div className="flex items-start gap-3">
                <Award className="h-5 w-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-xs text-gray-500">Experience</p>
                  <p className="text-sm font-medium text-gray-900">
                    {teacher.teacherProfile.experience.totalYears} years
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Subjects */}
          {teacher.teacherProfile?.subjects?.length > 0 && (
            <div className="mt-4">
              <p className="text-xs text-gray-500 mb-2">Subjects</p>
              <div className="flex flex-wrap gap-2">
                {teacher.teacherProfile.subjects.map((subject, idx) => (
                  <span 
                    key={idx} 
                    className="px-3 py-1 bg-blue-50 text-blue-700 text-xs font-medium rounded-full border border-blue-200"
                  >
                    {subject.name || subject}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Class Assignments */}
          {teacher.teacherProfile?.classes?.length > 0 && (
            <div className="mt-4">
              <p className="text-xs text-gray-500 mb-2">Class Assignments</p>
              <div className="space-y-2">
                {teacher.teacherProfile.classes.map((cls, idx) => (
                  <div key={idx} className="flex items-center gap-2 bg-gray-50 p-3 rounded-lg border border-gray-200">
                    <BookOpen className="h-4 w-4 text-blue-600" />
                    <span className="text-sm font-medium">
                      {cls.classId?.name || cls.className} - {cls.subjectId?.name || cls.subjectName}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Qualifications */}
        {teacher.teacherProfile?.qualifications?.length > 0 && (
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <GraduationCap className="h-5 w-5 text-blue-600" />
              Qualifications
            </h3>
            <div className="space-y-3">
              {teacher.teacherProfile.qualifications.map((qual, idx) => (
                <div key={idx} className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-2 text-sm">
                    <div>
                      <span className="font-medium text-gray-500">Degree:</span>
                      <p className="font-medium">{qual.degree}</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-500">Institution:</span>
                      <p>{qual.institution}</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-500">Year:</span>
                      <p>{qual.yearOfCompletion}</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-500">Grade:</span>
                      <p>{qual.grade || 'N/A'}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Salary Information */}
        {teacher.teacherProfile?.salaryDetails && (
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-blue-600" />
              Salary Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                <p className="text-xs text-green-600 mb-1">Basic Salary</p>
                <p className="text-lg font-bold text-green-900">
                  Rs. {(teacher.teacherProfile.salaryDetails.basicSalary || 0).toLocaleString()}
                </p>
              </div>
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <p className="text-xs text-blue-600 mb-1">Total Allowances</p>
                <p className="text-lg font-bold text-blue-900">
                  Rs. {Object.values(teacher.teacherProfile.salaryDetails.allowances || {})
                    .reduce((sum, val) => sum + (val || 0), 0).toLocaleString()}
                </p>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                <p className="text-xs text-purple-600 mb-1">Net Salary</p>
                <p className="text-lg font-bold text-purple-900">
                  Rs. {(
                    (teacher.teacherProfile.salaryDetails.basicSalary || 0) +
                    Object.values(teacher.teacherProfile.salaryDetails.allowances || {})
                      .reduce((sum, val) => sum + (val || 0), 0) -
                    Object.values(teacher.teacherProfile.salaryDetails.deductions || {})
                      .reduce((sum, val) => sum + (val || 0), 0)
                  ).toLocaleString()}
                </p>
              </div>
            </div>

            {/* Bank Account Details */}
            {teacher.teacherProfile?.bankAccount?.bankName && (
              <div className="mt-4 border-t pt-4">
                <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <CreditCard className="h-4 w-4" />
                  Bank Account Details
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-500">Bank Name</p>
                    <p className="text-sm font-medium">{teacher.teacherProfile.bankAccount.bankName}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Account Number</p>
                    <p className="text-sm font-medium">{teacher.teacherProfile.bankAccount.accountNumber}</p>
                  </div>
                  {teacher.teacherProfile.bankAccount.iban && (
                    <div>
                      <p className="text-xs text-gray-500">IBAN</p>
                      <p className="text-sm font-medium">{teacher.teacherProfile.bankAccount.iban}</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Emergency Contact */}
        {teacher.teacherProfile?.emergencyContact?.name && (
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Phone className="h-5 w-5 text-blue-600" />
              Emergency Contact
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <p className="text-xs text-gray-500">Name</p>
                <p className="text-sm font-medium text-gray-900">
                  {teacher.teacherProfile.emergencyContact.name}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Relationship</p>
                <p className="text-sm font-medium text-gray-900">
                  {teacher.teacherProfile.emergencyContact.relationship || 'N/A'}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Phone</p>
                <p className="text-sm font-medium text-gray-900">
                  {teacher.teacherProfile.emergencyContact.phone || 'N/A'}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Documents */}
        {teacher.teacherProfile?.documents?.length > 0 && (
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <FileText className="h-5 w-5 text-blue-600" />
              Documents
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {teacher.teacherProfile.documents.map((doc, idx) => (
                <a
                  key={idx}
                  href={doc.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-3 bg-gray-50 hover:bg-gray-100 rounded-lg border border-gray-200 transition-colors"
                >
                  <FileText className="h-5 w-5 text-blue-600" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900 capitalize">
                      {doc.type?.replace('_', ' ')}
                    </p>
                    <p className="text-xs text-gray-500">
                      {doc.uploadedAt ? format(new Date(doc.uploadedAt), 'dd MMM yyyy') : 'N/A'}
                    </p>
                  </div>
                </a>
              ))}
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}