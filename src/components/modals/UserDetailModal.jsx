import React from "react";
import Modal from "@/components/ui/modal";
import { 
  UserCog, 
  Building2, 
  Mail, 
  Phone, 
  MapPin, 
  CheckCircle, 
  Eye, 
  Download,
  Calendar,
  Shield,
  Briefcase,
  Clock,
  Globe,
  Droplets,
  CreditCard,
  GraduationCap,
  Award,
  DollarSign,
  BookOpen,
  School
} from "lucide-react";
import { Button } from "@/components/ui/button";
import Skeleton from "@/components/ui/skeleton";
import apiClient from "@/lib/api-client";
import { API_ENDPOINTS } from "@/constants/api-endpoints";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

/**
 * UserDetailModal - A common component to view detailed profile of any user
 * (Staff, Branch Admin, Teacher, etc.)
 */
export default function UserDetailModal({ open, onClose, user: initialUser, userId, title = "Profile Overview" }) {
  const { user: authUser } = useAuth();
  const [user, setUser] = React.useState(null);
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    if (open) {
      const id = userId || initialUser?.id || initialUser?._id;
      if (id) {
        fetchUserDetails(id);
      }
    } else {
      setUser(null);
    }
  }, [open, userId, initialUser?.id, initialUser?._id]);

  const fetchUserDetails = async (id) => {
    try {
      setLoading(true);
      const isSuperAdmin = authUser?.role === 'SUPER_ADMIN';
      
      // Determine endpoint based on role and auth status
      // For now, we use a generic fetch or role-based if possible
      // Let's check the role from initialUser if available
      const role = initialUser?.role || authUser?.role;
      
      let endpoint = '';
      if (role === 'TEACHER') {
        endpoint = isSuperAdmin 
          ? API_ENDPOINTS.SUPER_ADMIN.TEACHERS.GET.replace(':id', id)
          : API_ENDPOINTS.BRANCH_ADMIN.TEACHERS.GET.replace(':id', id);
      } else if (role === 'STAFF') {
        endpoint = isSuperAdmin
          ? API_ENDPOINTS.SUPER_ADMIN.STAFF.GET.replace(':id', id)
          : API_ENDPOINTS.BRANCH_ADMIN.STAFF.GET.replace(':id', id);
      } else {
        // Fallback for admins or others
        endpoint = isSuperAdmin
          ? API_ENDPOINTS.SUPER_ADMIN.ADMINS?.GET?.replace(':id', id) || `/api/super-admin/admins/${id}`
          : `/api/branch-admin/profile/${id}`;
      }

      const response = await apiClient.get(endpoint);
      if (response.success) {
        setUser(response.data);
      } else {
        // If specific endpoint fails, try to use the initialUser data
        if (initialUser) setUser(initialUser);
      }
    } catch (error) {
      console.error('Fetch user details error:', error);
      if (initialUser) setUser(initialUser);
    } finally {
      setLoading(false);
    }
  };

  const isStaff = user?.role === "STAFF" || user?.role === "TEACHER";
  const isBranchAdmin = user?.role === "BRANCH_ADMIN";
  const isTeacher = user?.role === "TEACHER";

  const SkeletonLoading = () => (
    <div className="space-y-6">
      {/* Header Skeleton */}
      <div className="h-48 rounded-xl bg-gray-100 animate-pulse flex items-center p-6 gap-6">
        <Skeleton className="w-28 h-28 rounded-2xl" />
        <div className="flex-1 space-y-4">
          <Skeleton className="h-10 w-3/4" />
          <div className="flex gap-3">
            <Skeleton className="h-6 w-24 rounded-full" />
            <Skeleton className="h-6 w-24 rounded-full" />
          </div>
        </div>
      </div>
      {/* Grid Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Skeleton className="h-48 w-full rounded-2xl" />
          <Skeleton className="h-48 w-full rounded-2xl" />
        </div>
        <div className="space-y-6">
          <Skeleton className="h-64 w-full rounded-2xl" />
        </div>
      </div>
    </div>
  );

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      size="xl"
      footer={
        <div className="flex justify-end">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      }
    >
      <div className="space-y-6 max-h-[80vh] overflow-y-auto pr-2 custom-scrollbar px-1">
        {loading ? (
          <SkeletonLoading />
        ) : !user ? (
          <div className="p-12 text-center text-gray-500">
            User details not found.
          </div>
        ) : (
          <>
            {/* Header Section with Profile Banner */}
        <div className="relative rounded-xl bg-gradient-to-r from-blue-400 to-indigo-400 p-6 text-black overflow-hidden shadow-lg mb-4">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl" />
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-blue-400/20 rounded-full -ml-12 -mb-12 blur-xl" />

          <div className="relative flex flex-col md:flex-row items-center gap-6">
            <div className="relative">
              {(user.avatar_url || user.profilePhoto?.url) ? (
                <img
                  src={user.avatar_url || user.profilePhoto?.url}
                  alt="profile"
                  className="w-28 h-28 rounded-2xl object-cover ring-4 ring-white/20 shadow-xl"
                />
              ) : (
                <div className="w-28 h-28 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white ring-4 ring-white/10 shadow-xl">
                  <UserCog className="w-14 h-14" />
                </div>
              )}
              <div
                className={`absolute -bottom-2 -right-2 w-6 h-6 rounded-full border-4 border-white shadow-sm ${user.is_active ? "bg-green-500" : "bg-red-500"}`}
              />
            </div>

            <div className="text-center md:text-left flex-1">
              <h2 className="text-2xl md:text-3xl font-bold tracking-tight">
                {user.first_name} {user.last_name}
              </h2>
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 mt-2 text-blue-100">
                <span className="bg-white/10 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-bold border border-white/10 uppercase tracking-wider">
                  {user.role?.replace("_", " ")}
                </span>
                {user.staff_sub_type && (
                   <span className="bg-blue-400/20 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-bold border border-white/10 uppercase tracking-wider">
                    {user.staff_sub_type}
                  </span>
                )}
                <span className="flex items-center gap-1.5 text-xs font-medium">
                  <Building2 className="w-3.5 h-3.5" />
                  {user.branch?.name || "N/A"}
                </span>
              </div>
              
              <div className="mt-4 flex flex-wrap justify-center md:justify-start gap-4 text-xs">
                <div className="flex items-center gap-2 bg-black/10 px-3 py-2 rounded-lg">
                  <span className="text-blue-200 font-bold uppercase tracking-tighter">Reg ID:</span>
                  <span className="font-mono font-bold tracking-widest text-white">
                    {user.registration_no || "N/A"}
                  </span>
                </div>
                <div className="flex items-center gap-2 bg-black/10 px-3 py-2 rounded-lg">
                  <span className="text-blue-200 font-bold uppercase tracking-tighter">Status:</span>
                  <span className="font-bold uppercase tracking-wider">
                    {user.is_active ? "Active" : "Inactive"}
                  </span>
                </div>
              </div>
            </div>

            {user.qr_code_url && (
              <div className="bg-white p-2 rounded-xl shadow-2xl hidden md:block border border-white/20">
                <img src={user.qr_code_url} alt="Access QR" className="h-24 w-24" />
                <p className="text-[8px] text-center mt-1 font-black text-gray-400 uppercase tracking-tighter">Digital Access ID</p>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Info Columns */}
          <div className="lg:col-span-2 space-y-6">
            {/* Contact & Personal Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Contact Details */}
              <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-5 shadow-sm hover:shadow-md transition-all">
                <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100 mb-5 flex items-center gap-2">
                  <Mail className="w-4 h-4 text-blue-400" />
                  Contact Information
                </h3>
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center shrink-0">
                      <Mail className="w-5 h-5 text-blue-400 dark:text-blue-400" />
                    </div>
                    <div className="overflow-hidden">
                      <p className="text-[10px] text-gray-400 uppercase font-bold tracking-widest">Email Address</p>
                      <p className="text-sm font-bold text-gray-900 dark:text-gray-100 truncate">{user.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-green-50 dark:bg-green-900/20 flex items-center justify-center shrink-0">
                      <Phone className="w-5 h-5 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-400 uppercase font-bold tracking-widest">Phone Number</p>
                      <p className="text-sm font-bold text-gray-900 dark:text-gray-100">{user.phone || "—"}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Identity Details */}
              <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-5 shadow-sm hover:shadow-md transition-all">
                <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100 mb-5 flex items-center gap-2">
                  <Shield className="w-4 h-4 text-indigo-500" />
                  Identity & Personal
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <DetailItem 
                    label="CNIC / ID" 
                    value={user.details?.cnic || user.cnic} 
                    icon={<CreditCard className="w-3 h-3" />}
                  />
                  <DetailItem 
                    label="Gender" 
                    value={user.details?.gender || user.gender} 
                  />
                  <DetailItem 
                    label="Date of Birth" 
                    value={user.details?.date_of_birth || user.details?.dateOfBirth} 
                    isDate 
                  />
                  <DetailItem 
                    label="Blood Group" 
                    value={user.details?.blood_group || user.details?.bloodGroup} 
                    className="text-red-600 font-black"
                  />
                </div>
              </div>
            </div>

            {/* Address Details */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-5 shadow-sm hover:shadow-md transition-all">
              <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100 mb-5 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-red-500" />
                Residential Address
              </h3>
              <div className="flex gap-5">
                <div className="w-12 h-12 rounded-2xl bg-red-50 dark:bg-red-900/20 flex items-center justify-center shrink-0 border border-red-100 dark:border-red-900/30">
                  <MapPin className="w-6 h-6 text-red-600 dark:text-red-400" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-bold text-gray-900 dark:text-white leading-relaxed">
                    {user.details?.address?.street || "No street address provided"}
                  </p>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-2">
                    <DetailItem label="City" value={user.details?.address?.city} />
                    <DetailItem label="State" value={user.details?.address?.state} />
                    <DetailItem label="Postal" value={user.details?.address?.postalCode} />
                    <DetailItem label="Country" value={user.details?.address?.country || "Pakistan"} />
                  </div>
                </div>
              </div>
            </div>

            {/* Documents Section */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-5 shadow-sm hover:shadow-md transition-all">
              <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100 mb-5 flex items-center gap-2">
                <Eye className="w-4 h-4 text-purple-500" />
                Verification Documents
              </h3>
              {(user.documents || user.teacherProfile?.documents || user.details?.documents || []).length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 bg-gray-50 dark:bg-gray-900/30 rounded-2xl border border-dashed border-gray-200 dark:border-gray-800">
                  <Eye className="w-10 h-10 text-gray-300 mb-3" />
                  <p className="text-xs text-gray-500 font-bold uppercase tracking-widest">No documents uploaded</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {(user.documents || user.teacherProfile?.documents || user.details?.documents || []).map((doc, idx) => (
                    <div
                      key={doc.id || idx}
                      className="flex items-center justify-between p-4 rounded-xl bg-gray-50 dark:bg-gray-900/50 border border-gray-100 dark:border-gray-700 group hover:border-blue-200 dark:hover:border-blue-900 transition-all hover:shadow-md"
                    >
                      <div className="flex items-center gap-3 overflow-hidden">
                        <div className="w-10 h-10 rounded-xl bg-white dark:bg-gray-800 flex items-center justify-center shadow-sm shrink-0 group-hover:scale-110 transition-transform">
                          <Download className="w-5 h-5 text-blue-400" />
                        </div>
                        <div className="overflow-hidden">
                          <p className="text-xs font-black text-gray-900 dark:text-white truncate uppercase tracking-tighter">
                            {doc.type?.replace("_", " ") || "DOCUMENT"}
                          </p>
                          <p className="text-[10px] text-gray-500 truncate font-medium">
                            {doc.name || doc.filename || "Original File"}
                          </p>
                        </div>
                      </div>
                      {doc.url && (
                          <a
                            href={doc.url}
                            target="_blank"
                            rel="noreferrer"
                            className="px-3 py-1.5 bg-blue-500 hover:bg-blue-600 text-white text-[10px] font-black rounded-lg transition-colors shadow-lg shadow-blue-500/20 uppercase"
                          >
                            View
                          </a>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Teacher Specific: Qualifications */}
            {isTeacher && user.teacherProfile?.qualifications?.length > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-5 shadow-sm hover:shadow-md transition-all">
                <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100 mb-5 flex items-center gap-2">
                  <GraduationCap className="w-4 h-4 text-blue-500" />
                  Academic Qualifications
                </h3>
                <div className="space-y-3">
                  {user.teacherProfile.qualifications.map((qual, idx) => (
                    <div key={idx} className="p-4 rounded-xl bg-gray-50 dark:bg-gray-900/50 border border-gray-100 dark:border-gray-700">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <DetailItem label="Degree" value={qual.degree} />
                        <DetailItem label="Institution" value={qual.institution} />
                        <DetailItem label="Year" value={qual.yearOfCompletion} />
                        <DetailItem label="Grade" value={qual.grade || 'N/A'} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Teacher Specific: Class Assignments */}
            {isTeacher && user.teacherProfile?.classes?.length > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-5 shadow-sm hover:shadow-md transition-all">
                <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100 mb-5 flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-emerald-500" />
                  Class Assignments
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {user.teacherProfile.classes.map((cls, idx) => (
                    <div key={idx} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-900/50 border border-gray-100 dark:border-gray-700">
                      <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/20 flex items-center justify-center text-emerald-600">
                        <School className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-gray-900 dark:text-white">
                          {cls.classId?.name || cls.className}
                        </p>
                        <p className="text-[10px] text-gray-500 font-bold uppercase tracking-tight">
                          {cls.subjectId?.name || cls.subjectName}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Teacher Specific: Salary Information */}
            {isTeacher && user.teacherProfile?.salaryDetails && (
              <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-5 shadow-sm hover:shadow-md transition-all">
                <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100 mb-5 flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-green-500" />
                  Salary Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div className="bg-green-50 dark:bg-green-900/10 p-4 rounded-xl border border-green-100 dark:border-green-900/20 text-center">
                    <p className="text-[10px] text-green-600 dark:text-green-400 font-bold uppercase tracking-widest mb-1">Basic</p>
                    <p className="text-lg font-black text-green-900 dark:text-green-100">
                      Rs. {(user.teacherProfile.salaryDetails.basicSalary || 0).toLocaleString()}
                    </p>
                  </div>
                  <div className="bg-blue-50 dark:bg-blue-900/10 p-4 rounded-xl border border-blue-100 dark:border-blue-900/20 text-center">
                    <p className="text-[10px] text-blue-600 dark:text-blue-400 font-bold uppercase tracking-widest mb-1">Allowances</p>
                    <p className="text-lg font-black text-blue-900 dark:text-blue-100">
                      Rs. {Object.values(user.teacherProfile.salaryDetails.allowances || {})
                        .reduce((sum, val) => sum + (val || 0), 0).toLocaleString()}
                    </p>
                  </div>
                  <div className="bg-purple-50 dark:bg-purple-900/10 p-4 rounded-xl border border-purple-100 dark:border-purple-900/20 text-center">
                    <p className="text-[10px] text-purple-600 dark:text-purple-400 font-bold uppercase tracking-widest mb-1">Net Payable</p>
                    <p className="text-lg font-black text-purple-900 dark:text-purple-100">
                      Rs. {(
                        (user.teacherProfile.salaryDetails.basicSalary || 0) +
                        Object.values(user.teacherProfile.salaryDetails.allowances || {})
                          .reduce((sum, val) => sum + (val || 0), 0) -
                        Object.values(user.teacherProfile.salaryDetails.deductions || {})
                          .reduce((sum, val) => sum + (val || 0), 0)
                      ).toLocaleString()}
                    </p>
                  </div>
                </div>
                {/* Bank Account */}
                {user.teacherProfile?.bankAccount?.bankName && (
                  <div className="pt-4 border-t border-gray-100 dark:border-gray-700">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
                        <CreditCard className="w-5 h-5 text-gray-400" />
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-6 flex-1">
                        <DetailItem label="Bank Name" value={user.teacherProfile.bankAccount.bankName} />
                        <DetailItem label="Account No" value={user.teacherProfile.bankAccount.accountNumber} />
                        <DetailItem label="IBAN" value={user.teacherProfile.bankAccount.iban} />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Sidebar Info Column */}
          <div className="space-y-6">
            {/* Professional Info */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-5 shadow-sm hover:shadow-md transition-all">
              <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100 mb-5 flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-orange-500" />
                Professional Profile
              </h3>
              <div className="space-y-4">
                <DetailItem label="Designation" value={user.details?.designation || (isBranchAdmin ? "Branch Administrator" : "Staff")} />
                <DetailItem label="Joining Date" value={user.details?.joiningDate || user.details?.joining_date} isDate />
                <DetailItem label="Nationality" value={user.details?.nationality || "Pakistani"} />
                <DetailItem label="Religion" value={user.details?.religion} />
              </div>
            </div>

            {/* Work Schedule (Only for non-teacher Staff) */}
            {(!isTeacher && (isStaff || user.details?.working_hours || user.details?.workingHours)) && (
              <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-5 shadow-sm hover:shadow-md transition-all">
                <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100 mb-5 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-cyan-500" />
                  Work Schedule
                </h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center bg-gray-50 dark:bg-gray-700/30 p-3 rounded-xl">
                    <DetailItem label="Start" value={user.details?.workingHours?.startTime || user.details?.working_hours?.startTime} />
                    <DetailItem label="End" value={user.details?.workingHours?.endTime || user.details?.working_hours?.endTime} />
                  </div>
                  {/* Working Days */}
                  <div>
                    <p className="text-[10px] font-black text-gray-400 uppercase mb-2 tracking-widest">Working Days</p>
                    <div className="flex flex-wrap gap-1.5">
                      {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => {
                        const workingDays = user.details?.workingHours?.workingDays || user.details?.working_hours?.workingDays || [];
                        const isWorking = workingDays.some(d => d.startsWith(day));
                        return (
                          <span key={day} className={`px-2 py-1 rounded-lg text-[10px] font-black transition-colors ${
                            isWorking
                              ? 'bg-blue-500 text-white shadow-md shadow-blue-500/20'
                              : 'bg-gray-100 text-gray-400 dark:bg-gray-800 dark:text-gray-600'
                          }`}>
                            {day}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Specialized Info */}
            {(user.details?.specializedInfo || user.details?.specialized_info) && (
              <div className="bg-red-50 dark:bg-red-900/10 rounded-2xl border border-red-100 dark:border-red-900/20 p-5 shadow-sm">
                <h3 className="text-sm font-bold text-red-900 dark:text-red-400 mb-5 flex items-center gap-2">
                  <Shield className="w-4 h-4" />
                  Specialized Info
                </h3>
                <div className="space-y-4">
                   {/* Driver License etc */}
                   {user.details?.specializedInfo?.driverLicense?.number && (
                     <DetailItem label="License No" value={user.details.specializedInfo.driverLicense.number} />
                   )}
                   {user.details?.specializedInfo?.securityBadgeNumber && (
                     <DetailItem label="Security Badge" value={user.details.specializedInfo.securityBadgeNumber} />
                   )}
                </div>
              </div>
            )}
          </div>
        </div>
        </>
        )}
      </div>
    </Modal>
  );
}

// Helper Component for Details
function DetailItem({ label, value, isDate = false, icon = null, className = "" }) {
  if (!value && value !== 0) return null;
  
  return (
    <div className="overflow-hidden">
      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1 mb-0.5">
        {icon}
        {label}
      </p>
      <p className={`text-sm font-bold text-gray-900 dark:text-gray-100 truncate ${className}`}>
        {isDate ? new Date(value).toLocaleDateString('en-PK', { day: 'numeric', month: 'short', year: 'numeric' }) : value}
      </p>
    </div>
  );
}
