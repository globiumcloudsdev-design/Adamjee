import { NextResponse } from "next/server";
import { withAuth } from "@/backend/middleware/auth.middleware";
import { Notification } from "@/backend/models/postgres";

// PUT /api/notifications/:id/read
async function markAsRead(req, { params }) {
  const currentUser = req.user;
  const { id } = await params;
  const notification = await Notification.findByPk(id);
  if (!notification) {
    return NextResponse.json(
      { error: "Notification not found" },
      { status: 404 },
    );
  }
  const recipient = notification.recipients?.find(
    (r) => r.userId === currentUser.id,
  );
  if (!recipient) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }
  if (!recipient.isRead) {
    recipient.isRead = true;
    recipient.readAt = new Date();
    await notification.update({ recipients: notification.recipients });
  }
  return NextResponse.json({ success: true });
}

export const PUT = withAuth(markAsRead, [
  "SUPER_ADMIN",
  "BRANCH_ADMIN",
  "TEACHER",
  "STUDENT",
  "STAFF",
]);
