// 'use client';

// import { useState, useEffect } from 'react';
// import { useRouter } from 'next/navigation';
// import apiClient from '@/lib/api-client';
// import { API_ENDPOINTS } from '@/constants/api-endpoints';
// import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
// import { Button } from '@/components/ui/button';
// import Input from '@/components/ui/input';
// import Textarea from '@/components/ui/textarea';
// import Dropdown from '@/components/ui/dropdown';
// import MultiSelectDropdown from '@/components/ui/multi-select';
// import ButtonLoader from '@/components/ui/button-loader';
// import { Bell, Users, Type, Building2, Megaphone, History, Clock, CheckCircle, BarChart3, ShieldCheck } from 'lucide-react';
// import { toast } from 'sonner';
// import NotificationStatsModal from '@/components/NotificationStatsModal';

// // Notification Types
// const NOTIFICATION_TYPES = [
//   { value: 'announcement', label: '📢 Announcement' },
//   { value: 'general', label: 'ℹ️ General' },
//   { value: 'assignment', label: '📝 Assignment' },
//   { value: 'assignment', label: '📝 Assignment' },
//   { value: 'fee_reminder', label: '💰 Fee Reminder' },
//   { value: 'event', label: '🎉 Event' },
//   { value: 'holiday', label: '🏖️ Holiday' },
//   { value: 'event', label: '🎉 Event' },
//   { value: 'holiday', label: '🏖️ Holiday' },
//   { value: 'exam', label: '🎓 Exam Update' },
//   { value: 'result', label: '📊 Result Declared' },
// ];

// const TARGET_ROLES = [
//   { value: 'all', label: '🌐 All (Everyone)' },
//   { value: 'branch_admin', label: '🔑 Branch Admins' },
//   { value: 'student', label: '👨‍🎓 Students' },
//   { value: 'parent', label: '👨‍👩‍👦 Parents' },
//   { value: 'teacher', label: '👩‍🏫 Teachers' },
//   { value: 'staff', label: '💼 Staff' },
// ];

// export default function SuperAdminNotification() {
//   const router = useRouter();

//   const [loading, setLoading] = useState(false);
//   const [branchesLoading, setBranchesLoading] = useState(true);
//   const [usersLoading, setUsersLoading] = useState(false);
//   const [historyLoading, setHistoryLoading] = useState(true);

//   // Branches State
//   const [branches, setBranches] = useState([]);

//   // Specific Targeting State
//   const [isSpecificTargeting, setIsSpecificTargeting] = useState(false);
//   const [availableUsers, setAvailableUsers] = useState([]);
//   const [selectedUserIds, setSelectedUserIds] = useState([]);

//   // History & Tracking State
//   const [history, setHistory] = useState([]);
//   const [showStatsModal, setShowStatsModal] = useState(false);
//   const [selectedCampaign, setSelectedCampaign] = useState(null);

//   const [formData, setFormData] = useState({
//     title: '',
//     message: '',
//     type: 'announcement',
//     targetRole: 'all',
//     targetBranch: 'all',
//   });

//   // Fetch Branches on mount
//   useEffect(() => {
//     fetchBranches();
//     fetchHistory();
//   }, []);

//   // Fetch Branches on mount
//   useEffect(() => {
//     fetchBranches();
//     fetchHistory();
//   }, []);

//   // Fetch Users when role/branch changes or specific targeting is toggled
//   useEffect(() => {
//     if (isSpecificTargeting) {
//       fetchUsers();
//     }
//   }, [isSpecificTargeting, formData.targetRole, formData.targetBranch]);

//   const fetchBranches = async () => {
//     try {
//       const response = await apiClient.get(API_ENDPOINTS.SUPER_ADMIN.BRANCHES.LIST);
//       if (response.success) {
//         setBranches(response.data.branches || response.data || []);
//       }
//     } catch (error) {
//       console.error('Failed to fetch branches:', error);
//       toast.error('Failed to load branches');
//     } finally {
//       setBranchesLoading(false);
//     }
//   };

//   const fetchUsers = async () => {
//     setUsersLoading(true);
//     try {
//       const params = {
//         role: formData.targetRole,
//         branchId: formData.targetBranch,
//         format: 'dropdown'
//       };
//       console.log('🔍 Fetching users with params:', params);
//       console.log('📍 Endpoint:', API_ENDPOINTS.SUPER_ADMIN.USERS.LIST);

//       const response = await apiClient.get(API_ENDPOINTS.SUPER_ADMIN.USERS.LIST, params);
//       console.log('✅ Users response:', response);

//       if (response.success) {
//         setAvailableUsers(response.data);
//       } else {
//         console.error('❌ Failed response:', response);
//         setAvailableUsers([]);
//       }
//     } catch (error) {
//       console.error('Failed to fetch users:', error);
//       toast.error(`Failed to load users: ${error.message || 'Network error'}`);
//       setAvailableUsers([]);
//     } finally {
//       setUsersLoading(false);
//     }
//   };

//   const fetchHistory = async () => {
//     try {
//       if (!API_ENDPOINTS.NOTIFICATIONS?.HISTORY) {
//         setHistoryLoading(false);
//         return;
//       }

