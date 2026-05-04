import { NextResponse } from "next/server";
import { withAuth } from "@/backend/middleware/auth.middleware";
import { Notification } from "@/backend/models/postgres";

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
  // Super Admin can delete any; Branch Admin can delete only his branch's notifications
  if (currentUser.role === "BRANCH_ADMIN") {
    if (notification.branch_id !== currentUser.branch_id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  } else if (currentUser.role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  await notification.destroy();
  return NextResponse.json({ success: true });
}

export const DELETE = withAuth(deleteNotification, [
  "SUPER_ADMIN",
  "BRANCH_ADMIN",
]);
