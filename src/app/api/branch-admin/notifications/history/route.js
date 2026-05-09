import { NextResponse } from "next/server";
import { withAuth } from "@/backend/middleware/auth.middleware";
import { Notification, User } from "@/backend/models/postgres";
import { Op } from "sequelize";

/**
 * GET /api/branch-admin/notifications/history
 * Fetches notification history for the current branch.
 */
async function getNotificationHistory(req) {
  try {
    const currentUser = req.user;
    const branchId = currentUser.branch_id;

    if (!branchId && currentUser.role !== "SUPER_ADMIN") {
      return NextResponse.json(
        { success: false, message: "Branch ID not found for user" },
        { status: 400 },
      );
    }

    const where = {};
    if (currentUser.role === "BRANCH_ADMIN") {
      where.branch_id = branchId;
    }

    const notifications = await Notification.findAll({
      where,
      order: [["created_at", "DESC"]],
      limit: 50,
    });

    // Fetch sender details for all notifications
    const senderIds = [
      ...new Set(notifications.map((n) => n.sent_by).filter(Boolean)),
    ];
    let sendersMap = {};
    if (senderIds.length > 0) {
      const senders = await User.findAll({
        where: { id: senderIds },
        attributes: ["id", "first_name", "last_name", "email", "role"],
      });
      senders.forEach((s) => {
        sendersMap[s.id] = {
          name:
            [s.first_name, s.last_name].filter(Boolean).join(" ") ||
            s.email ||
            "Unknown",
          role: s.role,
        };
      });
    }

    // Process notifications to include read/unread counts + sender info
    const history = notifications.map((n) => {
      const recipients = n.recipients || [];
      const recipientCount = recipients.length;
      const readCount = recipients.filter((r) => r.isRead).length;
      const unreadCount = recipientCount - readCount;
      const sender = sendersMap[n.sent_by] || { name: "System", role: "" };

      return {
        id: n.id,
        notificationIds: [n.id], // For NotificationStatsModal compatibility
        title: n.title,
        message: n.message,
        type: n.type,
        status: n.status,
        senderName: sender.name,
        senderRole: sender.role,
        recipientCount,
        readCount,
        unreadCount,
        createdAt: n.created_at,
        sentAt: n.sent_at,
      };
    });

    return NextResponse.json({
      success: true,
      data: history,
    });
  } catch (error) {
    console.error("Failed to fetch notification history:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Internal Server Error",
        error: error.message,
      },
      { status: 500 },
    );
  }
}

export const GET = withAuth(getNotificationHistory, [
  "SUPER_ADMIN",
  "BRANCH_ADMIN",
]);