//       const response = await apiClient.get(API_ENDPOINTS.NOTIFICATIONS.HISTORY);
//       if (response.success && response.data) {
//         const notifications = Array.isArray(response.data)
//           ? response.data
//           : (response.data.notifications || []);
//         setHistory(notifications);
//       } else {
//         setHistory([]);
//       }
//     } catch (error) {
//       console.error('Failed to fetch history:', error);
//       setHistory([]);
//     } finally {
//       setHistoryLoading(false);
//     }
//   };

//   const handleChange = (e) => {
//     setFormData({ ...formData, [e.target.name]: e.target.value });
//     // Reset selection if role or branch changes
//     if (e.target.name === 'targetRole' || e.target.name === 'targetBranch') {
//       setSelectedUserIds([]);
//     }
//   };

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     setLoading(true);

//     try {
//       const payload = {
//         ...formData,
//         targetUserIds: isSpecificTargeting ? selectedUserIds : undefined,
//       };

//       if (isSpecificTargeting && selectedUserIds.length === 0) {
//         toast.error('Please select at least one user');
//         setLoading(false);
//         return;
//       }

//       const response = await apiClient.post(API_ENDPOINTS.NOTIFICATIONS.SEND, payload);

//       if (response.success) {
//         let targetDesc = '';

//         if (isSpecificTargeting) {
//           targetDesc = `${selectedUserIds.length} specific users`;
//         } else if (formData.targetRole === 'all') {
//           targetDesc = formData.targetBranch === 'all'
//             ? 'everyone (all roles, all branches)'
//             : `everyone in ${branches.find(b => b._id === formData.targetBranch)?.name || 'selected branch'}`;
//         } else if (formData.targetRole === 'branch_admin') {
//           targetDesc = formData.targetBranch === 'all'
//             ? 'all branch admins'
//             : `branch admin of ${branches.find(b => b._id === formData.targetBranch)?.name || 'selected branch'}`;
//         } else {
//           targetDesc = formData.targetBranch === 'all'
//             ? `all ${formData.targetRole}s (all branches)`
//             : `${formData.targetRole}s in ${branches.find(b => b._id === formData.targetBranch)?.name || 'selected branch'}`;
//         }

//         toast.success(`✅ Notification sent to ${targetDesc}!`);
//         setFormData({
//           ...formData,
//           title: '',
//           message: '',
//         });
//         setSelectedUserIds([]);
//         setIsSpecificTargeting(false);
//         fetchHistory();
//       } else {
//         toast.error(`❌ Error: ${response.message || 'Failed to send'}`);
//       }
//     } catch (error) {
//       console.error(error);
//       toast.error('❌ Server Error');
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <div className="p-6 max-w-5xl mx-auto space-y-8">

//       {/* Send Notification Card */}
//       <Card>
//         <CardHeader>
//           <div className="flex items-center gap-3">
//             <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
//               <Bell className="w-6 h-6 text-blue-600 dark:text-blue-400" />
//             </div>
//             <div>
//               <CardTitle>Super Admin Notification Center</CardTitle>
//               <CardDescription>
//                 Send announcements and alerts to specific branches or all coachings in the network.
//               </CardDescription>
//             </div>
//           </div>
//         </CardHeader>

//         <CardContent>
//         <CardContent>
//           <form onSubmit={handleSubmit} className="space-y-6">

//             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

//               {/* Target Branch */}
//               <div className="space-y-3">
//                 <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">
//                   Target Branch
//                 </label>
//                 <Dropdown
//                   name="targetBranch"
//                   value={formData.targetBranch}
//                   onChange={handleChange}
//                   options={[
//                     { value: 'all', label: '🌍 All Branches (Global)' },
//                     ...branches.map(b => ({ value: b._id, label: `🏢 ${b.name} (${b.code})` }))
//                   ]}
//                   icon={Building2}
//                   placeholder={branchesLoading ? "Loading branches..." : "Select Branch"}
//                   disabled={branchesLoading}
//                 />
//               </div>

//               {/* Target Role */}
//               <div className="space-y-3">
//                 <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">
//                   Send To
//                 </label>
//                 <Dropdown
//                   name="targetRole"
//                   value={formData.targetRole}
//                   onChange={handleChange}
//                   options={TARGET_ROLES}
//                   icon={Users}
//                   placeholder="Select Role"
//                 />

//                 {/* Specific Targeting Toggle */}
//                 <div className="flex items-center gap-2 pt-1">
//                   <input
//                     type="checkbox"
//                     id="specificTarget"
//                     checked={isSpecificTargeting}
//                     onChange={(e) => setIsSpecificTargeting(e.target.checked)}
//                     className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
//                   />
//                   <label htmlFor="specificTarget" className="text-sm text-gray-600 dark:text-gray-400 cursor-pointer select-none">
//                     Select specific people only
//                   </label>
//                 </div>
//               </div>
//             </div>

