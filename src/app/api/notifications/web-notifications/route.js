import { NextResponse } from 'next/server';
import { withAuth } from "@/backend/middleware/auth.middleware";
import { Notification } from "@/backend/models/postgres";

// GET /api/notifications/web-notifications
async function getWebNotifications(req) {
  const currentUser = req.user;
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get('userId');

  if (!userId || userId !== currentUser.id) {
    return NextResponse.json(
      { success: false, message: 'Unauthorized' },
      { status: 403 }
    );
  }

  try {
    // Fetch notifications where user is in recipients
    const notifications = await Notification.findAll({
      where: { status: "sent" },
      order: [["sent_at", "DESC"]],
      limit: 50, // Limit for performance
    });

    // Filter those where current user is in recipients
    const userNotifications = notifications.filter((n) => {
      const recipient = n.recipients?.find((r) => r.userId === currentUser.id);
      return recipient !== undefined;
    });

    // Calculate unread count
    const unreadCount = userNotifications.filter((n) => {
      const recipient = n.recipients.find((r) => r.userId === currentUser.id);
      return !recipient.isRead;
    }).length;

    return NextResponse.json({
      success: true,
      data: {
        notifications: userNotifications,
        unreadCount
      }
    });
  } catch (error) {
    console.error('Error fetching web notifications:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch notifications' },
      { status: 500 }
    );
  }
}

export const GET = withAuth(getWebNotifications, [
  "SUPER_ADMIN",
  "BRANCH_ADMIN",
  "TEACHER",
  "STUDENT",
  "STAFF",
]);
