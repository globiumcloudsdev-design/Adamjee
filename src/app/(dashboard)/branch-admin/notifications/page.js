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
import { Bell, Users, Type, Info, FileText, Calendar, DollarSign, PartyPopper, Palmtree, Megaphone, History, Clock, CheckCircle, BarChart3, ShieldCheck, ChevronLeft, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';
import NotificationStatsModal from '@/components/NotificationStatsModal';
import { useAuth } from '@/hooks/useAuth';
import { NotificationSkeleton } from '@/components/ui/skeleton';

// Notification Types
const NOTIFICATION_TYPES = [
  { value: 'announcement', label: '📢 Announcement' },
  { value: 'general', label: 'ℹ️ General' },
  { value: 'assignment', label: '📝 Assignment' },
  { value: 'fee_reminder', label: '💰 Fee Reminder' },
  { value: 'event', label: '🎉 Event' },
  { value: 'holiday', label: '🏖️ Holiday' },
];

const TARGET_ROLES = [
  { value: 'student', label: '👨‍👩‍👦 Parents' },
  { value: 'teacher', label: '👩‍🏫 Teachers' },
  { value: 'staff', label: '💼 Staff' },
];

export default function BranchAdminNotification() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [usersLoading, setUsersLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [academicLoading, setAcademicLoading] = useState(true);

  // Specific Targeting State
  const [isSpecificTargeting, setIsSpecificTargeting] = useState(false);
  const [availableUsers, setAvailableUsers] = useState([]); // { value, label, subLabel }
  const [selectedUserIds, setSelectedUserIds] = useState([]);

  // History & Tracking State
  const [history, setHistory] = useState([]);
  const [showStatsModal, setShowStatsModal] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;
  const [formData, setFormData] = useState({
    title: '',
    message: '',
    type: 'announcement',
    targetRole: 'student',
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

  // Fetch Users when role changes or specific targeting is toggled
  useEffect(() => {
    if (isSpecificTargeting) {
      fetchUsers();
    }
  }, [isSpecificTargeting, formData.targetRole]);

  // Fetch History and Academic Data on mount
  useEffect(() => {
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

      // Filter academic data by branch admin's branch_id
      const branchId = user?.branch_id;
      setAcademicData({
        groups: (Array.isArray(groupsRes) ? groupsRes : (groupsRes?.groups || []))
          .filter(g => !branchId || !g.branch_id || g.branch_id === branchId),
        classes: (Array.isArray(classesRes) ? classesRes : (classesRes?.classes || []))
          .filter(c => !branchId || !c.branch_id || c.branch_id === branchId),
        sections: (Array.isArray(sectionsRes) ? sectionsRes : (sectionsRes?.sections || []))
      });
    } catch (error) {
      console.error('Failed to fetch academic data:', error);
    } finally {
      setAcademicLoading(false);
    }
  };

  const fetchUsers = async () => {
    setUsersLoading(true);
    try {
      const response = await apiClient.get(API_ENDPOINTS.USERS, { role: formData.targetRole });
      if (response.success) {
        setAvailableUsers(response.data);
      }
    } catch (error) {
      console.error('Failed to fetch users:', error);
      toast.error('Failed to load user list');
    } finally {
      setUsersLoading(false);
    }
  };

  const fetchHistory = async () => {
    try {
      // Safe check in case API_ENDPOINTS structure is not yet updated in browser cache/hot reload
      if (!API_ENDPOINTS.NOTIFICATIONS?.HISTORY) {
        setHistoryLoading(false);
        return;
      }

      const response = await apiClient.get(API_ENDPOINTS.NOTIFICATIONS.HISTORY);
      if (response.success && response.data) {
        // Extract notifications array from the response
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
    setFormData({ ...formData, [name]: value });
    // Reset selection if role changes
    if (name === 'targetRole') {
      setSelectedUserIds([]);
    }
    // Handle dependent academic dropdowns
    if (name === 'targetGroup') {
      setFormData(prev => ({ ...prev, [name]: value, targetClass: 'all', targetSection: 'all' }));
    } else if (name === 'targetClass') {
      setFormData(prev => ({ ...prev, [name]: value, targetSection: 'all' }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload = {
        title: formData.title,
        message: formData.message,
        type: formData.type,
        targetRoles: formData.targetRole ? [formData.targetRole] : [],
        targetUserIds: isSpecificTargeting ? selectedUserIds : undefined,
        targetSectionId: isSectionTargeting && formData.targetSection !== 'all' ? formData.targetSection : undefined,
        sendToAll: !isSpecificTargeting && !isSectionTargeting && !formData.targetRole, // Only true if neither role nor specific users are selected
      };

      if (isSpecificTargeting && selectedUserIds.length === 0) {
        toast.error('Please select at least one user');
        setLoading(false);
        return;
      }

      const response = await apiClient.post(API_ENDPOINTS.NOTIFICATIONS.SEND, payload);

      if (response.success) {
        toast.success(`✅ Sent successfully!`);
        setFormData({
          ...formData,
          title: '',
          message: '',
          // Keep type and role same for convenience
          targetGroup: 'all',
          targetClass: 'all',
          targetSection: 'all',
        });
        setSelectedUserIds([]);
        setIsSpecificTargeting(false);
        setIsSectionTargeting(false);
        fetchHistory(); // Refresh history
      } else {
        toast.error(`❌ Error: ${response.message || 'Failed to send'}`);
      }
    } catch (error) {
      console.error(error);
      toast.error(error?.message || '❌ Server Error');
    } finally {
      setLoading(false);
    }
  };

  if (historyLoading || academicLoading) {
    return <NotificationSkeleton />;
  }

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-8">

      {/* Send Notification UI Redesign */}
      <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-visible">
        <div className="p-8 border-b border-gray-100 dark:border-gray-800 bg-gradient-to-r from-blue-50/50 to-indigo-50/50 dark:from-blue-900/10 dark:to-indigo-900/10 rounded-t-3xl">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white dark:bg-gray-800 shadow-sm rounded-xl border border-blue-100 dark:border-blue-900/30 text-blue-600 dark:text-blue-400">
              <Megaphone className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Branch Notification Center</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Send announcements, reminders, and alerts to your branch.
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
            
            {/* Left Column: Audience Selection */}
            <div className="lg:col-span-5 space-y-8 relative z-50">
              <div>
                <h3 className="text-base font-semibold flex items-center gap-2 mb-4 text-gray-800 dark:text-gray-200">
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 text-xs font-bold">1</span>
                  Target Audience
                </h3>
                
                <div className="space-y-5 p-5 rounded-2xl bg-gray-50/50 dark:bg-gray-800/30 border border-gray-100 dark:border-gray-800">
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
                        <div className="w-10 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                      </div>
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Select specific individuals</span>
                    </label>

                    {(formData.targetRole === 'student' || formData.targetRole === 'parent') && (
                      <label className="flex items-center gap-3 p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors">
                        <div className="relative flex items-center">
                          <input
                            type="checkbox"
                            checked={isSectionTargeting}
                            onChange={(e) => {
                              setIsSectionTargeting(e.target.checked);
                              if (e.target.checked) setIsSpecificTargeting(false);
                            }}
                            className="peer sr-only"
                          />
                          <div className="w-10 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-gray-600 peer-checked:bg-indigo-500"></div>
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
                        onChange={(e) => setSelectedUserIds(e.target.value)}
                        placeholder={usersLoading ? "Loading users..." : "Search users..."}
                        disabled={usersLoading}
                      />
                      {usersLoading && <p className="text-xs text-blue-500 mt-1 animate-pulse">Loading directory...</p>}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Right Column: Message Content */}
            <div className="lg:col-span-7 space-y-8">
              <div>
                <h3 className="text-base font-semibold flex items-center gap-2 mb-4 text-gray-800 dark:text-gray-200">
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 text-xs font-bold">2</span>
                  Message Composition
                </h3>

                <div className="space-y-6">
                  {/* Academic Targeting Dropdowns */}
                  {isSectionTargeting && (formData.targetRole === 'student' || formData.targetRole === 'parent') && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-in fade-in slide-in-from-right-4 duration-300 p-4 rounded-2xl bg-indigo-50/50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800/50">
                      <div className="space-y-1.5">
                        <label className="block text-xs font-semibold text-indigo-800 dark:text-indigo-300 uppercase tracking-wider">Group</label>
                        <Dropdown
                          name="targetGroup"
                          value={formData.targetGroup}
                          onChange={handleChange}
                          options={[
                            { value: 'all', label: 'All Groups' },
                            ...academicData.groups
                              .filter(g => g.is_active)
                              .map(g => ({ value: g.id, label: g.name }))
                          ]}
                          placeholder="Select Group"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="block text-xs font-semibold text-indigo-800 dark:text-indigo-300 uppercase tracking-wider">Class</label>
                        <Dropdown
                          name="targetClass"
                          value={formData.targetClass}
                          onChange={handleChange}
                          options={[
                            { value: 'all', label: 'All Classes' },
                            ...academicData.classes
                              .filter(c => c.is_active && 
                                           (formData.targetGroup === 'all' || c.group_id === formData.targetGroup))
                              .map(c => ({ value: c.id, label: c.name }))
                          ]}
                          placeholder="Select Class"
                          disabled={formData.targetGroup === 'all'}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="block text-xs font-semibold text-indigo-800 dark:text-indigo-300 uppercase tracking-wider">Section</label>
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
                        placeholder="e.g. Important Branch Meeting"
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
                      placeholder="Type your message here..."
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
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 shadow-md hover:shadow-lg transition-all rounded-xl"
            >
              {loading ? <ButtonLoader /> : (
                <span className="flex items-center font-medium">
                  <Megaphone className="w-4 h-4 mr-2" />
                  {isSpecificTargeting ? `Send to ${selectedUserIds.length} Users` : 'Broadcast to Branch'}
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
                      <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/10 dark:to-indigo-900/10 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
                      
                      <div className="relative z-10 flex flex-col lg:flex-row gap-6 justify-between items-start lg:items-center">
                        
                        {/* Left: Message Info */}
                        <div className="space-y-3 flex-1 w-full">
                          <div className="flex items-center flex-wrap gap-2 mb-1">
                            <span className="px-2.5 py-1 rounded-md text-[10px] font-bold bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 uppercase tracking-wider border border-blue-100 dark:border-blue-800/50">
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
                            <span className="text-xs font-medium px-2 py-1 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg flex items-center gap-1.5 text-gray-600 dark:text-gray-300">
                              <ShieldCheck className="w-3.5 h-3.5 text-gray-400" />
                              By: <span className="text-gray-900 dark:text-gray-100">{item.senderName || 'Unknown'}</span> <span className="text-gray-400 ml-0.5">({item.senderRole || 'Branch Admin'})</span>
                            </span>
                          </div>
                        </div>

                        {/* Right: Stats & Action */}
                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 w-full lg:w-auto bg-gray-50/50 dark:bg-gray-800/20 p-4 rounded-xl border border-gray-100 dark:border-gray-800">
                          
                          {/* Progress Stats */}
                          <div className="flex-1 sm:w-48 space-y-2">
                            <div className="flex justify-between items-end mb-1">
                              <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Engagement</div>
                              <div className="text-xs font-bold text-blue-600 dark:text-blue-400">{readPercent}%</div>
                            </div>
                            {/* Progress Bar */}
                            <div className="h-2 w-full bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-blue-500 rounded-full transition-all duration-1000 ease-out"
                                style={{ width: `${readPercent}%` }}
                              />
                            </div>
                            
                            <div className="flex justify-between text-[10px] font-medium pt-1">
                              <span className="text-gray-500">Sent: <span className="text-gray-900 dark:text-gray-200 font-bold">{total}</span></span>
                              <span className="text-green-500">Read: <span className="font-bold">{read}</span></span>
                              <span className="text-orange-400">Unread: <span className="font-bold">{item.unreadCount || 0}</span></span>
                            </div>
                          </div>

                          <div className="w-full sm:w-auto border-t sm:border-t-0 sm:border-l border-gray-200 dark:border-gray-700 pt-4 sm:pt-0 sm:pl-6">
                            <Button
                              size="sm"
                              className="w-full bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800 hover:bg-blue-50 hover:text-blue-700 dark:hover:bg-blue-900/50 transition-all shadow-sm rounded-lg font-bold"
                              onClick={() => {
                                setSelectedCampaign(item);
                                setShowStatsModal(true);
                              }}
                            >
                              <BarChart3 className="w-4 h-4 mr-2" />
                              Track Status
                            </Button>
                          </div>
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
                            className={`h-9 w-9 p-0 rounded-xl ${currentPage === pageNum ? 'bg-blue-600' : 'border-gray-200 dark:border-gray-700'}`}
                          >
                            {pageNum}
                          </Button>
                        );
                      } else if (pageNum === currentPage - 2 || pageNum === currentPage + 2) {
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
