"use client";
import { useState, useEffect } from "react";
import { X, Users, CheckCircle, Clock, Search } from "lucide-react";

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
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="relative w-full max-w-4xl bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-800 overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-6 bg-gradient-to-r from-indigo-600 to-purple-600 text-white shrink-0">
          <div className="flex justify-between items-start">
            <div className="flex-1 min-w-0 pr-4">
              <h2 className="text-xl font-bold truncate">{notification.title}</h2>
              <p className="text-white/80 text-sm mt-1">
                Sent by {stats?.senderName || notification.senderName || "System"}
                {(stats?.senderRole || notification.senderRole) && (
                  <span> ({stats?.senderRole || notification.senderRole})</span>
                )}
                {" • "}
                {new Date(notification.createdAt || notification.sentAt).toLocaleString()}
              </p>
              <div className="flex items-center gap-2 mt-2">
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/20 font-bold uppercase tracking-wider">
                  {notification.type || "general"}
                </span>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-full transition shrink-0"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex-1 flex flex-col items-center justify-center p-20 gap-3">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            <p className="text-sm text-gray-500">Loading tracking data...</p>
          </div>
        ) : error ? (
          <div className="flex-1 flex flex-col items-center justify-center p-20 gap-3">
            <div className="h-16 w-16 rounded-full bg-red-100 flex items-center justify-center">
              <X className="h-8 w-8 text-red-500" />
            </div>
            <p className="text-sm text-red-600 font-medium">{error}</p>
            <button
              onClick={fetchStats}
              className="text-sm text-indigo-600 hover:underline"
            >
              Try again
            </button>
          </div>
        ) : stats ? (
          <div className="flex-1 overflow-hidden flex flex-col p-6 space-y-5">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 shrink-0">
              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl border border-blue-100 dark:border-blue-800/30 flex items-center gap-4">
                <div className="h-12 w-12 rounded-xl bg-blue-100 dark:bg-blue-800/40 flex items-center justify-center">
                  <Users className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-blue-600 uppercase tracking-wider">
                    Total Sent
                  </p>
                  <p className="text-2xl font-bold dark:text-white">
                    {stats.totalRecipients}
                  </p>
                </div>
              </div>
              <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-xl border border-green-100 dark:border-green-800/30 flex items-center gap-4">
                <div className="h-12 w-12 rounded-xl bg-green-100 dark:bg-green-800/40 flex items-center justify-center">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-green-600 uppercase tracking-wider">
                    Read
                  </p>
                  <p className="text-2xl font-bold dark:text-white">
                    {stats.readCount}{" "}
                    <span className="text-sm font-medium text-green-500">
                      ({stats.readPercentage}%)
                    </span>
                  </p>
                </div>
              </div>
              <div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-xl border border-orange-100 dark:border-orange-800/30 flex items-center gap-4">
                <div className="h-12 w-12 rounded-xl bg-orange-100 dark:bg-orange-800/40 flex items-center justify-center">
                  <Clock className="h-6 w-6 text-orange-600" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-orange-600 uppercase tracking-wider">
                    Pending
                  </p>
                  <p className="text-2xl font-bold dark:text-white">
                    {stats.unreadCount}
                  </p>
                </div>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="shrink-0">
              <div className="flex justify-between text-xs text-gray-500 mb-1">
                <span>Read Progress</span>
                <span>{stats.readPercentage}%</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                <div
                  className="bg-gradient-to-r from-green-500 to-emerald-500 h-2.5 rounded-full transition-all duration-500"
                  style={{ width: `${stats.readPercentage}%` }}
                ></div>
              </div>
            </div>

            {/* Tabs + Search */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b dark:border-gray-800 pb-3 shrink-0">
              <div className="flex items-center gap-1">
                {["all", "read", "unread"].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all capitalize ${
                      activeTab === tab
                        ? "bg-indigo-600 text-white shadow-md"
                        : "text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
                    }`}
                  >
                    {tab} (
                    {tab === "all"
                      ? stats.totalRecipients
                      : tab === "read"
                        ? stats.readCount
                        : stats.unreadCount}
                    )
                  </button>
                ))}
              </div>
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search recipients..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                />
              </div>
            </div>

            {/* Recipients List */}
            <div className="flex-1 overflow-y-auto pr-1 space-y-2 custom-scrollbar min-h-0">
              {currentUsers.length === 0 ? (
                <div className="text-center py-10 text-gray-500 italic">
                  {searchQuery ? "No matching users found." : "No users found in this category."}
                </div>
              ) : (
                currentUsers.map((u, idx) => (
                  <div
                    key={u.id || idx}
                    className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-100 dark:border-gray-800 hover:border-indigo-200 dark:hover:border-indigo-800 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`h-10 w-10 rounded-full flex items-center justify-center font-bold text-white text-sm shrink-0 ${
                          u.readAt
                            ? "bg-gradient-to-br from-green-500 to-emerald-600"
                            : "bg-gradient-to-br from-orange-400 to-amber-500"
                        }`}
                      >
                        {(u.name || "?").charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-gray-900 dark:text-gray-100 text-sm truncate">
                          {u.name}
                        </p>
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-xs text-gray-500 truncate">
                            {u.email}
                          </p>
                          <span
                            className={`text-[9px] px-1.5 py-0.5 rounded-md font-bold uppercase border ${getRoleBadge(u.role)}`}
                          >
                            {u.role?.replace("_", " ")}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="text-right shrink-0 ml-3">
                      {u.readAt ? (
                        <div>
                          <p className="text-[10px] uppercase font-bold text-green-600 flex items-center gap-1 justify-end">
                            <CheckCircle className="h-3 w-3" />
                            Read
                          </p>
                          <p className="text-[10px] text-gray-500">
                            {new Date(u.readAt).toLocaleString("en-US", {
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </p>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5">
                          <div className="h-2 w-2 bg-orange-400 rounded-full animate-pulse"></div>
                          <p className="text-[10px] uppercase font-bold text-orange-500">
                            Pending
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        ) : null}

        <div className="p-4 bg-gray-50 dark:bg-gray-800/80 border-t dark:border-gray-800 flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-900 dark:bg-white dark:text-gray-900 text-white rounded-xl font-bold hover:opacity-90 transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
