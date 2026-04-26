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
import { Bell, Users, Type, Building2, Megaphone, History, Clock, ShieldCheck, BarChart3 } from 'lucide-react';
import { toast } from 'sonner';
import NotificationStatsModal from '@/components/NotificationStatsModal';

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
  { value: 'student', label: '👨‍🎓 Students' },
  { value: 'parent', label: '👨‍👩‍👦 Parents' },
  { value: 'teacher', label: '👩‍🏫 Teachers' },
  { value: 'staff', label: '💼 Staff' },
];

export default function SuperAdminNotification() {
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [branchesLoading, setBranchesLoading] = useState(true);
  const [usersLoading, setUsersLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(true);

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
  });

  // Fetch Branches and History on mount
  useEffect(() => {
    fetchBranches();
    fetchHistory();
  }, []);

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
  };

  const handleMultiSelectChange = (selectedValues) => {
    setSelectedUserIds(selectedValues);
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
        targetRole: formData.targetRole,
        targetBranch: formData.targetBranch,
        ...(isSpecificTargeting && { targetUserIds: selectedUserIds })
      };

      const response = await apiClient.post(API_ENDPOINTS.NOTIFICATIONS.SEND, payload);

      if (response.success) {
        let targetDesc = '';

        if (isSpecificTargeting) {
          targetDesc = `${selectedUserIds.length} specific users`;
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
        });
        setSelectedUserIds([]);
        setIsSpecificTargeting(false);
        
        // Refresh history
        fetchHistory();
      } else {
        toast.error(`❌ Error: ${response.message || 'Failed to send notification'}`);
      }
    } catch (error) {
      console.error('Notification send error:', error);
      toast.error('❌ Server Error: Failed to send notification');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-8">
      {/* Send Notification Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
              <Bell className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <CardTitle>Super Admin Notification Center</CardTitle>
              <CardDescription>
                Send announcements and alerts to specific branches or all coachings in the network.
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Target Branch */}
              <div className="space-y-3">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">
                  Target Branch
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
              <div className="space-y-3">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">
                  Send To
                </label>
                <Dropdown
                  name="targetRole"
                  value={formData.targetRole}
                  onChange={handleChange}
                  options={TARGET_ROLES}
                  icon={Users}
                  placeholder="Select Role"
                />

                {/* Specific Targeting Toggle */}
                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="specificTarget"
                    checked={isSpecificTargeting}
                    onChange={(e) => setIsSpecificTargeting(e.target.checked)}
                    className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                  />
                  <label htmlFor="specificTarget" className="text-sm text-gray-600 dark:text-gray-400 cursor-pointer select-none">
                    Select specific people only
                  </label>
                </div>
              </div>
            </div>

            {/* Multi Select for Specific Users */}
            {isSpecificTargeting && (
              <div className="animate-in fade-in slide-in-from-top-2 duration-200">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1.5">
                  Select Recipients ({availableUsers.length} available)
                </label>
                <MultiSelectDropdown
                  options={availableUsers}
                  value={selectedUserIds}
                  onChange={handleMultiSelectChange}
                  placeholder={usersLoading ? "Loading users..." : "Search and select users..."}
                  disabled={usersLoading}
                />
                {usersLoading && <p className="text-xs text-muted-foreground mt-1">Fetching users...</p>}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Notification Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1.5">
                  Type
                </label>
                <Dropdown
                  name="type"
                  value={formData.type}
                  onChange={handleChange}
                  options={NOTIFICATION_TYPES}
                  icon={Megaphone}
                  placeholder="Select Type"
                />
              </div>

              {/* Title */}
              <div className="md:col-span-2">
                <Input
                  label="Subject / Title"
                  type="text"
                  name="title"
                  required
                  placeholder="e.g. Important Coaching Announcement"
                  value={formData.title}
                  onChange={handleChange}
                  icon={Type}
                />
              </div>
            </div>

            {/* Message */}
            <div>
              <Textarea
                label="Message Content"
                name="message"
                required
                rows={5}
                placeholder="Type your message here..."
                value={formData.message}
                onChange={handleChange}
              />
            </div>

            <div className="pt-4 flex justify-end gap-3 border-t dark:border-gray-800">
              <Button type="button" variant="outline" onClick={() => router.back()}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? <ButtonLoader /> : (
                  <>
                    <Bell className="w-4 h-4 mr-2" />
                    {isSpecificTargeting
                      ? `Send to ${selectedUserIds.length} Users`
                      : formData.targetRole === 'all'
                        ? (formData.targetBranch === 'all'
                          ? 'Broadcast to Everyone (All Branches)'
                          : 'Send to Everyone in Branch')
                        : formData.targetRole === 'branch_admin'
                          ? (formData.targetBranch === 'all'
                            ? 'Send to All Branch Admins'
                            : 'Send to Branch Admin')
                          : (formData.targetBranch === 'all'
                            ? `Broadcast to All ${formData.targetRole}s`
                            : `Send to ${formData.targetRole}s in Branch`)}
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

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
          <div className="grid gap-4">
            {history.map((item, index) => (
              <Card key={item._id || index} className="overflow-hidden hover:shadow-md transition-shadow group border-l-4 border-l-indigo-500">
                <div className="p-4 flex flex-col lg:flex-row gap-4 justify-between items-start lg:items-center">
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center flex-wrap gap-2">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-100 text-indigo-700 uppercase`}>
                        {item.type || 'general'}
                      </span>
                      <span className="text-xs text-gray-400 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {item.createdAt ? new Date(item.createdAt).toLocaleString() : 'Date not available'}
                      </span>
                      <span className="text-xs font-medium px-2 py-0.5 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center gap-1 text-gray-600 dark:text-gray-400">
                        <ShieldCheck className="w-3 h-3" />
                        By: {item.senderName || 'Unknown'} ({item.senderRole || 'Unknown'})
                      </span>
                    </div>
                    <h4 className="font-bold text-gray-900 dark:text-white uppercase text-sm mt-1">
                      {item.title || 'No Title'}
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-1">
                      {item.message || 'No message content'}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-5 text-sm">
                    <div className="text-right">
                      <p className="text-[10px] uppercase font-bold text-gray-400">Recipients</p>
                      <p className="font-bold text-gray-900 dark:text-gray-100">{item.recipientCount || 0}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] uppercase font-bold text-green-500">Parha Gaya</p>
                      <p className="font-bold text-green-600">{item.readCount || 0}</p>
                    </div>
                    <div className="text-right border-r dark:border-gray-800 pr-5">
                      <p className="text-[10px] uppercase font-bold text-orange-400">Pending</p>
                      <p className="font-bold text-orange-600">{item.unreadCount || 0}</p>
                    </div>

                    <Button
                      size="sm"
                      variant="outline"
                      className="bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800/30 hover:bg-indigo-600 hover:text-white transition-all"
                      onClick={() => {
                        setSelectedCampaign(item);
                        setShowStatsModal(true);
                      }}
                    >
                      <BarChart3 className="w-4 h-4 mr-1.5" />
                      Full Track Report
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
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