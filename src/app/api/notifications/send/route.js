import { NextResponse } from "next/server";
import { withAuth } from "@/backend/middleware/auth.middleware";
import { Notification, User, Branch } from "@/backend/models/postgres";
import { Op } from "sequelize";
import NotificationService from "@/backend/services/NotificationService";

// Helper: get user IDs by roles and branch
async function getUserIdsByRolesAndBranch(branchId, roles) {
  if (!roles || roles.length === 0) return [];
  const where = { role: { [Op.in]: roles }, is_active: true };
  if (branchId) where.branch_id = branchId;
  const users = await User.findAll({ where, attributes: ["id"] });
  return users.map((u) => u.id);
}

// POST /api/notifications/send - Wrapper for createNotification with different payload format
async function sendNotification(req) {
  const currentUser = req.user;
  const body = await req.json();
  const {
    title,
    message,
    type,
    targetRole, // single role from frontend
    targetBranch, // 'all' or branch._id from frontend
    targetUserIds, // optional array
  } = body;

  if (!title || !message) {
    return NextResponse.json(
      { error: "title and message required" },
      { status: 400 },
    );
  }

  // Transform frontend format to backend format
  let branch_id = null;
  let targetRoles = [];
  let sendToAll = false;

  if (targetBranch === 'all') {
    branch_id = null; // all branches
    sendToAll = true;
  } else if (targetBranch) {
    branch_id = targetBranch;
    sendToAll = true; // send to all in that branch
  }

  const ROLE_MAP = {
    student: "STUDENT",
    teacher: "TEACHER",
    staff: "STAFF",
    branch_admin: "BRANCH_ADMIN",
    super_admin: "SUPER_ADMIN",
  };

  if (targetRole) {
    const normalizedRole = ROLE_MAP[targetRole.toLowerCase()] || targetRole.toUpperCase();
    const validRoles = ["SUPER_ADMIN", "BRANCH_ADMIN", "TEACHER", "STUDENT", "STAFF"];
    if (!validRoles.includes(normalizedRole)) {
      return NextResponse.json(
        { error: `Unsupported target role: ${targetRole}` },
        { status: 400 },
      );
    }
    targetRoles = [normalizedRole];
  }

  // If targetUserIds provided, use specific users
  if (targetUserIds && targetUserIds.length > 0) {
    sendToAll = false;
  }

  const ALLOWED_TYPES = [
    "fee_due",
    "attendance",
    "exam",
    "result",
    "event",
    "general",
    "alert",
    "reminder",
    "announcement",
  ];

  const resolvedType = ALLOWED_TYPES.includes(type) ? type : "general";

  // Now call the logic from the main route
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

  // Resolve recipient IDs
  let targetUserIdsFinal = [];

  if (sendToAll === true) {
    // Send to all users in the branch (or all branches if branch_id null)
    const where = { is_active: true };
    if (targetBranchId) where.branch_id = targetBranchId;
    const allUsers = await User.findAll({ where, attributes: ["id"] });
    targetUserIdsFinal = allUsers.map((u) => u.id);
  } else if (targetUserIds && targetUserIds.length) {
    // specific user IDs
    targetUserIdsFinal = targetUserIds;
  } else if (targetRoles && targetRoles.length) {
    // by roles
    targetUserIdsFinal = await getUserIdsByRolesAndBranch(
      targetBranchId,
      targetRoles,
    );
  } else {
    return NextResponse.json(
      { error: "No recipients specified" },
      { status: 400 },
    );
  }

  if (targetUserIdsFinal.length === 0) {
    return NextResponse.json(
      { error: "No valid recipients found" },
      { status: 400 },
    );
  }

  try {
    const notification = await NotificationService.sendToUsers(targetUserIdsFinal, {
      title,
      message,
      type: resolvedType,
      branchId: targetBranchId,
      sentBy: currentUser.id,
    });

    return NextResponse.json({ success: true, notification }, { status: 201 });
  } catch (error) {
    console.error("Failed to send notification via Service:", error);
    return NextResponse.json(
      { error: "Failed to send notifications" },
      { status: 500 }
    );
  }
}

export const POST = withAuth(sendNotification, [
  "SUPER_ADMIN",
  "BRANCH_ADMIN",
]);