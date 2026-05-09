import { NextResponse } from "next/server";
import { withAuth } from "@/backend/middleware/auth.middleware";
import { Notification, User, sequelize } from "@/backend/models/postgres";
import NotificationService from "@/backend/services/NotificationService";
import { Op } from "sequelize";

/**
 * GET /api/notifications
 * Lists notifications for the current user.
 */
async function listUserNotifications(req) {
  try {
    const currentUser = req.user;
    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get("limit")) || 50;

    // Fetch notifications where user is in recipients
    // Since recipients is JSONB, we can use containment operator @>
    // In Sequelize, this is [Op.contains]
    const notifications = await Notification.findAll({
      where: {
        status: "sent",
        recipients: {
          [Op.contains]: [{ userId: currentUser.id }]
        }
      },
      order: [["sent_at", "DESC"]],
      limit: limit,
    });

    // Transform: flatten isRead for the current user at top level
    const transformed = notifications.map((n) => {
      const plain = n.toJSON ? n.toJSON() : { ...n };
      const recipient = plain.recipients?.find((r) => r.userId === currentUser.id);
      plain.isRead = recipient?.isRead ?? false;
      plain.readAt = recipient?.readAt ?? null;
      return plain;
    });

    // Calculate unread count
    const unreadCount = transformed.filter((n) => !n.isRead).length;

    return NextResponse.json({
      success: true,
      notifications: transformed,
      unreadCount,
    });
  } catch (error) {
    console.error("Failed to fetch notifications:", error);
    return NextResponse.json(
      { success: false, message: "Internal Server Error", error: error.message },
      { status: 500 },
    );
  }
}

/**
 * POST /api/notifications
 * Sends a notification.
 */
async function sendNotification(req) {
  try {
    const currentUser = req.user;
    const body = await req.json();
    const { title, message, type, branch_id, targetRoles, targetUserIds, sendToAll, targetSectionId } = body;

    // BRANCH_ADMIN: always scope to their own branch
    const effectiveBranchId = currentUser.role === "BRANCH_ADMIN"
      ? currentUser.branch_id
      : (branch_id || null);

    console.log(`[Notification] Sender: role=${currentUser.role}, user.branch_id=${currentUser.branch_id}, body.branch_id=${branch_id}, effectiveBranchId=${effectiveBranchId}, targetSectionId=${targetSectionId}, targetRoles=${JSON.stringify(targetRoles)}, sendToAll=${sendToAll}`);

    let recipientIds = [];

    if (targetSectionId) {
      // Section targeting: find students in this section (and optionally branch)
      const where = { role: "STUDENT", is_active: true };
      if (effectiveBranchId) where.branch_id = effectiveBranchId;
      // Use ->> text extraction for type-safe comparison (handles both string/number stored section_id)
      if (!where[Op.and]) where[Op.and] = [];
      where[Op.and].push(
        sequelize.literal(`details->'academic_info'->>'section_id' = '${targetSectionId.replace(/'/g, "''")}'`)
      );
      const users = await User.findAll({ where, attributes: ["id"] });
      console.log(`[Notification] Section targeting: sectionId=${targetSectionId}, branchId=${effectiveBranchId}, found ${users.length} students`);
      recipientIds = users.map((u) => u.id);
    } else if (sendToAll) {
      // Fetch all active users
      const where = { is_active: true };
      if (effectiveBranchId) where.branch_id = effectiveBranchId;
      
      const users = await User.findAll({ where, attributes: ["id"] });
      recipientIds = users.map((u) => u.id);
    } else if (targetUserIds && targetUserIds.length > 0) {
      recipientIds = targetUserIds;
    } else if (targetRoles && targetRoles.length > 0) {
      // Normalize roles to uppercase to match database ENUM values
      const dbRoles = targetRoles.map(r => r.toUpperCase());
      const where = { role: { [Op.in]: dbRoles }, is_active: true };
      if (effectiveBranchId) where.branch_id = effectiveBranchId;
      
      const users = await User.findAll({ where, attributes: ["id"] });
      recipientIds = users.map((u) => u.id);
    }

    if (recipientIds.length === 0) {
      let errorMsg = "No recipients found for the selected criteria";
      if (targetSectionId) {
        errorMsg = "No students or parents are currently registered in this class/section.";
      }
      return NextResponse.json(
        { success: false, message: errorMsg },
        { status: 400 },
      );
    }

    const notification = await NotificationService.sendToUsers(recipientIds, {
      title,
      message,
      type,
      branchId: effectiveBranchId,
      sentBy: currentUser.id,
    });

    return NextResponse.json({
      success: true,
      message: "Notification sent successfully",
      notification,
    });
  } catch (error) {
    console.error("Failed to send notification:", error);
    return NextResponse.json(
      { success: false, message: "Internal Server Error", error: error.message },
      { status: 500 },
    );
  }
}

