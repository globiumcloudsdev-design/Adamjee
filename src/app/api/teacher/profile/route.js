import { NextResponse } from "next/server";
import { withAuth } from "@/backend/middleware/auth.middleware";
import { User, Branch } from "@/backend/models/postgres";

async function getTeacherProfile(req) {
  try {
    const user = req.user;
    const teacherId = user.id;

    // Fetch complete teacher profile
    const teacher = await User.findByPk(teacherId, {
      include: [
        { model: Branch, as: "branch", attributes: ["id", "name", "address", "phone", "email"] }
      ],
      attributes: [
        "id",
        "first_name",
        "last_name",
        "email",
        "phone",
        "avatar_url",
        "role",
        "status",
        "branch_id",
        "qualification",
        "bio",
        "created_at",
        "updated_at"
      ]
    });

    if (!teacher) {
      return NextResponse.json(
        { success: false, message: "Teacher not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        id: teacher.id,
        first_name: teacher.first_name,
        last_name: teacher.last_name,
        full_name: `${teacher.first_name} ${teacher.last_name}`,
        email: teacher.email,
        phone: teacher.phone,
        avatar_url: teacher.avatar_url,
        role: teacher.role,
        status: teacher.status,
        qualification: teacher.qualification,
        bio: teacher.bio,
        branch: {
          id: teacher.branch?.id,
          name: teacher.branch?.name,
          address: teacher.branch?.address,
          phone: teacher.branch?.phone,
          email: teacher.branch?.email
        },
        joined_date: teacher.created_at,
        last_updated: teacher.updated_at
      }
    });

  } catch (error) {
    console.error("Teacher Profile API Error:", error);
    return NextResponse.json(
      { 
        success: false, 
        message: "Failed to fetch profile", 
        error: error.message 
      },
      { status: 500 }
    );
  }
}

// PUT /api/teacher/profile - Update teacher profile
async function updateTeacherProfile(req) {
  try {
    const user = req.user;
    const teacherId = user.id;
    const { phone, bio, qualification, avatar_url } = await req.json();

    const teacher = await User.findByPk(teacherId);

    if (!teacher) {
      return NextResponse.json(
        { success: false, message: "Teacher not found" },
        { status: 404 }
      );
    }

    // Update allowed fields
    if (phone) teacher.phone = phone;
    if (bio) teacher.bio = bio;
    if (qualification) teacher.qualification = qualification;
    if (avatar_url) teacher.avatar_url = avatar_url;

    await teacher.save();

    return NextResponse.json({
      success: true,
      message: "Profile updated successfully",
      data: {
        id: teacher.id,
        first_name: teacher.first_name,
        last_name: teacher.last_name,
        email: teacher.email,
        phone: teacher.phone,
        qualification: teacher.qualification,
        bio: teacher.bio,
        avatar_url: teacher.avatar_url
      }
    });

  } catch (error) {
    console.error("Profile Update API Error:", error);
    return NextResponse.json(
      { 
        success: false, 
        message: "Failed to update profile", 
        error: error.message 
      },
      { status: 500 }
    );
  }
}

export const GET = withAuth(getTeacherProfile, ["TEACHER"]);
export const PUT = withAuth(updateTeacherProfile, ["TEACHER"]);
