import { NextResponse } from "next/server";
import { User } from "@/backend/models/postgres";
import { Op } from "sequelize";
import { withAuth } from "@/backend/middleware/auth.middleware.js";

async function getSuperAdminUsers(req) {
  try {
    const currentUser = req.user;
    const { searchParams } = new URL(req.url);
    
    // Support both camelCase and snake_case for branch filtering
    const role = searchParams.get('role');
    const branchId = searchParams.get('branchId') || searchParams.get('branch_id');
    const search = searchParams.get('search');
    const format = searchParams.get('format');
    
    if (currentUser.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    let whereClause = {};

    // Branch filtering
    if (branchId && branchId !== 'all') {
      whereClause.branch_id = branchId;
    }

    // Role filtering
    if (role && role !== 'all') {
      if (role.toLowerCase() === 'student') {
        whereClause.role = "STUDENT";
      } else if (role.toLowerCase() === 'teacher') {
        whereClause.role = "TEACHER";
      } else if (role.toLowerCase() === 'staff') {
        whereClause.role = "STAFF";
      } else if (role.toLowerCase() === 'branch_admin') {
        whereClause.role = "BRANCH_ADMIN";
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

    // If format is dropdown, map to the format expected by dropdowns
    if (format === 'dropdown') {
      const mappedUsers = users.map(user => {
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
    }

    return NextResponse.json({ success: true, data: users });
  } catch (error) {
    console.error("Get Super Admin Users Error:", error);
    return NextResponse.json({ error: "Failed to fetch users", details: error.message }, { status: 500 });
  }
}

export const GET = withAuth(getSuperAdminUsers, ["SUPER_ADMIN"]);
