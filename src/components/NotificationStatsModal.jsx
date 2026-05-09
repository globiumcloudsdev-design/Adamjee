"use client";
import { useState, useEffect } from "react";
import { X, Users, CheckCircle, Clock, Search, BarChart3 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function NotificationStatsModal({ notification, onClose }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("all"); // 'all', 'read', 'unread'
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (notification?.id || notification?.notificationIds?.length) {
      fetchStats();
    }
  }, [notification]);

  const fetchStats = async () => {
    try {
      setLoading(true);
      setError(null);
      const token =
        localStorage.getItem("accessToken") || localStorage.getItem("token");

      // Use the notification's own ID, or the first from notificationIds array
      const notifId = notification.id || notification.notificationIds?.[0];
      if (!notifId) {
        setError("No notification ID found");
        setLoading(false);
        return;
      }

      const response = await fetch(
        `/api/notifications/stats?notificationId=${notifId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      const data = await response.json();
      if (data.success) {
        setStats(data.data);
      } else {
        setError(data.message || "Failed to fetch stats");
      }
    } catch (err) {
      console.error("Stats Fetch Error:", err);
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (!notification) return null;

  // Filter users based on tab and search
  const getFilteredUsers = () => {
    if (!stats) return [];
    let users = [];
    if (activeTab === "read") users = stats.readUsers || [];
    else if (activeTab === "unread") users = stats.unreadUsers || [];
    else users = [...(stats.readUsers || []), ...(stats.unreadUsers || [])];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      users = users.filter(
        (u) =>
          u.name?.toLowerCase().includes(q) ||
          u.email?.toLowerCase().includes(q) ||
          u.role?.toLowerCase().includes(q),
      );
    }
    return users;
  };

  const currentUsers = getFilteredUsers();

  // Role badge colors
  const getRoleBadge = (role) => {
    const colors = {
      SUPER_ADMIN: "bg-purple-100 text-purple-700 border-purple-200",
      BRANCH_ADMIN: "bg-blue-100 text-blue-700 border-blue-200",
      TEACHER: "bg-green-100 text-green-700 border-green-200",
      STUDENT: "bg-yellow-100 text-yellow-700 border-yellow-200",
      STAFF: "bg-gray-100 text-gray-700 border-gray-200",
    };
    return colors[role] || "bg-gray-100 text-gray-600 border-gray-200";
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal Container */}
      <div className="relative w-full max-w-4xl bg-gray-50 dark:bg-gray-900 rounded-3xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden border border-white/20 dark:border-gray-800">
        
        {/* Header - Fixed */}
        <div className="shrink-0 p-4 sm:p-5 bg-gradient-to-r from-indigo-600 via-indigo-700 to-blue-800 relative overflow-hidden">
          {/* Decorative Orbs */}
          <div className="absolute top-0 right-0 -mt-10 -mr-10 w-40 h-40 bg-white opacity-10 rounded-full blur-2xl pointer-events-none"></div>
          <div className="absolute bottom-0 left-0 -mb-10 -ml-10 w-40 h-40 bg-blue-400 opacity-20 rounded-full blur-2xl pointer-events-none"></div>

          <div className="flex justify-between items-start relative z-10">
            <div className="flex-1 pr-4">
              <div className="flex flex-wrap items-center gap-1.5 mb-1.5">
                <span className="text-[9px] px-2 py-0.5 rounded bg-white/20 text-white font-bold uppercase tracking-wider backdrop-blur-sm border border-white/20 shadow-sm">
                  {notification.type || "general"}
                </span>
                <span className="text-[9px] px-2 py-0.5 rounded bg-black/20 text-white/90 font-medium tracking-wide flex items-center gap-1 backdrop-blur-sm border border-black/10">
                  <Clock className="w-3 h-3" />
                  {new Date(notification.createdAt || notification.sentAt).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight leading-tight mb-1.5">
                {notification.title}
              </h2>
              <div className="inline-flex items-center gap-2 bg-white/10 px-2.5 py-1 rounded-lg border border-white/10 backdrop-blur-sm">
                <div className="h-5 w-5 rounded-full bg-indigo-500/50 flex items-center justify-center border border-white/20">
                  <Users className="w-2.5 h-2.5 text-white" />
                </div>
                <p className="text-indigo-50 text-[13px] font-medium">
                  Sent by <span className="font-bold text-white">{stats?.senderName || notification.senderName || "System"}</span>
                  {(stats?.senderRole || notification.senderRole) && (
                    <span className="opacity-75 font-normal ml-1">({stats?.senderRole || notification.senderRole})</span>
                  )}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 bg-black/10 hover:bg-black/30 rounded-full transition-all shrink-0 backdrop-blur-sm border border-white/10 text-white group"
            >
              <X className="h-4 w-4 group-hover:rotate-90 transition-transform duration-300" />
            </button>
          </div>
        </div>

        {/* Body - Single Scrollable Area */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {loading ? (
            <div className="p-6 sm:p-8 space-y-8">
              {/* Stats Skeletons */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[1, 2, 3].map(i => (
                  <Skeleton key={i} className="h-28 rounded-2xl w-full" />
                ))}
              </div>
              <Skeleton className="h-4 w-full rounded-full" />
              {/* List Skeletons */}
              <div className="space-y-4 pt-4">
                {[1, 2, 3, 4].map(i => (
                  <Skeleton key={i} className="h-20 w-full rounded-2xl" />
                ))}
              </div>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center p-20 gap-4 text-center">
              <div className="h-20 w-20 rounded-full bg-red-100/50 dark:bg-red-900/20 flex items-center justify-center mb-2">
                <X className="h-10 w-10 text-red-500" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">Failed to load data</h3>
                <p className="text-sm text-gray-500 mt-1">{error}</p>
              </div>
              <button
                onClick={fetchStats}
                className="mt-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl transition-all shadow-md shadow-indigo-200 dark:shadow-none"
              >
                Try Again
              </button>
            </div>
          ) : stats ? (
            <div className="p-4 sm:p-6 lg:p-8 space-y-8">
              
              {/* Top Stats Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
                {/* Total */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-gray-700 relative overflow-hidden group">
                  <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:scale-110 transition-transform duration-500">
                    <Users className="w-32 h-32 text-blue-600" />
                  </div>
                  <div className="flex items-center gap-4 relative z-10">
                    <div className="h-14 w-14 rounded-2xl bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center shrink-0 border border-blue-100 dark:border-blue-800/50">
                      <Users className="h-7 w-7 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Total Audience</p>
                      <p className="text-3xl font-black text-gray-900 dark:text-white leading-none">{stats.totalRecipients}</p>
                    </div>
                  </div>
                </div>

                {/* Read */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-gray-700 relative overflow-hidden group">
                  <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:scale-110 transition-transform duration-500">
                    <CheckCircle className="w-32 h-32 text-green-600" />
                  </div>
                  <div className="flex items-center gap-4 relative z-10">
                    <div className="h-14 w-14 rounded-2xl bg-green-50 dark:bg-green-900/30 flex items-center justify-center shrink-0 border border-green-100 dark:border-green-800/50">
                      <CheckCircle className="h-7 w-7 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Opened / Read</p>
                      <p className="text-3xl font-black text-gray-900 dark:text-white leading-none flex items-baseline gap-2">
                        {stats.readCount}
                        <span className="text-sm font-bold text-green-500 bg-green-50 dark:bg-green-900/20 px-2 py-0.5 rounded-md">
                          {stats.readPercentage}%
                        </span>
                      </p>
                    </div>
                  </div>
                </div>

                {/* Unread */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-gray-700 relative overflow-hidden group">
                  <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:scale-110 transition-transform duration-500">
                    <Clock className="w-32 h-32 text-orange-600" />
                  </div>
                  <div className="flex items-center gap-4 relative z-10">
                    <div className="h-14 w-14 rounded-2xl bg-orange-50 dark:bg-orange-900/30 flex items-center justify-center shrink-0 border border-orange-100 dark:border-orange-800/50">
                      <Clock className="h-7 w-7 text-orange-600 dark:text-orange-400" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Pending</p>
                      <p className="text-3xl font-black text-gray-900 dark:text-white leading-none">{stats.unreadCount}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Progress Bar Container */}
              <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
                <div className="flex justify-between items-end mb-3">
                  <div>
                    <h3 className="font-bold text-gray-900 dark:text-white">Engagement Rate</h3>
                    <p className="text-sm text-gray-500">Percentage of recipients who have read this message</p>
                  </div>
                  <span className="text-2xl font-black text-indigo-600 dark:text-indigo-400">{stats.readPercentage}%</span>
                </div>
                <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-4 overflow-hidden shadow-inner p-0.5">
                  <div
                    className="bg-gradient-to-r from-indigo-500 via-purple-500 to-emerald-400 h-full rounded-full transition-all duration-1000 ease-out relative shadow-sm"
                    style={{ width: `${stats.readPercentage}%` }}
                  >
                    <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
                  </div>
                </div>
              </div>

              {/* Filtering & Search */}
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                <div className="p-4 sm:p-5 border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50 flex flex-col md:flex-row gap-4 justify-between items-center">
                  
                  {/* Custom Tabs */}
                  <div className="flex p-1 bg-gray-200/50 dark:bg-gray-900/50 rounded-xl w-full md:w-auto">
                    {["all", "read", "unread"].map((tab) => {
                      const isActive = activeTab === tab;
                      const count = tab === "all" ? stats.totalRecipients : tab === "read" ? stats.readCount : stats.unreadCount;
                      
                      return (
                        <button
                          key={tab}
                          onClick={() => setActiveTab(tab)}
                          className={`flex-1 md:flex-none px-6 py-2.5 rounded-lg text-sm font-bold transition-all capitalize flex items-center justify-center gap-2 ${
                            isActive
                              ? "bg-white dark:bg-gray-700 text-indigo-600 dark:text-indigo-400 shadow-sm"
                              : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100/50 dark:hover:bg-gray-800"
                          }`}
                        >
                          {tab}
                          <span className={`px-2 py-0.5 rounded-md text-[10px] ${isActive ? 'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700' : 'bg-gray-200 dark:bg-gray-800 text-gray-500'}`}>
                            {count}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Search Box */}
                  <div className="relative w-full md:w-72">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search name, email, role..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-900 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-shadow shadow-sm hover:shadow-md"
                    />
                  </div>
                </div>

                {/* Recipient List inside the card */}
                <div className="divide-y divide-gray-100 dark:divide-gray-800">
                  {currentUsers.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-center px-4">
                      <div className="h-16 w-16 bg-gray-50 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4 border border-gray-100 dark:border-gray-700">
                        <Search className="h-8 w-8 text-gray-300 dark:text-gray-600" />
                      </div>
                      <h4 className="text-lg font-bold text-gray-900 dark:text-white">No recipients found</h4>
                      <p className="text-gray-500 mt-1 max-w-sm">
                        {searchQuery ? "Try adjusting your search criteria." : "There are no users in this category."}
                      </p>
                    </div>
                  ) : (
                    currentUsers.map((u, idx) => (
                      <div
                        key={u.id || idx}
                        className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors group"
                      >
                        <div className="flex items-center gap-4 min-w-0">
                          {/* Beautiful Avatar */}
                          <div
                            className={`h-12 w-12 rounded-2xl flex items-center justify-center font-black text-white text-lg shrink-0 shadow-sm group-hover:scale-105 group-hover:-rotate-3 transition-all duration-300 ${
                              u.readAt
                                ? "bg-gradient-to-br from-emerald-400 to-teal-600 shadow-emerald-200 dark:shadow-none"
                                : "bg-gradient-to-br from-orange-400 to-rose-500 shadow-orange-200 dark:shadow-none"
                            }`}
                          >
                            {(u.name || "?").charAt(0).toUpperCase()}
                          </div>
                          
                          <div className="min-w-0 flex flex-col justify-center">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-bold text-gray-900 dark:text-gray-100 text-base truncate">
                                {u.name}
                              </h4>
                              <span
                                className={`text-[10px] px-2 py-0.5 rounded-md font-bold uppercase border tracking-wider shadow-sm ${getRoleBadge(u.role)}`}
                              >
                                {u.role?.replace("_", " ")}
                              </span>
                            </div>
                            <p className="text-sm text-gray-500 truncate font-medium flex items-center gap-1.5">
                              {u.email}
                            </p>
                          </div>
                        </div>

                        {/* Status Badge */}
                        <div className="shrink-0 flex sm:flex-col items-center sm:items-end justify-between sm:justify-center border-t sm:border-t-0 border-gray-100 dark:border-gray-800 pt-3 sm:pt-0">
                          {u.readAt ? (
                            <>
                              <div className="bg-green-50 dark:bg-green-900/20 px-3 py-1.5 rounded-lg border border-green-200 dark:border-green-800/50 flex items-center gap-1.5 mb-1 sm:mb-1.5 shadow-sm">
                                <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                                <span className="text-xs uppercase font-black text-green-700 dark:text-green-400 tracking-wider">
                                  Opened
                                </span>
                              </div>
                              <p className="text-xs font-semibold text-gray-400 dark:text-gray-500">
                                {new Date(u.readAt).toLocaleString("en-US", {
                                  month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
                                })}
                              </p>
                            </>
                          ) : (
                            <div className="bg-orange-50 dark:bg-orange-900/20 px-3 py-1.5 rounded-lg border border-orange-200 dark:border-orange-800/50 flex items-center gap-2 shadow-sm">
                              <div className="relative flex h-2.5 w-2.5">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-orange-500"></span>
                              </div>
                              <span className="text-xs uppercase font-black text-orange-700 dark:text-orange-400 tracking-wider">
                                Pending
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
              
              {/* Bottom Spacer */}
              <div className="h-4"></div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