//             {/* Multi Select for Specific Users */}
//             {isSpecificTargeting && (
//               <div className="animate-in fade-in slide-in-from-top-2 duration-200">
//                 <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1.5">
//                   Select Recipients ({availableUsers.length} available)
//                 </label>
//                 <MultiSelectDropdown
//                   options={availableUsers}
//                   value={selectedUserIds}
//                   onChange={(e) => setSelectedUserIds(e.target.value)}
//                   placeholder={usersLoading ? "Loading users..." : "Search and select users..."}
//                   disabled={usersLoading}
//                 />
//                 {usersLoading && <p className="text-xs text-muted-foreground mt-1">Fetching users...</p>}
//               </div>
//             )}
//             {/* Multi Select for Specific Users */}
//             {isSpecificTargeting && (
//               <div className="animate-in fade-in slide-in-from-top-2 duration-200">
//                 <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1.5">
//                   Select Recipients ({availableUsers.length} available)
//                 </label>
//                 <MultiSelectDropdown
//                   options={availableUsers}
//                   value={selectedUserIds}
//                   onChange={(e) => setSelectedUserIds(e.target.value)}
//                   placeholder={usersLoading ? "Loading users..." : "Search and select users..."}
//                   disabled={usersLoading}
//                 />
//                 {usersLoading && <p className="text-xs text-muted-foreground mt-1">Fetching users...</p>}
//               </div>
//             )}

//             <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
//               {/* Notification Type */}
//               <div>
//                 <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1.5">
//                   Type
//                 </label>
//                 <Dropdown
//                   name="type"
//                   value={formData.type}
//                   onChange={handleChange}
//                   options={NOTIFICATION_TYPES}
//                   icon={Megaphone}
//                   placeholder="Select Type"
//                 />
//               </div>
//             <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
//               {/* Notification Type */}
//               <div>
//                 <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1.5">
//                   Type
//                 </label>
//                 <Dropdown
//                   name="type"
//                   value={formData.type}
//                   onChange={handleChange}
//                   options={NOTIFICATION_TYPES}
//                   icon={Megaphone}
//                   placeholder="Select Type"
//                 />
//               </div>

//               {/* Title */}
//               <div className="md:col-span-2">
//                 <Input
//                   label="Subject / Title"
//                   type="text"
//                   name="title"
//                   required
//                   placeholder="e.g. Important Coaching Announcement"
//                   value={formData.title}
//                   onChange={handleChange}
//                   icon={Type}
//                 />
//               </div>
//             </div>
//               {/* Title */}
//               <div className="md:col-span-2">
//                 <Input
//                   label="Subject / Title"
//                   type="text"
//                   name="title"
//                   required
//                   placeholder="e.g. Important Coaching Announcement"
//                   value={formData.title}
//                   onChange={handleChange}
//                   icon={Type}
//                 />
//               </div>
//             </div>

//             {/* Message */}
//             <Textarea
//               label="Message Content"
//               name="message"
//               required
//               rows={5}
//               placeholder="Type your message here..."
//               value={formData.message}
//               onChange={handleChange}
//             />

//             <div className="pt-4 flex justify-end gap-3 border-t dark:border-gray-800">
//               <Button type="button" variant="outline" onClick={() => router.back()}>
//                 Cancel
//               </Button>
//               <Button type="submit" disabled={loading}>
//                 {loading ? <ButtonLoader /> : (
//                   <>
//                     <Bell className="w-4 h-4 mr-2" />
//                     {isSpecificTargeting
//                       ? `Send to ${selectedUserIds.length} Users`
//                       : formData.targetRole === 'all'
//                         ? (formData.targetBranch === 'all'
//                           ? 'Broadcast to Everyone (All Branches)'
//                           : 'Send to Everyone in Branch')
//                         : formData.targetRole === 'branch_admin'
//                           ? (formData.targetBranch === 'all'
//                             ? 'Send to All Branch Admins'
//                             : 'Send to Branch Admin')
//                           : (formData.targetBranch === 'all'
//                             ? `Broadcast to All ${formData.targetRole}s`
//                             : `Send to ${formData.targetRole}s in Branch`)}
//                   </>
//                 )}
//               </Button>
//             </div>

//           </form>
//         </CardContent>
//       </Card>

//       {/* History Section */}
//       <div className="space-y-4">
//         <h3 className="text-lg font-semibold flex items-center gap-2 text-gray-800 dark:text-gray-200">
//           <History className="w-5 h-5" />
//           Recent Campaigns
//         </h3>

//         {historyLoading ? (
//           <div className="text-center py-8 text-gray-500">Loading history...</div>
//         ) : !Array.isArray(history) || history.length === 0 ? (
//           <div className="text-center py-8 text-gray-500 bg-gray-50 dark:bg-gray-800 rounded-lg">
//             No notifications sent recently.
//           </div>
//         ) : (
//           <div className="grid gap-4">
//             {history.map((item, index) => (
//               <Card key={index} className="overflow-hidden hover:shadow-md transition-shadow group border-l-4 border-l-indigo-500">
//                 <div className="p-4 flex flex-col lg:flex-row gap-4 justify-between items-start lg:items-center">
//                   <div className="space-y-1 flex-1">
//                     <div className="flex items-center flex-wrap gap-2">
//                       <span className={`px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-100 text-indigo-700 uppercase`}>
//                         {item.type || 'general'}
//                       </span>
//                       <span className="text-xs text-gray-400 flex items-center gap-1">
//                         <Clock className="w-3 h-3" />
//                         {new Date(item.createdAt).toLocaleString()}
//                       </span>
//                       <span className="text-xs font-medium px-2 py-0.5 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center gap-1 text-gray-600 dark:text-gray-400">
//                         <ShieldCheck className="w-3 h-3" />
//                         By: {item.senderName} ({item.senderRole})
//                       </span>
//                     </div>
//                     <h4 className="font-bold text-gray-900 dark:text-white uppercase text-sm mt-1">{item.title}</h4>
//                     <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-1">{item.message}</p>
//                   </div>

