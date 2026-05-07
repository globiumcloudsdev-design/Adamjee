import { NextResponse } from "next/server";
import { withAuth } from "@/backend/middleware/auth.middleware";
import { Notification } from "@/backend/models/postgres";

async function updateNotification(req, { params }) {
  const currentUser = req.user;
  const { id } = await params;
  const { action } = await req.json();

  const notification = await Notification.findByPk(id);
  if (!notification) {
    return NextResponse.json({ error: "Notification not found" }, { status: 404 });
  }

  if (action === "read") {
    // Mark as read for current user
    const recipients = [...(notification.recipients || [])];
    const index = recipients.findIndex((r) => r.userId === currentUser.id);
    
    if (index !== -1) {
      recipients[index].isRead = true;
      recipients[index].readAt = new Date();
      await notification.update({ recipients });
      return NextResponse.json({ success: true, message: "Notification marked as read" });
    } else {
      return NextResponse.json({ error: "User not found in recipients" }, { status: 404 });
    }
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}

async function deleteNotification(req, { params }) {
  const currentUser = req.user;
  const { id } = await params;
  const notification = await Notification.findByPk(id);
  if (!notification) {
    return NextResponse.json(
      { error: "Notification not found" },
      { status: 404 },
    );
  }

  // Admin roles can fully delete the notification
  if (currentUser.role === "SUPER_ADMIN" || currentUser.role === "BRANCH_ADMIN") {
    if (currentUser.role === "BRANCH_ADMIN" && notification.branch_id !== currentUser.branch_id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    await notification.destroy();
    return NextResponse.json({ success: true, message: "Notification deleted" });
  }

  // Non-admin roles: dismiss by removing themselves from recipients
  const recipients = [...(notification.recipients || [])];
  const index = recipients.findIndex((r) => r.userId === currentUser.id);
  if (index === -1) {
    return NextResponse.json({ error: "You are not a recipient of this notification" }, { status: 403 });
  }
  recipients.splice(index, 1);
  await notification.update({ recipients });
  return NextResponse.json({ success: true, message: "Notification dismissed" });
}

export const DELETE = withAuth(deleteNotification, [
  "SUPER_ADMIN",
  "BRANCH_ADMIN",
  "TEACHER",
  "STUDENT",
  "STAFF",
]);

export const PATCH = withAuth(updateNotification, [
  "SUPER_ADMIN",
  "BRANCH_ADMIN",
  "TEACHER",
  "STUDENT",
  "STAFF",
]);
