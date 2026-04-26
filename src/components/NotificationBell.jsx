"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Bell, CheckCheck, Trash2, RefreshCw } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

export default function NotificationBell() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef(null);
  const router = useRouter();
  const [selectedNotification, setSelectedNotification] = useState(null);

  const fetchNotis = async () => {
    if (!user?._id && !user?.id) return;
    const userId = user._id || user.id;
    const token =
      localStorage.getItem("accessToken") || localStorage.getItem("token");

    try {
      setLoading(true);
      const res = await fetch(
        `/api/notifications/web-notifications?userId=${userId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      const data = await res.json();
      if (data.success) {
        setNotifications(data.data.notifications);
        setUnreadCount(data.data.unreadCount);
      }
    } catch (err) {
      console.error("Notification Fetch Error:", err);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notification) => {
    try {
      const token =
        localStorage.getItem("accessToken") || localStorage.getItem("token");
      const notifId = notification._id || notification.id;

      setNotifications((prev) =>
        prev.map((n) =>
          (n._id || n.id) === notifId ? { ...n, isRead: true } : n,
        ),
      );
      setUnreadCount((c) => Math.max(0, c - 1));

      await fetch("/api/notifications", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          notificationId: notifId,
          isEvent: notification.isEvent || false,
        }),
      });
    } catch (err) {
      console.error("Mark read failed", err);
    }
  };

  const markAllAsRead = async () => {
    try {
      const token =
        localStorage.getItem("accessToken") || localStorage.getItem("token");

      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);

      const res = await fetch("/api/notifications", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ markAll: true }),
      });

      const data = await res.json();
      if (data.success) {
        toast.success("All notifications marked as read");
      }
    } catch (err) {
      console.error("Mark all as read failed", err);
      toast.error("Failed to mark all as read");
    }
  };

  const deleteNotification = async (notification, e) => {
    if (e) e.stopPropagation();

    try {
      const token =
        localStorage.getItem("accessToken") || localStorage.getItem("token");
      const notifId = notification._id || notification.id;

      // Optimistic Update
      setNotifications((prev) =>
        prev.filter((n) => (n._id || n.id) !== notifId),
      );
      if (!notification.isRead) {
        setUnreadCount((c) => Math.max(0, c - 1));
      }

      await fetch("/api/notifications", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          notificationId: notifId,
          isEvent: notification.isEvent || false,
        }),
      });
    } catch (err) {
      console.error("Delete failed", err);
      toast.error("Failed to delete notification");
      fetchNotis(); // Sync back if failed
    }
  };

  useEffect(() => {
    if (user) {
      fetchNotis();
      const interval = setInterval(fetchNotis, 30000); // 30s instead of 15s to save resources
      return () => clearInterval(interval);
    }
  }, [user]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-md hover:bg-gray-100 transition-colors focus:outline-none"
      >
        <Bell className="h-5 w-5 text-gray-600" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500 border border-white"></span>
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-[400px] bg-white border border-gray-200 rounded-xl shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200 backdrop-blur-sm">
          <div className="p-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
            <div className="flex justify-between items-center mb-1">
              <h3 className="font-bold text-lg">Notifications</h3>
              <div className="flex gap-2">
                <button
                  onClick={fetchNotis}
                  disabled={loading}
                  className="p-1.5 bg-white/10 hover:bg-white/20 rounded-lg transition-all"
                  title="Refresh"
                >
                  <RefreshCw
                    className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
                  />
                </button>
              </div>
            </div>
            <div className="flex justify-between items-center">
              <p className="text-xs text-blue-100">
                {unreadCount} unread message{unreadCount !== 1 ? "s" : ""}
              </p>
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-[10px] uppercase font-bold tracking-wider hover:underline flex items-center gap-1"
                >
                  <CheckCheck className="h-3 w-3" />
                  Mark all as read
                </button>
              )}
            </div>
          </div>

          <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
            {notifications.length === 0 ? (
              <div className="p-12 text-center text-gray-500 text-sm flex flex-col items-center">
                <div className="bg-gray-100 rounded-full p-4 mb-3">
                  <Bell className="h-8 w-8 text-gray-400" />
                </div>
                <p className="font-medium text-gray-700">
                  No notifications yet
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  You're all caught up!
                </p>
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n._id}
                  onClick={async () => {
                    if (n.link) {
                      if (!n.isRead) await markAsRead(n);
                      setIsOpen(false);
                      router.push(n.link);
                      return;
                    }
                    if (!n.isRead) await markAsRead(n);
                    setSelectedNotification(n);
                    setIsOpen(false);
                  }}
                  className={`p-4 border-b border-gray-100 hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 transition-all duration-200 cursor-pointer group relative ${!n.isRead ? "bg-blue-50/50 border-l-4 border-l-blue-500" : ""}`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <span
                      className={`text-[10px] px-2 py-1 rounded-full font-semibold uppercase tracking-wider shadow-sm
                      ${
                        n.type === "announcement"
                          ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white"
                          : n.type === "fee_reminder"
                            ? "bg-gradient-to-r from-red-500 to-orange-500 text-white"
                            : "bg-gradient-to-r from-blue-500 to-indigo-500 text-white"
                      }`}
                    >
                      {n.type?.replace("_", " ") || "General"}
                    </span>

                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-gray-500 font-medium whitespace-nowrap">
                        {new Date(n.createdAt).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                        })}
                      </span>

                      {/* Quick Delete Button */}
                      <button
                        onClick={(e) => deleteNotification(n, e)}
                        className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-red-100 text-gray-400 hover:text-red-600 rounded-md transition-all duration-200"
                        title="Delete"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>

                  <h4 className="text-sm font-bold text-gray-900 leading-snug mb-1 group-hover:text-blue-700 transition-colors pr-6">
                    {n.title}
                  </h4>
                  <p className="text-xs text-gray-600 line-clamp-2 leading-relaxed">
                    {n.message}
                  </p>

                  {!n.isRead && (
                    <div className="flex items-center gap-1.5 mt-2">
                      <div className="h-2 w-2 bg-blue-500 rounded-full animate-pulse"></div>
                      <span className="text-[10px] font-semibold text-blue-600 uppercase tracking-wide">
                        New Message
                      </span>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>

          {notifications.length > 0 && (
            <div className="p-3 border-t bg-gradient-to-r from-gray-50 to-gray-100 text-center">
              <button className="text-xs font-bold text-blue-600 hover:text-blue-800 transition-colors duration-200 uppercase tracking-wide">
                View All History →
              </button>
            </div>
          )}
        </div>
      )}

      {/* Enhanced Modal: Notification Detail */}
      {selectedNotification && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center p-4 animate-in fade-in duration-300"
          aria-hidden="false"
        >
          <div
            className="absolute inset-0 bg-gradient-to-br from-black/60 via-black/50 to-black/60 backdrop-blur-sm"
            onClick={() => setSelectedNotification(null)}
          />

          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="notif-title"
            className="relative w-full max-w-2xl mx-auto transform transition-all duration-300 animate-in zoom-in-95 slide-in-from-bottom-4"
          >
            <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden ring-1 ring-black/5">
              {/* Header with Gradient */}
              <div className="relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600"></div>
                <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiBpZD0iZ3JpZCIgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBwYXR0ZXJuVW5pdHM9InVzZXJTcGFjZU9uVXNlIj48cGF0aCBkPSJNIDQwIDAgTCAwIDAgMCA0MCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJ3aGl0ZSIgc3Ryb2tlLW9wYWNpdHk9IjAuMSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-20"></div>

                <div className="relative flex items-start gap-4 p-6">
                  <div className="flex-shrink-0 mt-1">
                    <div className="h-14 w-14 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white shadow-lg ring-2 ring-white/30">
                      <Bell className="h-7 w-7" />
                    </div>
                  </div>

                  <div className="flex-1 min-w-0 text-white">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-[10px] px-2.5 py-1 rounded-full font-bold uppercase tracking-wider bg-white/30 backdrop-blur-md shadow-sm ring-1 ring-white/40 text-white">
                        {selectedNotification.type?.replace("_", " ") ||
                          "General"}
                      </span>
                      <span className="text-xs text-white/80 font-medium">
                        {new Date(
                          selectedNotification.createdAt,
                        ).toLocaleString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                    <h3
                      id="notif-title"
                      className="text-xl font-bold text-white leading-tight"
                    >
                      {selectedNotification.title}
                    </h3>
                  </div>

                  <div className="flex items-start">
                    <button
                      onClick={() => setSelectedNotification(null)}
                      aria-label="Close notification"
                      className="p-2 rounded-lg text-white/90 hover:bg-white/20 hover:text-white transition-all duration-200 backdrop-blur-sm"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 011.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>

              {/* Content Body */}
              <div className="px-6 py-6 bg-gradient-to-br from-gray-50 to-white">
                <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
                  <div className="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap max-h-[400px] overflow-y-auto custom-scrollbar font-['Inter',sans-serif]">
                    {selectedNotification.message}
                  </div>
                </div>
              </div>

              {/* Footer Actions */}
              <div className="px-6 py-4 bg-gradient-to-r from-gray-50 to-gray-100 border-t border-gray-200 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  {selectedNotification.link && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedNotification(null);
                        router.push(selectedNotification.link);
                      }}
                      className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 font-medium text-sm shadow-md hover:shadow-lg transform hover:scale-105"
                    >
                      <svg
                        className="h-4 w-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                        />
                      </svg>
                      Open Link
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={async () => {
                      if (
                        confirm(
                          "Are you sure you want to delete this notification? This action cannot be undone.",
                        )
                      ) {
                        try {
                          const token =
                            localStorage.getItem("accessToken") ||
                            localStorage.getItem("token");

                          const payload = {
                            notificationId:
                              selectedNotification._id ||
                              selectedNotification.id,
                            isEvent: selectedNotification.isEvent || false,
                          };

                          console.log(
                            "🔍 Deleting notification with payload:",
                            payload,
                          );

                          const response = await fetch("/api/notifications", {
                            method: "DELETE",
                            headers: {
                              "Content-Type": "application/json",
                              Authorization: `Bearer ${token}`,
                            },
                            body: JSON.stringify(payload),
                          });

                          console.log(
                            "📡 Delete response status:",
                            response.status,
                          );

                          const data = await response.json();
                          console.log("📦 Delete response data:", data);

                          if (!response.ok || !data.success) {
                            throw new Error(
                              data.message || "Failed to delete notification",
                            );
                          }

                          // Remove from local state
                          setNotifications((prev) =>
                            prev.filter(
                              (n) =>
                                (n._id || n.id) !==
                                (selectedNotification._id ||
                                  selectedNotification.id),
                            ),
                          );
                          setUnreadCount((c) =>
                            selectedNotification.isRead
                              ? c
                              : Math.max(0, c - 1),
                          );

                          // Success console message
                          console.log(
                            `✅ Notification deleted successfully: "${selectedNotification.title}"`,
                          );
                          setSelectedNotification(null);
                        } catch (err) {
                          console.error("❌ Delete failed:", err);
                          alert(
                            `Failed to delete notification: ${err.message || "Please try again."}`,
                          );
                        }
                      }
                    }}
                    className="flex items-center gap-2 px-4 py-2 bg-white border border-red-300 rounded-lg text-red-600 hover:bg-red-50 hover:border-red-400 transition-all duration-200 font-medium text-sm shadow-sm hover:shadow"
                  >
                    <svg
                      className="h-4 w-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      />
                    </svg>
                    Delete
                  </button>

                  <button
                    onClick={() => setSelectedNotification(null)}
                    className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-white rounded-lg transition-all duration-200 font-medium"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