//                   <div className="flex flex-wrap items-center gap-5 text-sm">
//                     <div className="text-right">
//                       <p className="text-[10px] uppercase font-bold text-gray-400">Recipients</p>
//                       <p className="font-bold text-gray-900 dark:text-gray-100">{item.recipientCount || 0}</p>
//                     </div>
//                     <div className="text-right">
//                       <p className="text-[10px] uppercase font-bold text-green-500">Parha Gaya</p>
//                       <p className="font-bold text-green-600">{item.readCount || 0}</p>
//                     </div>
//                     <div className="text-right border-r dark:border-gray-800 pr-5">
//                       <p className="text-[10px] uppercase font-bold text-orange-400">Pending</p>
//                       <p className="font-bold text-orange-600">{item.unreadCount || 0}</p>
//                     </div>

//                     <Button
//                       size="sm"
//                       variant="outline"
//                       className="bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800/30 hover:bg-indigo-600 hover:text-white transition-all"
//                       onClick={() => {
//                         setSelectedCampaign(item);
//                         setShowStatsModal(true);
//                       }}
//                     >
//                       <BarChart3 className="w-4 h-4 mr-1.5" />
//                       Full Track Report
//                     </Button>
//                   </div>
//                 </div>
//               </Card>
//             ))}
//           </div>
//         )}
//       </div>

//       {/* Notification Stats Modal */}
//       {showStatsModal && (
//         <NotificationStatsModal
//           notification={selectedCampaign}
//           onClose={() => {
//             setShowStatsModal(false);
//             setSelectedCampaign(null);
//           }}
//         />
//       )}

//     </div>
//   );
// }


