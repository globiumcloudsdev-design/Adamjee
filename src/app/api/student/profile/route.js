import { NextResponse } from "next/server";
import { withAuth } from "@/backend/middleware/auth.middleware.js";
import { User, Branch } from "@/backend/models/postgres";
import { uploadProfilePhoto, deleteFromCloudinary } from "@/backend/utils/cloudinary";

/**
 * Student profile API
 *
 * IMPORTANT:
 * This project also has a global profile API at:
 *   GET/PUT /api/users/profile
 *
 * This file exists to satisfy the student mapping in:
 *   src/constants/api-endpoints.js => /student/profile
 */

async function getStudentProfile(req) {
  try {
    const userId = req.user.id;

    const user = await User.findByPk(userId, {
      include: [
        {
          model: Branch,
          as: "branch",
          attributes: ["id", "name", "code"],
        },
      ],
      attributes: {
        exclude: ["password_hash", "plain_password"],
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, user }, { status: 200 });
  } catch (error) {
    console.error("Student profile GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

async function updateStudentProfile(req) {
  try {
    const userId = req.user.id;
    const body = await req.json();

    const { first_name, last_name, email, phone, avatar, details, address } = body;

    const user = await User.findByPk(userId);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const updateData = {};

    if (first_name) updateData.first_name = first_name;
    if (last_name) updateData.last_name = last_name;
    if (email) updateData.email = email;
    if (phone) updateData.phone = phone;

    // Merge details
    const currentDetails = user.details || {};
    const newDetails = { ...currentDetails };
    if (address) newDetails.address = address;
    if (details) Object.assign(newDetails, details);
    updateData.details = newDetails;

    // Avatar upload (expects data:image/... base64)
    if (avatar && typeof avatar === "string" && avatar.startsWith("data:image")) {
      if (user.avatar_public_id) {
        await deleteFromCloudinary(user.avatar_public_id).catch(console.error);
      }

      const uploadResult = await uploadProfilePhoto(avatar, userId);
      updateData.avatar_url = uploadResult.url;
      updateData.avatar_public_id = uploadResult.publicId;
    }

    await user.update(updateData);

    return NextResponse.json(
      {
        success: true,
        message: "Profile updated successfully",
        user: {
          id: user.id,
          first_name: user.first_name,
          last_name: user.last_name,
          email: user.email,
          phone: user.phone,
          avatar_url: user.avatar_url,
          role: user.role,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Student profile PUT error:", error);

    if (error?.name === "SequelizeUniqueConstraintError") {
      return NextResponse.json(
        { error: "Email or phone already in use" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to update profile" },
      { status: 500 }
    );
  }
}

export const GET = withAuth(getStudentProfile, ["STUDENT"]);
export const PUT = withAuth(updateStudentProfile, ["STUDENT"]);

