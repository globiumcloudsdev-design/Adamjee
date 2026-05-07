import { NextResponse } from "next/server";
import { withAuth } from "@/backend/middleware/auth.middleware";
import { Notification, User } from "@/backend/models/postgres";

/**
 * GET /api/notifications/stats?notificationId=<uuid>
 * Returns detailed read/unread tracking for a specific notification.
 * Shows: who received, who read, who hasn't read, with user details.
 */
async function getNotificationStats(req) {
  try {
    const { searchParams } = new URL(req.url);
    const notificationId = searchParams.get("notificationId");
    // Support legacy param name (comma-separated IDs, take first)
    const notificationIds = searchParams.get("notificationIds");
    const targetId = notificationId || (notificationIds ? notificationIds.split(",")[0] : null);

    if (!targetId) {
      return NextResponse.json(
        { success: false, message: "notificationId is required" },
        { status: 400 },
      );
    }

    const notification = await Notification.findByPk(targetId);
    if (!notification) {
      return NextResponse.json(
        { success: false, message: "Notification not found" },
        { status: 404 },
      );
    }

    // Permission check: Branch Admin can only see their branch's notifications
    const currentUser = req.user;
    if (currentUser.role === "BRANCH_ADMIN" && notification.branch_id && notification.branch_id !== currentUser.branch_id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const recipients = notification.recipients || [];
    const userIds = recipients.map((r) => r.userId).filter(Boolean);

    // Fetch user details for all recipients
    let usersMap = {};
    if (userIds.length > 0) {
      const users = await User.findAll({
        where: { id: userIds },
        attributes: ["id", "first_name", "last_name", "email", "role", "phone"],
      });
      users.forEach((u) => {
        usersMap[u.id] = {
          id: u.id,
          name: [u.first_name, u.last_name].filter(Boolean).join(" ") || u.email || u.phone || "Unknown",
          email: u.email || "N/A",
          role: u.role,
          phone: u.phone,
        };
      });
    }

    // Build read/unread user lists
    const readUsers = [];
    const unreadUsers = [];

    recipients.forEach((r) => {
      const userInfo = usersMap[r.userId] || {
        id: r.userId,
        name: "Deleted User",
        email: "N/A",
        role: "Unknown",
      };

      if (r.isRead) {
        readUsers.push({
          ...userInfo,
          readAt: r.readAt,
        });
      } else {
        unreadUsers.push(userInfo);
      }
    });

    const totalRecipients = recipients.length;
    const readCount = readUsers.length;
    const unreadCount = unreadUsers.length;
    const readPercentage = totalRecipients > 0 ? Math.round((readCount / totalRecipients) * 100) : 0;

    // Fetch sender info
    let senderName = "System";
    let senderRole = "";
    if (notification.sent_by) {
      const sender = await User.findByPk(notification.sent_by, {
        attributes: ["id", "first_name", "last_name", "email", "role"],
      });
      if (sender) {
        senderName = [sender.first_name, sender.last_name].filter(Boolean).join(" ") || sender.email;
        senderRole = sender.role;
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        notificationId: notification.id,
        title: notification.title,
        message: notification.message,
        type: notification.type,
        sentAt: notification.sent_at,
        senderName,
        senderRole,
        totalRecipients,
        readCount,
        unreadCount,
        readPercentage,
        readUsers,
        unreadUsers,
      },
    });
  } catch (error) {
    console.error("Failed to fetch notification stats:", error);
    return NextResponse.json(
      { success: false, message: "Internal Server Error", error: error.message },
      { status: 500 },
    );
  }
}

export const GET = withAuth(getNotificationStats, ["SUPER_ADMIN", "BRANCH_ADMIN"]);