'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import apiClient from '@/lib/api-client';
import { API_ENDPOINTS } from '@/constants/api-endpoints';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Input from '@/components/ui/input';
import Textarea from '@/components/ui/textarea';
import Dropdown from '@/components/ui/dropdown';
import MultiSelectDropdown from '@/components/ui/multi-select';
import ButtonLoader from '@/components/ui/button-loader';
import { Bell, Users, Type, Building2, Megaphone, History, Clock, ShieldCheck, BarChart3, ChevronLeft, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';
import NotificationStatsModal from '@/components/NotificationStatsModal';
import { NotificationSkeleton } from '@/components/ui/skeleton';

// Notification Types (Fixed duplicates)
const NOTIFICATION_TYPES = [
  { value: 'announcement', label: '📢 Announcement' },
  { value: 'general', label: 'ℹ️ General' },
  { value: 'assignment', label: '📝 Assignment' },
  { value: 'fee_reminder', label: '💰 Fee Reminder' },
  { value: 'event', label: '🎉 Event' },
  { value: 'holiday', label: '🏖️ Holiday' },
  { value: 'exam', label: '🎓 Exam Update' },
  { value: 'result', label: '📊 Result Declared' },
];

const TARGET_ROLES = [
  { value: 'all', label: '🌐 All (Everyone)' },
  { value: 'branch_admin', label: '🔑 Branch Admins' },
  { value: 'student', label: '👨‍👩‍👦 Parents' }, // Using student value to keep section targeting logic intact
  { value: 'teacher', label: '👩‍🏫 Teachers' },
  { value: 'staff', label: '💼 Staff' },
];

export default function SuperAdminNotification() {
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [branchesLoading, setBranchesLoading] = useState(true);
  const [usersLoading, setUsersLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [academicLoading, setAcademicLoading] = useState(true);

  // Branches State
  const [branches, setBranches] = useState([]);

  // Specific Targeting State
  const [isSpecificTargeting, setIsSpecificTargeting] = useState(false);
  const [availableUsers, setAvailableUsers] = useState([]);
  const [selectedUserIds, setSelectedUserIds] = useState([]);

  // History & Tracking State
  const [history, setHistory] = useState([]);
  const [showStatsModal, setShowStatsModal] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState(null);

  const [formData, setFormData] = useState({
    title: '',
    message: '',
    type: 'announcement',
    targetRole: 'all',
    targetBranch: 'all',
    targetGroup: 'all',
    targetClass: 'all',
    targetSection: 'all',
  });

  // Academic states
  const [academicData, setAcademicData] = useState({
    groups: [],
    classes: [],
    sections: []
  });
  const [isSectionTargeting, setIsSectionTargeting] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // Fetch Branches, History, and Academic Data on mount
  useEffect(() => {
    fetchBranches();
    fetchHistory();
    fetchAcademicData();
  }, []);

  const fetchAcademicData = async () => {
    try {
      const [groupsRes, classesRes, sectionsRes] = await Promise.all([
        apiClient.get('/api/groups'),
        apiClient.get('/api/classes'),
        apiClient.get('/api/sections')
      ]);

      setAcademicData({
        groups: Array.isArray(groupsRes) ? groupsRes : (groupsRes?.groups || []),
        classes: Array.isArray(classesRes) ? classesRes : (classesRes?.classes || []),
        sections: Array.isArray(sectionsRes) ? sectionsRes : (sectionsRes?.sections || [])
      });
    } catch (error) {
      console.error('Failed to fetch academic data:', error);
    } finally {
      setAcademicLoading(false);
    }
  };

  // Fetch Users when role/branch changes or specific targeting is toggled
  useEffect(() => {
    if (isSpecificTargeting && (formData.targetRole !== 'all' || formData.targetBranch !== 'all')) {
      fetchUsers();
    } else {
      setAvailableUsers([]);
      setSelectedUserIds([]);
    }
  }, [isSpecificTargeting, formData.targetRole, formData.targetBranch]);

  const fetchBranches = async () => {
    try {
      const response = await apiClient.get(API_ENDPOINTS.SUPER_ADMIN.BRANCHES.LIST);
      if (response.success) {
        const branchesData = response.data?.branches || response.data || [];
        setBranches(Array.isArray(branchesData) ? branchesData : []);
      }
    } catch (error) {
      console.error('Failed to fetch branches:', error);
      toast.error('Failed to load branches');
    } finally {
      setBranchesLoading(false);
    }
  };

  const fetchUsers = async () => {
    if (formData.targetRole === 'all' && formData.targetBranch === 'all') {
      setAvailableUsers([]);
      return;
    }

    setUsersLoading(true);
    try {
      const params = {
        role: formData.targetRole !== 'all' ? formData.targetRole : undefined,
        branchId: formData.targetBranch !== 'all' ? formData.targetBranch : undefined,
        format: 'dropdown'
      };

      const response = await apiClient.get(API_ENDPOINTS.SUPER_ADMIN.USERS.LIST, { params });
      
      if (response.success && response.data) {
        const users = Array.isArray(response.data) ? response.data : [];
        setAvailableUsers(users.map(user => ({
          value: user._id || user.id,
          label: user.name || user.email || 'Unknown User'
        })));
      } else {
        setAvailableUsers([]);
      }
    } catch (error) {
      console.error('Failed to fetch users:', error);
      toast.error(`Failed to load users: ${error.message || 'Network error'}`);
      setAvailableUsers([]);
    } finally {
      setUsersLoading(false);
    }
  };

  const fetchHistory = async () => {
    try {
      if (!API_ENDPOINTS.NOTIFICATIONS?.HISTORY) {
        setHistoryLoading(false);
        return;
      }

      const response = await apiClient.get(API_ENDPOINTS.NOTIFICATIONS.HISTORY);
      if (response.success && response.data) {
        const notifications = Array.isArray(response.data)
          ? response.data
          : (response.data.notifications || []);
        setHistory(notifications);
      } else {
        setHistory([]);
      }
    } catch (error) {
      console.error('Failed to fetch history:', error);
      setHistory([]);
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Reset user selection if role or branch changes
    if (name === 'targetRole' || name === 'targetBranch') {
      setSelectedUserIds([]);
      if (isSpecificTargeting) {
        fetchUsers();
      }
    }
    // Handle dependent academic dropdowns
    if (name === 'targetGroup') {
      setFormData(prev => ({ ...prev, [name]: value, targetClass: 'all', targetSection: 'all' }));
    } else if (name === 'targetClass') {
      setFormData(prev => ({ ...prev, [name]: value, targetSection: 'all' }));
    }
  };

  const handleMultiSelectChange = (e) => {
    setSelectedUserIds(e.target.value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (isSpecificTargeting && selectedUserIds.length === 0) {
      toast.error('Please select at least one user');
      return;
    }

    if (!formData.title.trim() || !formData.message.trim()) {
      toast.error('Please fill in both title and message');
      return;
    }

    setLoading(true);

    try {
      const payload = {
        title: formData.title.trim(),
        message: formData.message.trim(),
        type: formData.type,
        branch_id: formData.targetBranch === 'all' ? null : formData.targetBranch,
        targetRoles: formData.targetRole === 'all' ? [] : [formData.targetRole],
        targetUserIds: isSpecificTargeting ? selectedUserIds : undefined,
        targetSectionId: isSectionTargeting && formData.targetSection !== 'all' ? formData.targetSection : undefined,
        sendToAll: !isSpecificTargeting && !isSectionTargeting && formData.targetRole === 'all' && formData.targetBranch === 'all',
      };

      // If they selected a specific branch and 'all' roles, they want to send to all users in that branch
      if (!isSpecificTargeting && formData.targetRole === 'all' && formData.targetBranch !== 'all') {
        payload.sendToAll = true;
      }

      const response = await apiClient.post(API_ENDPOINTS.NOTIFICATIONS.SEND, payload);

      if (response.success) {
        let targetDesc = '';

        if (isSpecificTargeting) {
          targetDesc = `${selectedUserIds.length} specific users`;
        } else if (isSectionTargeting && formData.targetSection !== 'all') {
          const sectionName = academicData.sections.find(s => s.id === formData.targetSection)?.name || 'selected section';
          targetDesc = `parents in Section ${sectionName}`;
        } else if (formData.targetRole === 'all') {
          targetDesc = formData.targetBranch === 'all'
            ? 'everyone (all roles, all branches)'
            : `everyone in ${branches.find(b => b._id === formData.targetBranch)?.name || 'selected branch'}`;
        } else if (formData.targetRole === 'branch_admin') {
          targetDesc = formData.targetBranch === 'all'
            ? 'all branch admins'
            : `branch admin of ${branches.find(b => b._id === formData.targetBranch)?.name || 'selected branch'}`;
        } else {
          targetDesc = formData.targetBranch === 'all'
            ? `all ${formData.targetRole}s (all branches)`
            : `${formData.targetRole}s in ${branches.find(b => b._id === formData.targetBranch)?.name || 'selected branch'}`;
        }

        toast.success(`✅ Notification sent to ${targetDesc}!`);
        
        // Reset form
        setFormData({
          title: '',
          message: '',
          type: 'announcement',
          targetRole: 'all',
          targetBranch: 'all',
          targetGroup: 'all',
          targetClass: 'all',
          targetSection: 'all',
        });
        setSelectedUserIds([]);
        setIsSpecificTargeting(false);
        setIsSectionTargeting(false);
        
        // Refresh history
        fetchHistory();
      } else {
        toast.error(`❌ Error: ${response.message || 'Failed to send notification'}`);
      }
    } catch (error) {
      console.error('Notification send error:', error);
      toast.error(error?.message || '❌ Server Error: Failed to send notification');
    } finally {
      setLoading(false);
    }
  };

  if (branchesLoading || historyLoading || academicLoading) {
    return <NotificationSkeleton />;
  }

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-8">
      {/* Send Notification UI Redesign */}
      <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-visible">
        <div className="p-8 border-b border-gray-100 dark:border-gray-800 bg-gradient-to-r from-indigo-50/50 to-blue-50/50 dark:from-indigo-900/10 dark:to-blue-900/10">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white dark:bg-gray-800 shadow-sm rounded-xl border border-indigo-100 dark:border-indigo-900/30 text-indigo-600 dark:text-indigo-400">
              <Megaphone className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">New Broadcast Campaign</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Configure your audience and craft your message below.
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
            
            {/* Left Column: Audience Selection */}
            <div className="lg:col-span-5 space-y-8">
              <div>
                <h3 className="text-base font-semibold flex items-center gap-2 mb-4 text-gray-800 dark:text-gray-200">
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 text-xs font-bold">1</span>
                  Target Audience
                </h3>
                
                <div className="space-y-5 p-5 rounded-2xl bg-gray-50/50 dark:bg-gray-800/30 border border-gray-100 dark:border-gray-800">
                  {/* Target Branch */}
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Select Campus
                    </label>
                    <Dropdown
                      name="targetBranch"
                      value={formData.targetBranch}
                      onChange={handleChange}
                      options={[
                        { value: 'all', label: '🌍 All Branches (Global)' },
                        ...branches.map(b => ({ 
                          value: b._id || b.id, 
                          label: `🏢 ${b.name || 'Unknown'} (${b.code || 'N/A'})` 
                        }))
                      ]}
                      icon={Building2}
                      placeholder={branchesLoading ? "Loading branches..." : "Select Branch"}
                      disabled={branchesLoading}
                    />
                  </div>

                  {/* Target Role */}
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Select Role
                    </label>
                    <Dropdown
                      name="targetRole"
                      value={formData.targetRole}
                      onChange={handleChange}
                      options={TARGET_ROLES}
                      icon={Users}
                      placeholder="Select Role"
                    />
                  </div>

                  {/* Specific & Section Toggles */}
                  <div className="pt-2 flex flex-col gap-3">
                    <label className="flex items-center gap-3 p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors">
                      <div className="relative flex items-center">
                        <input
                          type="checkbox"
                          checked={isSpecificTargeting}
                          onChange={(e) => {
                            setIsSpecificTargeting(e.target.checked);
                            if (e.target.checked) setIsSectionTargeting(false);
                          }}
                          className="peer sr-only"
                        />
                        <div className="w-10 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-gray-600 peer-checked:bg-indigo-600"></div>
                      </div>
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Select specific individuals</span>
                    </label>

                    {(formData.targetRole === 'student' || formData.targetRole === 'all') && (
                      <label className="flex items-center gap-3 p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors">
                        <div className="relative flex items-center">
                          <input
                            type="checkbox"
                            checked={isSectionTargeting}
                            onChange={(e) => {
                              setIsSectionTargeting(e.target.checked);
                              if (e.target.checked) {
                                setIsSpecificTargeting(false);
                                if (formData.targetRole === 'all') {
                                  setFormData(prev => ({ ...prev, targetRole: 'student' }));
                                }
                              }
                            }}
                            className="peer sr-only"
                          />
                          <div className="w-10 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-gray-600 peer-checked:bg-blue-500"></div>
                        </div>
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Target specific class section</span>
                      </label>
                    )}
                  </div>
                  
                  {/* Multi Select for Specific Users */}
                  {isSpecificTargeting && (
                    <div className="animate-in fade-in slide-in-from-top-2 duration-300 pt-2">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                        Selected Individuals ({availableUsers.length} available)
                      </label>
                      <MultiSelectDropdown
                        options={availableUsers}
                        value={selectedUserIds}
                        onChange={handleMultiSelectChange}
                        placeholder={usersLoading ? "Loading users..." : "Search users..."}
                        disabled={usersLoading}
                      />
                      {usersLoading && <p className="text-xs text-indigo-500 mt-1 animate-pulse">Loading directory...</p>}
                    </div>
                  )}

                </div>
              </div>
            </div>

            {/* Right Column: Message Content */}
            <div className="lg:col-span-7 space-y-8">
              <div>
                <h3 className="text-base font-semibold flex items-center gap-2 mb-4 text-gray-800 dark:text-gray-200">
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 text-xs font-bold">2</span>
                  Message Composition
                </h3>

                <div className="space-y-6">
                  {/* Academic Targeting Dropdowns (Inline if section targeting active) */}
                  {isSectionTargeting && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-in fade-in slide-in-from-right-4 duration-300 p-4 rounded-2xl bg-blue-50/50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800/50">
                      <div className="space-y-1.5">
                        <label className="block text-xs font-semibold text-blue-800 dark:text-blue-300 uppercase tracking-wider">Group</label>
                        <Dropdown
                          name="targetGroup"
                          value={formData.targetGroup}
                          onChange={handleChange}
                          options={[
                            { value: 'all', label: 'All Groups' },
                            ...academicData.groups
                              .filter(g => g.is_active && (formData.targetBranch === 'all' || !g.branch_id || g.branch_id === formData.targetBranch))
                              .map(g => ({ value: g.id, label: g.name }))
                          ]}
                          placeholder="Select Group"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="block text-xs font-semibold text-blue-800 dark:text-blue-300 uppercase tracking-wider">Class</label>
                        <Dropdown
                          name="targetClass"
                          value={formData.targetClass}
                          onChange={handleChange}
                          options={[
                            { value: 'all', label: 'All Classes' },
                            ...academicData.classes
                              .filter(c => c.is_active && 
                                           (formData.targetGroup === 'all' || c.group_id === formData.targetGroup) &&
                                           (formData.targetBranch === 'all' || !c.branch_id || c.branch_id === formData.targetBranch))
                              .map(c => ({ value: c.id, label: c.name }))
                          ]}
                          placeholder="Select Class"
                          disabled={formData.targetGroup === 'all'}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="block text-xs font-semibold text-blue-800 dark:text-blue-300 uppercase tracking-wider">Section</label>
                        <Dropdown
                          name="targetSection"
                          value={formData.targetSection}
                          onChange={handleChange}
                          options={[
                            { value: 'all', label: 'All Sections' },
                            ...academicData.sections
                              .filter(s => s.is_active && 
                                           (formData.targetClass === 'all' || s.class_id === formData.targetClass))
                              .map(s => ({ value: s.id, label: s.name }))
                          ]}
                          placeholder="Select Section"
                          disabled={formData.targetClass === 'all'}
                        />
                      </div>
                    </div>
                  )}

                  <div className="flex gap-4 items-start">
                    <div className="w-1/3 space-y-2">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Category
                      </label>
                      <Dropdown
                        name="type"
                        value={formData.type}
                        onChange={handleChange}
                        options={NOTIFICATION_TYPES}
                        placeholder="Select Type"
                      />
                    </div>
                    <div className="flex-1 space-y-2">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Subject Line
                      </label>
                      <Input
                        type="text"
                        name="title"
                        required
                        placeholder="e.g. Important Campus Update"
                        value={formData.title}
                        onChange={handleChange}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Message Body
                    </label>
                    <Textarea
                      name="message"
                      required
                      rows={6}
                      placeholder="Type your notification message here..."
                      value={formData.message}
                      onChange={handleChange}
                      className="resize-none"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-10 pt-6 border-t border-gray-100 dark:border-gray-800 flex justify-end gap-4 items-center">
            <Button type="button" variant="ghost" onClick={() => router.back()} className="text-gray-500 hover:text-gray-700">
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={loading}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 shadow-md hover:shadow-lg transition-all rounded-xl"
            >
              {loading ? <ButtonLoader /> : (
                <span className="flex items-center font-medium">
                  <Megaphone className="w-4 h-4 mr-2" />
                  {isSpecificTargeting
                    ? `Send to ${selectedUserIds.length} Users`
                    : formData.targetRole === 'all'
                      ? (formData.targetBranch === 'all' ? 'Broadcast to Everyone' : 'Broadcast to Branch')
                      : 'Send Notification'}
                </span>
              )}
            </Button>
          </div>
        </form>
      </div>

      {/* History Section */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold flex items-center gap-2 text-gray-800 dark:text-gray-200">
          <History className="w-5 h-5" />
          Recent Campaigns
        </h3>

        {historyLoading ? (
          <div className="text-center py-8 text-gray-500">Loading history...</div>
        ) : !Array.isArray(history) || history.length === 0 ? (
          <div className="text-center py-8 text-gray-500 bg-gray-50 dark:bg-gray-800 rounded-lg">
            No notifications sent recently.
          </div>
        ) : (
          <div className="space-y-6">
            <div className="grid gap-4">
              {history
                .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
                .map((item, index) => {
                  const total = item.recipientCount || 0;
                  const read = item.readCount || 0;
                  const readPercent = total > 0 ? Math.round((read / total) * 100) : 0;
                  
                  return (
                    <div key={item._id || index} className="group relative bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-5 hover:shadow-xl transition-all duration-300 overflow-hidden">
                      {/* Decorative background element */}
                      <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-indigo-900/10 dark:to-blue-900/10 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
                      
                      <div className="relative z-10 flex flex-col lg:flex-row gap-6 justify-between items-start lg:items-center">
                        
                        {/* Left: Message Info */}
                        <div className="space-y-3 flex-1 w-full">
                          <div className="flex items-center flex-wrap gap-2 mb-1">
                            <span className="px-2.5 py-1 rounded-md text-[10px] font-bold bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 uppercase tracking-wider border border-indigo-100 dark:border-indigo-800/50">
                              {item.type || 'general'}
                            </span>
                            <div className="flex items-center gap-1.5 text-xs text-gray-400 bg-gray-50 dark:bg-gray-800 px-2 py-1 rounded-md">
                              <Clock className="w-3.5 h-3.5" />
                              {item.createdAt ? new Date(item.createdAt).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' }) : 'Date not available'}
                            </div>
                          </div>
                          
                          <div>
                            <h4 className="font-bold text-gray-900 dark:text-white text-base">
                              {item.title || 'No Title'}
                            </h4>
                            <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-1 mt-0.5">
                              {item.message || 'No message content'}
                            </p>
                          </div>
                          
                          <div className="flex flex-wrap items-center gap-3 pt-1">
                            <span className="text-xs font-medium px-2 py-1 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800/30 rounded-lg flex items-center gap-1.5 text-blue-700 dark:text-blue-400">
                              <Building2 className="w-3.5 h-3.5" />
                              {item.branchName || 'All Branches'}
                            </span>
                            <span className="text-xs font-medium px-2 py-1 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg flex items-center gap-1.5 text-gray-600 dark:text-gray-300">
                              <ShieldCheck className="w-3.5 h-3.5 text-gray-400" />
                              By: <span className="text-gray-900 dark:text-gray-100">{item.senderName || 'Unknown'}</span> <span className="text-gray-400 ml-0.5">({item.senderRole || 'Unknown'})</span>
                            </span>
                          </div>
                        </div>

                        {/* Right: Stats & Action */}
                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 w-full lg:w-auto bg-gray-50/50 dark:bg-gray-800/20 p-4 rounded-xl border border-gray-100 dark:border-gray-800">
                          
                          {/* Progress Stats */}
                          <div className="flex-1 sm:w-48 space-y-2">
                            <div className="flex justify-between items-end mb-1">
                              <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Engagement</div>
                              <div className="text-xs font-bold text-indigo-600 dark:text-indigo-400">{readPercent}%</div>
                            </div>
                            {/* Progress Bar */}
                            <div className="h-2 w-full bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-gradient-to-r from-indigo-500 to-blue-500 rounded-full transition-all duration-1000"
                                style={{ width: `${readPercent}%` }}
                              ></div>
                            </div>
                          </div>

                          <Button
                            onClick={() => {
                              setSelectedCampaign(item);
                              setShowStatsModal(true);
                            }}
                            variant="outline"
                            className="w-full sm:w-auto border-indigo-200 dark:border-indigo-800 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 font-bold rounded-xl"
                          >
                            <BarChart3 className="w-4 h-4 mr-2" />
                            Track Status
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>

            {/* Pagination Controls */}
            {history.length > itemsPerPage && (
              <div className="flex items-center justify-between bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 p-4 rounded-2xl shadow-sm">
                <div className="text-sm text-gray-500 font-medium">
                  Showing <span className="text-gray-900 dark:text-white font-bold">{(currentPage - 1) * itemsPerPage + 1}</span> to <span className="text-gray-900 dark:text-white font-bold">{Math.min(currentPage * itemsPerPage, history.length)}</span> of <span className="text-gray-900 dark:text-white font-bold">{history.length}</span> campaigns
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className="rounded-xl border-gray-200 dark:border-gray-700 h-9 w-9 p-0"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <div className="flex items-center gap-1">
                    {[...Array(Math.ceil(history.length / itemsPerPage))].map((_, i) => {
                      const pageNum = i + 1;
                      // Only show current page, 1, last page, and neighbors
                      if (
                        pageNum === 1 || 
                        pageNum === Math.ceil(history.length / itemsPerPage) || 
                        (pageNum >= currentPage - 1 && pageNum <= currentPage + 1)
                      ) {
                        return (
                          <Button
                            key={pageNum}
                            variant={currentPage === pageNum ? "default" : "outline"}
                            size="sm"
                            onClick={() => setCurrentPage(pageNum)}
                            className={`h-9 w-9 p-0 rounded-xl ${currentPage === pageNum ? 'bg-indigo-600' : 'border-gray-200 dark:border-gray-700'}`}
                          >
                            {pageNum}
                          </Button>
                        );
                      } else if (
                        pageNum === currentPage - 2 || 
                        pageNum === currentPage + 2
                      ) {
                        return <span key={pageNum} className="text-gray-400 px-1">...</span>;
                      }
                      return null;
                    })}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.min(Math.ceil(history.length / itemsPerPage), prev + 1))}
                    disabled={currentPage === Math.ceil(history.length / itemsPerPage)}
                    className="rounded-xl border-gray-200 dark:border-gray-700 h-9 w-9 p-0"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Notification Stats Modal */}
      {showStatsModal && (
        <NotificationStatsModal
          notification={selectedCampaign}
          onClose={() => {
            setShowStatsModal(false);
            setSelectedCampaign(null);
          }}
        />
      )}
    </div>
  );
}