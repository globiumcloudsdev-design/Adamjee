import { NextResponse } from "next/server";
import crypto from "crypto";
import { sequelize, User, Branch } from "@/backend/models/postgres";
import { getCurrentUser } from "@/lib/auth";
import { 
  deleteFromCloudinary, 
  uploadProfilePhoto, 
  uploadTeacherDocument 
} from "@/backend/utils/cloudinary";

export async function GET(req, { params }) {
  try {
    const currentUser = await getCurrentUser(req);
    if (!currentUser) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

    const resolvedParams = await params;
    const id = resolvedParams.id;

    const teacher = await User.findByPk(id, {
      include: [
        {
          model: Branch,
          as: "branch",
          attributes: ["id", "name", "code"],
        },
      ],
    });

    if (!teacher || teacher.role !== "TEACHER") {
      return NextResponse.json({ success: false, error: "Teacher not found" }, { status: 404 });
    }

    const isSuperAdmin = currentUser.role === "SUPER_ADMIN";
    const userBranchId = currentUser.branch_id || currentUser.branchId;

    if (!isSuperAdmin && teacher.branch_id !== userBranchId) {
      return NextResponse.json({ success: false, error: "Access Denied" }, { status: 403 });
    }

    return NextResponse.json({
      success: true,
      data: teacher
    });
  } catch (error) {
    console.error("Get Teacher Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

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

    // Cleanup files
    if (teacher.details?.documents && Array.isArray(teacher.details.documents)) {
      for (const doc of teacher.details.documents) {
        if (doc.publicId) {
          await deleteFromCloudinary(doc.publicId);
        }
      }
    }

    if (teacher.details?.avatar_public_id) {
      await deleteFromCloudinary(teacher.details.avatar_public_id);
    }
    
    if (teacher.details?.qr_public_id) {
      await deleteFromCloudinary(teacher.details.qr_public_id);
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
  const transaction = await sequelize.transaction();
  const uploadedPublicIds = [];
  
  try {
    const currentUser = await getCurrentUser(req);
    if (!currentUser) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

    const formData = await req.formData();
    const dataStr = formData.get('data');
    const data = dataStr ? JSON.parse(dataStr) : {};

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

    // 1. Handle Profile Photo Upload
    let avatarUrl = teacher.avatar_url;
    let avatarPublicId = teacher.details?.avatar_public_id;
    const profilePhoto = formData.get('profilePhoto');
    
    if (profilePhoto && profilePhoto instanceof File) {
      // Delete old photo if exists
      if (avatarPublicId) {
        try { await deleteFromCloudinary(avatarPublicId); } catch (e) {}
      }
      
      const buffer = Buffer.from(await profilePhoto.arrayBuffer());
      const base64 = `data:${profilePhoto.type};base64,${buffer.toString('base64')}`;
      const uploadRes = await uploadProfilePhoto(base64, teacher.id);
      avatarUrl = uploadRes.url;
      avatarPublicId = uploadRes.publicId;
      uploadedPublicIds.push(avatarPublicId);
    }

    // 2. Handle Documents Upload
    const docFiles = formData.getAll('documents');
    const docMetaStr = formData.get('documentMetadata');
    const allDocMeta = docMetaStr ? JSON.parse(docMetaStr) : [];
    
    // Filter out metadata for new files only to match docFiles array order
    const newDocMeta = allDocMeta.filter(m => !m.isExisting);
    
    const existingDocuments = teacher.details?.documents || [];
    const updatedDocuments = [...existingDocuments];

    for (let i = 0; i < docFiles.length; i++) {
      const file = docFiles[i];
      const meta = newDocMeta[i];
      
      if (file && file instanceof File) {
        const buffer = Buffer.from(await file.arrayBuffer());
        const base64 = `data:${file.type};base64,${buffer.toString('base64')}`;
        const uploadRes = await uploadTeacherDocument(base64, teacher.id, meta?.type || 'other');
        
        updatedDocuments.push({
          id: crypto.randomUUID(),
          type: meta?.type || 'other',
          name: meta?.name || file.name,
          url: uploadRes.url,
          publicId: uploadRes.publicId,
          uploaded_at: new Date().toISOString()
        });
        uploadedPublicIds.push(uploadRes.publicId);
      }
    }

    // Handle document deletions if any (provided in allDocMeta)
    const finalDocuments = updatedDocuments.filter(doc => {
      const isDeleted = allDocMeta.some(m => m.isExisting && m.publicId === doc.publicId && m.isDeleted);
      if (isDeleted && doc.publicId) {
        deleteFromCloudinary(doc.publicId).catch(console.error);
        return false;
      }
      return true;
    });

    const currentDetails = teacher.details || {};
    updateData.avatar_url = avatarUrl;
    updateData.documents = finalDocuments;
    updateData.details = {
      ...currentDetails,
      gender: data.gender || currentDetails.gender,
      date_of_birth: data.dateOfBirth || currentDetails.date_of_birth,
      cnic: data.cnic || currentDetails.cnic,
      religion: data.religion || currentDetails.religion,
      nationality: data.nationality || currentDetails.nationality,
      blood_group: data.bloodGroup || currentDetails.blood_group,
      address: data.address || currentDetails.address,
      avatar_public_id: avatarPublicId,
      documents: finalDocuments,
      teacher: {
        ...(currentDetails.teacher || {}),
        ...(data.teacherProfile || {}),
        designation: data.designation || data.teacherProfile?.designation || currentDetails.teacher?.designation,
        status: data.status || currentDetails.teacher?.status || (teacher.is_active ? 'active' : 'inactive')
      }
    };

    await teacher.update(updateData, { transaction });
    await transaction.commit();

    return NextResponse.json({
      success: true,
      message: "Teacher updated successfully",
      data: teacher
    });
  } catch (error) {
    if (transaction) await transaction.rollback();
    console.error("Update Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}