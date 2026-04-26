import { NextResponse } from "next/server";
import { User } from "@/backend/models/postgres";
import { getCurrentUser } from "@/lib/auth";
import { deleteFromCloudinary } from "@/backend/utils/cloudinary";

export async function DELETE(req, { params }) {
  try {
    const currentUser = await getCurrentUser(req);
    if (!currentUser) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

    const resolvedParams = await params;
    const id = resolvedParams.id;

    const teacher = await User.findByPk(id);
    if (!teacher) return NextResponse.json({ success: false, error: "Teacher not found" }, { status: 404 });

    const isSuperAdmin = currentUser.role === "SUPER_ADMIN";
    const userBranchId = currentUser.branch_id || currentUser.branchId;

    if (!isSuperAdmin && teacher.branch_id !== userBranchId) {
      return NextResponse.json({ success: false, error: "Access Denied" }, { status: 403 });
    }

    if (teacher.documents && teacher.documents.length > 0) {
      for (const doc of teacher.documents) {
        if (doc.publicId) {
          await deleteFromCloudinary(doc.publicId, 'raw');
        }
      }
    }

    if (teacher.details?.avatar_public_id) {
      await deleteFromCloudinary(teacher.details.avatar_public_id, 'image');
    }

    await teacher.destroy();

    return NextResponse.json({
      success: true,
      message: "Teacher deleted successfully"
    });
  } catch (error) {
    console.error("Delete Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(req, { params }) {
  try {
    const currentUser = await getCurrentUser(req);
    if (!currentUser) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

    const data = await req.json();
    const resolvedParams = await params;
    const id = resolvedParams.id;

    const teacher = await User.findByPk(id);
    if (!teacher) return NextResponse.json({ success: false, error: "Teacher not found" }, { status: 404 });

    const isSuperAdmin = currentUser.role === "SUPER_ADMIN";
    const userBranchId = currentUser.branch_id || currentUser.branchId;

    if (!isSuperAdmin && teacher.branch_id !== userBranchId) {
      return NextResponse.json({ success: false, error: "Access Denied" }, { status: 403 });
    }

    const updateData = {};
    if (data.firstName) updateData.first_name = data.firstName;
    if (data.lastName) updateData.last_name = data.lastName;
    if (data.email) updateData.email = data.email;
    if (data.phone) updateData.phone = data.phone;
    if (data.alternatePhone) updateData.alternate_phone = data.alternatePhone;
    if (data.status) updateData.is_active = (data.status === 'active');

    if (isSuperAdmin && data.branchId) {
      updateData.branch_id = data.branchId;
    }

    const currentDetails = teacher.details || {};
    updateData.details = {
      ...currentDetails,
      gender: data.gender || currentDetails.gender,
      date_of_birth: data.dateOfBirth || currentDetails.date_of_birth,
      cnic: data.cnic || currentDetails.cnic,
      religion: data.religion || currentDetails.religion,
      nationality: data.nationality || currentDetails.nationality,
      blood_group: data.bloodGroup || currentDetails.blood_group,
      address: data.address || currentDetails.address,
      teacher: {
        ...(currentDetails.teacher || {}),
        ...(data.teacherProfile || {}),
        designation: data.designation || data.teacherProfile?.designation || currentDetails.teacher?.designation,
        status: data.status || currentDetails.teacher?.status || (teacher.is_active ? 'active' : 'inactive')
      }
    };

    if (data.profilePhoto) {
      updateData.avatar_url = data.profilePhoto.url;
      updateData.details.avatar_public_id = data.profilePhoto.publicId;
    }

    await teacher.update(updateData);

    return NextResponse.json({
      success: true,
      message: "Teacher updated successfully",
      data: teacher
    });
  } catch (error) {
    console.error("Update Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}