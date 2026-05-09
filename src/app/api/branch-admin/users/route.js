import { NextResponse } from "next/server";
import { User } from "@/backend/models/postgres";
import { Op } from "sequelize";
import { withAuth } from "@/backend/middleware/auth.middleware.js";

async function getBranchUsers(req) {
  try {
    const currentUser = req.user;
    const { searchParams } = new URL(req.url);
    const role = searchParams.get('role');
    const search = searchParams.get('search');
    
    if (currentUser.role !== "BRANCH_ADMIN" && currentUser.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    let whereClause = {};

    // For branch admins, scope to their branch
    if (currentUser.role === "BRANCH_ADMIN") {
      whereClause.branch_id = currentUser.branch_id;
    }

    // Role filtering
    if (role) {
      if (role.toLowerCase() === 'student') {
        whereClause.role = "STUDENT";
      } else if (role.toLowerCase() === 'teacher') {
        whereClause.role = "TEACHER";
      } else if (role.toLowerCase() === 'staff') {
        whereClause.role = "STAFF";
      } else if (role.toLowerCase() === 'parent') {
        whereClause.role = "PARENT";
      } else {
        whereClause.role = role.toUpperCase();
      }
    }

    if (search) {
      whereClause[Op.or] = [
        { first_name: { [Op.iLike]: `%${search}%` } },
        { last_name: { [Op.iLike]: `%${search}%` } },
        { registration_no: { [Op.iLike]: `%${search}%` } },
      ];
    }

    const users = await User.findAll({
      where: whereClause,
      attributes: ["id", "first_name", "last_name", "registration_no", "role", "email", "details"],
      order: [["first_name", "ASC"]],
    });

    // Map to the format expected by dropdowns { value, label, subLabel }
    const mappedUsers = users.map(user => {
      // Build label carefully to avoid undefined or double spaces
      const nameParts = [user.first_name, user.last_name].filter(Boolean);
      const fullName = nameParts.length > 0 ? nameParts.join(' ') : 'Unknown User';
      
      let label = fullName;
      if (user.role === 'STUDENT') {
        const studentGrNo = user.details?.academic_info?.roll_no;
        if (studentGrNo) {
          label = `${fullName} (GR NO: ${studentGrNo})`;
        }
      } else {
        if (user.registration_no) {
          label = `${fullName} (REG NO: ${user.registration_no})`;
        }
      }
      
      return {
        value: user.id,
        label,
        subLabel: user.email || user.role
      };
    });

    return NextResponse.json({ success: true, data: mappedUsers });
  } catch (error) {
    console.error("Get Branch Users Error:", error);
    return NextResponse.json({ error: "Failed to fetch users", details: error.message }, { status: 500 });
  }
}

export const GET = withAuth(getBranchUsers, ["SUPER_ADMIN", "BRANCH_ADMIN"]);