/**
 * PATCH /api/notifications
 * Mark notifications as read (supports markAll).
 */
async function updateNotifications(req) {
  try {
    const currentUser = req.user;
    const { markAll } = await req.json();

    if (markAll) {
      // Find all notifications for this user and mark as read
      const notifications = await Notification.findAll({
        where: {
          status: "sent",
          recipients: {
            [Op.contains]: [{ userId: currentUser.id }]
          }
        }
      });

      for (const notification of notifications) {
        const recipients = [...(notification.recipients || [])];
        const index = recipients.findIndex((r) => r.userId === currentUser.id);
        if (index !== -1 && !recipients[index].isRead) {
          recipients[index].isRead = true;
          recipients[index].readAt = new Date();
          await notification.update({ recipients });
        }
      }

      return NextResponse.json({ success: true, message: "All notifications marked as read" });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("Failed to update notifications:", error);
    return NextResponse.json(
      { success: false, message: "Internal Server Error", error: error.message },
      { status: 500 },
    );
  }
}

/**
 * DELETE /api/notifications
 * Delete a notification (body-based).
 * Admins fully delete; non-admins dismiss (remove self from recipients).
 */
async function deleteNotifications(req) {
  try {
    const currentUser = req.user;
    const { notificationId } = await req.json();

    if (!notificationId) {
      return NextResponse.json({ error: "Notification ID required" }, { status: 400 });
    }

    const notification = await Notification.findByPk(notificationId);
    if (!notification) {
      return NextResponse.json({ error: "Notification not found" }, { status: 404 });
    }

    // Admin roles: fully delete the notification
    if (currentUser.role === "SUPER_ADMIN" || currentUser.role === "BRANCH_ADMIN") {
      if (currentUser.role === "BRANCH_ADMIN" && notification.branch_id !== currentUser.branch_id) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
      await notification.destroy();
      return NextResponse.json({ success: true, message: "Notification deleted" });
    }

    // Non-admin roles: dismiss by removing self from recipients
    const recipients = [...(notification.recipients || [])];
    const index = recipients.findIndex((r) => r.userId === currentUser.id);
    if (index === -1) {
      return NextResponse.json({ error: "You are not a recipient" }, { status: 403 });
    }
    recipients.splice(index, 1);
    await notification.update({ recipients });
    return NextResponse.json({ success: true, message: "Notification dismissed" });
  } catch (error) {
    console.error("Failed to delete notification:", error);
    return NextResponse.json(
      { success: false, message: "Internal Server Error", error: error.message },
      { status: 500 },
    );
  }
}

export const GET = withAuth(listUserNotifications, [
  "SUPER_ADMIN",
  "BRANCH_ADMIN",
  "TEACHER",
  "STUDENT",
  "STAFF",
]);

export const POST = withAuth(sendNotification, ["SUPER_ADMIN", "BRANCH_ADMIN"]);

export const PATCH = withAuth(updateNotifications, [
  "SUPER_ADMIN",
  "BRANCH_ADMIN",
  "TEACHER",
  "STUDENT",
  "STAFF",
]);

export const DELETE = withAuth(deleteNotifications, [
  "SUPER_ADMIN",
  "BRANCH_ADMIN",
  "TEACHER",
  "STUDENT",
  "STAFF",
]);
