import { NextResponse } from "next/server";
import { withAuth } from "@/backend/middleware/auth.middleware";
import { Notification, User, Branch } from "@/backend/models/postgres";
import { Op } from "sequelize";

// Helper: get user IDs by roles and branch
async function getUserIdsByRolesAndBranch(branchId, roles) {
  if (!roles || roles.length === 0) return [];
  const where = { role: { [Op.in]: roles }, is_active: true };
  if (branchId) where.branch_id = branchId;
  const users = await User.findAll({ where, attributes: ["id"] });
  return users.map((u) => u.id);
}

// POST /api/notifications
async function createNotification(req) {
  const currentUser = req.user;
  const body = await req.json();
  const {
    branch_id,
    title,
    message,
    type,
    targetRoles,
    targetUserIds,
    sendToAll,
  } = body;

  if (!title || !message) {
    return NextResponse.json(
      { error: "title and message required" },
      { status: 400 },
    );
  }

  let targetBranchId = branch_id;
  let recipientsArray = [];

  // Branch Admin can only send to his branch
  if (currentUser.role === "BRANCH_ADMIN") {
    targetBranchId = currentUser.branch_id;
    if (branch_id && branch_id !== targetBranchId) {
      return NextResponse.json(
        { error: "You can only send to your own branch" },
        { status: 403 },
      );
    }
  } else if (currentUser.role === "SUPER_ADMIN") {
    // Super Admin can send to any branch, or null (all branches)
    if (targetBranchId) {
      const branch = await Branch.findByPk(targetBranchId);
      if (!branch)
        return NextResponse.json(
          { error: "Branch not found" },
          { status: 404 },
        );
    }
  } else {
    return NextResponse.json(
      { error: "Only admins can send notifications" },
      { status: 403 },
    );
  }

  // Resolve recipients
  if (sendToAll === true) {
    // Send to all users in the branch (or all branches if branch_id null)
    const where = { is_active: true };
    if (targetBranchId) where.branch_id = targetBranchId;
    const allUsers = await User.findAll({ where, attributes: ["id"] });
    recipientsArray = allUsers.map((u) => ({
      userId: u.id,
      isRead: false,
      readAt: null,
    }));
  } else if (targetUserIds && targetUserIds.length) {
    // specific user IDs
    recipientsArray = targetUserIds.map((uid) => ({
      userId: uid,
      isRead: false,
      readAt: null,
    }));
  } else if (targetRoles && targetRoles.length) {
    // by roles
    const userIds = await getUserIdsByRolesAndBranch(
      targetBranchId,
      targetRoles,
    );
    recipientsArray = userIds.map((uid) => ({
      userId: uid,
      isRead: false,
      readAt: null,
    }));
  } else {
    return NextResponse.json(
      { error: "No recipients specified" },
      { status: 400 },
    );
  }

  if (recipientsArray.length === 0) {
    return NextResponse.json(
      { error: "No valid recipients found" },
      { status: 400 },
    );
  }

  const notification = await Notification.create({
    branch_id: targetBranchId || null,
    title,
    message,
    type: type || "general",
    sent_by: currentUser.id,
    recipients: recipientsArray,
    status: "sent",
    sent_at: new Date(),
  });

  return NextResponse.json({ success: true, notification }, { status: 201 });
}

// GET /api/notifications – list notifications for current user
async function listUserNotifications(req) {
  const currentUser = req.user;
  const { searchParams } = new URL(req.url);
  const limit = parseInt(searchParams.get("limit")) || 50;
  const offset = parseInt(searchParams.get("offset")) || 0;
  const unreadOnly = searchParams.get("unreadOnly") === "true";

  const where = { status: "sent" };
  // We need to find notifications where user is in recipients array
  // PostgreSQL JSONB query: recipients @> '[{"userId":"...","isRead":false}]'
  // But simpler: fetch all for branch and filter in memory? Not efficient. Let's do raw query or use JSONB operators.
  // We'll use Sequelize JSONB containment:
  // For simplicity we will manual filter after query (if not too many). But better to query with JSONB path.
  const notifications = await Notification.findAll({
    where,
    order: [["sent_at", "DESC"]],
    limit,
    offset,
  });
  // Filter those where current user is in recipients
  const userNotifications = notifications.filter((n) => {
    const recipient = n.recipients?.find((r) => r.userId === currentUser.id);
    return recipient !== undefined;
  });
  let result = userNotifications;
  if (unreadOnly) {
    result = result.filter((n) => {
      const recipient = n.recipients.find((r) => r.userId === currentUser.id);
      return !recipient.isRead;
    });
  }
  return NextResponse.json({ notifications: result });
}

export const POST = withAuth(createNotification, [
  "SUPER_ADMIN",
  "BRANCH_ADMIN",
]);
export const GET = withAuth(listUserNotifications, [
  "SUPER_ADMIN",
  "BRANCH_ADMIN",
  "TEACHER",
  "STUDENT",
  "STAFF",
]);
