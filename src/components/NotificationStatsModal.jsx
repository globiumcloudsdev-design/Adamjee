"use client";
import { useState, useEffect } from "react";
import { X, Users, CheckCircle, Clock, User, Filter } from "lucide-react";

export default function NotificationStatsModal({ notification, onClose }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all"); // 'all', 'read', 'unread'

  useEffect(() => {
    if (notification?.notificationIds) {
      fetchStats();
    }
  }, [notification]);

  const fetchStats = async () => {
    try {
      const token =
        localStorage.getItem("accessToken") || localStorage.getItem("token");
      const ids = notification.notificationIds.join(",");

      const response = await fetch(
        `/api/notifications/stats?notificationIds=${ids}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      const data = await response.json();
      if (data.success) {
        setStats(data.data);
      }
    } catch (error) {
      console.error("Stats Fetch Error:", error);
    } finally {
      setLoading(false);
    }
  };

  if (!notification) return null;

  // Filter users based on tab
  const getFilteredUsers = () => {
    if (!stats) return [];
    if (activeTab === "read") return stats.readUsers;
    if (activeTab === "unread") return stats.unreadUsers;
    return [...stats.readUsers, ...stats.unreadUsers];
  };

  const currentUsers = getFilteredUsers();

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
            <div>
              <h2 className="text-2xl font-bold">{notification.title}</h2>
              <p className="text-white/80 text-sm mt-1">
                Sent by {notification.senderName} ({notification.senderRole}) •{" "}
                {new Date(notification.createdAt).toLocaleString()}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-full transition"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex-1 flex flex-center items-center justify-center p-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          </div>
        ) : stats ? (
          <div className="flex-1 overflow-hidden flex flex-col p-6 space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 shrink-0">
              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl border border-blue-100 dark:border-blue-800/30 flex items-center gap-4">
                <Users className="h-10 w-10 text-blue-600" />
                <div>
                  <p className="text-xs font-bold text-blue-600 uppercase">
                    Total Sent
                  </p>
                  <p className="text-2xl font-bold dark:text-white">
                    {stats.totalRecipients}
                  </p>
                </div>
              </div>
              <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-xl border border-green-100 dark:border-green-800/30 flex items-center gap-4">
                <CheckCircle className="h-10 w-10 text-green-600" />
                <div>
                  <p className="text-xs font-bold text-green-600 uppercase">
                    Read
                  </p>
                  <p className="text-2xl font-bold dark:text-white">
                    {stats.readCount} ({stats.readPercentage}%)
                  </p>
                </div>
              </div>
              <div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-xl border border-orange-100 dark:border-orange-800/30 flex items-center gap-4">
                <Clock className="h-10 w-10 text-orange-600" />
                <div>
                  <p className="text-xs font-bold text-orange-600 uppercase">
                    Pending
                  </p>
                  <p className="text-2xl font-bold dark:text-white">
                    {stats.unreadCount}
                  </p>
                </div>
              </div>
            </div>

            {/* List Section */}
            <div className="flex-1 flex flex-col min-h-0">
              <div className="flex items-center gap-4 border-b dark:border-gray-800 mb-4 shrink-0">
                {["all", "read", "unread"].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`pb-2 px-4 transition-all capitalize font-medium ${
                      activeTab === tab
                        ? "border-b-2 border-indigo-600 text-indigo-600"
                        : "text-gray-500 hover:text-gray-700"
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

              <div className="flex-1 overflow-y-auto pr-2 space-y-2 custom-scrollbar">
                {currentUsers.length === 0 ? (
                  <div className="text-center py-10 text-gray-500 italic">
                    No users found in this category.
                  </div>
                ) : (
                  currentUsers.map((u, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-100 dark:border-gray-800"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`h-10 w-10 rounded-full flex items-center justify-center font-bold text-white ${idx % 2 === 0 ? "bg-indigo-500" : "bg-purple-500"}`}
                        >
                          {u.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900 dark:text-gray-100">
                            {u.name}
                          </p>
                          <p className="text-xs text-gray-500">
                            {u.email} • {u.role}
                          </p>
                        </div>
                      </div>
                      {u.readAt && (
                        <div className="text-right">
                          <p className="text-[10px] uppercase font-bold text-green-600">
                            Read At
                          </p>
                          <p className="text-xs text-gray-500">
                            {new Date(u.readAt).toLocaleString()}
                          </p>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
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
