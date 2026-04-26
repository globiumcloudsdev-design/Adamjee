import { NextResponse } from "next/server";
import { withAuth } from "@/backend/middleware/auth.middleware.js";
import { Sequelize } from "sequelize";
import { User, Branch, Class, Group, Section, AcademicYear } from '@/backend/models/postgres';
import { Op } from "sequelize";

async function overallBranchStatsHandler() {
  // Total branches count
  const totalBranches = await Branch.count();
  const activeBranches = await Branch.count({ where: { is_active: true } });
  const inactiveBranches = totalBranches - activeBranches;

  // User count per branch (branch-wise)
  const userCountPerBranch = await User.findAll({
    attributes: [
      "branch_id",
      [Sequelize.fn("COUNT", Sequelize.col("id")), "user_count"],
      [
        Sequelize.fn(
          "SUM",
          Sequelize.cast(Sequelize.col("is_active"), "integer"),
        ),
        "active_user_count",
      ],
    ],
    where: { branch_id: { [Sequelize.Op.ne]: null } },
    group: ["branch_id"],
    raw: true,
    include: [
      {
        model: Branch,
        as: "branch",
        attributes: ["name", "code"],
        required: true,
      },
    ],
  });

  // Role-wise user count across all branches
  const roleStats = await User.findAll({
    where: { branch_id: { [Sequelize.Op.ne]: null } },
    attributes: [
      "role",
      [Sequelize.fn("COUNT", Sequelize.col("role")), "count"],
    ],
    group: ["role"],
    raw: true,
  });

  const roleCounts = {};
  roleStats.forEach((stat) => {
    roleCounts[stat.role] = parseInt(stat.count);
  });

  // Total users in branches
  const totalUsersInBranches = await User.count({
    where: { branch_id: { [Sequelize.Op.ne]: null } },
  });
  const activeUsersInBranches = await User.count({
    where: { branch_id: { [Sequelize.Op.ne]: null }, is_active: true },
  });

  // Format branch-wise stats
  const branchesDetail = userCountPerBranch.map((item) => ({
    branch_id: item.branch_id,
    branch_name: item["branch.name"],
    branch_code: item["branch.code"],
    total_users: parseInt(item.user_count),
    active_users: parseInt(item.active_user_count),
    inactive_users:
      parseInt(item.user_count) - parseInt(item.active_user_count),
  }));

  return NextResponse.json({
    summary: {
      total_branches: totalBranches,
      active_branches: activeBranches,
      inactive_branches: inactiveBranches,
      total_users_in_branches: totalUsersInBranches,
      active_users_in_branches: activeUsersInBranches,
      inactive_users_in_branches: totalUsersInBranches - activeUsersInBranches,
      user_by_role: roleCounts,
    },
    branches: branchesDetail,
  });
}

export const GET = withAuth(overallBranchStatsHandler, ["SUPER_ADMIN"]);
