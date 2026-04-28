import { NextResponse } from "next/server";
import { User, sequelize, Branch } from "@/backend/models/postgres";
import { Op } from "sequelize";
import { withAuth } from "@/backend/middleware/auth.middleware.js";
import { uploadStaffDocument, uploadProfilePhoto, deleteFromCloudinary } from "@/backend/utils/cloudinary";


/**
 * GET /api/users/staff/[id]
 */
async function getStaff(req, { params }) {
  try {
    const { id } = await params;
    const currentUser = req.user;

    const staff = await User.findByPk(id, {
      include: [{ model: Branch, as: "branch", attributes: ["id", "name", "code"] }],
      attributes: { exclude: ["password_hash"] }
    });

    if (!staff || (staff.role !== "STAFF" && staff.role !== "TEACHER")) {
      return NextResponse.json({ error: "Staff member not found" }, { status: 404 });
    }

    if (currentUser.role !== "SUPER_ADMIN" && staff.branch_id !== currentUser.branch_id) {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 403 });
    }

    return NextResponse.json({
      success: true,
      data: staff
    });
  } catch (error) {
    console.error("Get Staff Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * PUT /api/users/staff/[id]

 * Integrated Update: Handles BOTH JSON (for simple toggles) and FormData (for file uploads)
 */
async function updateStaff(req, { params }) {
  const transaction = await sequelize.transaction();
  const uploadedPublicIds = [];
  
  try {
    const { id } = await params;
    const currentUser = req.user;

    const staff = await User.findByPk(id);
    if (!staff || (staff.role !== "STAFF" && staff.role !== "TEACHER")) {
      return NextResponse.json({ error: "Staff member not found" }, { status: 404 });
    }


    if (currentUser.role !== "SUPER_ADMIN" && staff.branch_id !== currentUser.branch_id) {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 403 });
    }

    // --- Content-Type Detection ---
    const contentType = req.headers.get("content-type") || "";
    let data = {};
    let formData = null;

    if (contentType.includes("multipart/form-data")) {
      formData = await req.formData();
      const dataStr = formData.get('data');
      if (dataStr) data = JSON.parse(dataStr);
    } else {
      // Assume JSON
      data = await req.json();
    }

    // 1. Handle Profile Photo Update (Only if FormData is used)
    let avatarUrl = data.avatarUrl || data.avatar_url || staff.avatar_url;
    if (formData) {
      const profilePhoto = formData.get('profilePhoto');
      if (profilePhoto && profilePhoto instanceof File) {
        try {
          const buffer = Buffer.from(await profilePhoto.arrayBuffer());
          const base64 = `data:${profilePhoto.type};base64,${buffer.toString('base64')}`;
          const uploadRes = await uploadProfilePhoto(base64, staff.id);
          avatarUrl = uploadRes.url;
          uploadedPublicIds.push(uploadRes.publicId);
        } catch (photoErr) {
          console.error("Photo Update Error:", photoErr);
        }
      }
    }

    // 2. Handle Documents Update (Only if FormData is used)
    let finalDocuments = data.documents || staff.documents || [];
    if (formData) {
      const docFiles = formData.getAll('documents');
      const docMetaStr = formData.get('documentMetadata');
      const docMeta = docMetaStr ? JSON.parse(docMetaStr) : [];
      
      const updatedDocs = [];
      let fileIdx = 0;
      for (const meta of docMeta) {
        if (meta.isExisting) {
          updatedDocs.push(meta);
        } else {
          const file = docFiles[fileIdx++];
          if (file && file instanceof File) {
            try {
              const buffer = Buffer.from(await file.arrayBuffer());
              const base64 = `data:${file.type};base64,${buffer.toString('base64')}`;
              const uploadRes = await uploadStaffDocument(base64, staff.id, meta.type);
              
              updatedDocs.push({
                id: crypto.randomUUID(),
                type: meta.type,
                name: meta.name || file.name,
                url: uploadRes.url,
                publicId: uploadRes.publicId,
                uploaded_at: new Date().toISOString()
              });
              uploadedPublicIds.push(uploadRes.publicId);
            } catch (uploadErr) {
              console.error("Doc Upload Error:", uploadErr);
            }
          }
        }
      }
      finalDocuments = updatedDocs;
    }

    // 3. Update DB
    const newDetails = {
      ...(staff.details || {}),
      ...data,
      documents: finalDocuments,
    };

    // Clean up data for top-level fields
    const updateFields = {};
    if (data.first_name || data.firstName) updateFields.first_name = data.first_name || data.firstName;
    if (data.last_name || data.lastName) updateFields.last_name = data.last_name || data.lastName;
    if (data.phone) updateFields.phone = data.phone;
    if (data.is_active !== undefined) updateFields.is_active = data.is_active;
    if (data.isActive !== undefined) updateFields.is_active = data.isActive;
    if (data.staff_sub_type || data.staffSubType) updateFields.staff_sub_type = data.staff_sub_type || data.staffSubType;
    
    updateFields.avatar_url = avatarUrl;
    updateFields.documents = finalDocuments;
    updateFields.details = newDetails;

    await staff.update(updateFields, { transaction });

    await transaction.commit();

    return NextResponse.json({
      success: true,
      message: "Staff updated successfully",
      data: staff
    });

  } catch (error) {
    if (transaction) await transaction.rollback();
    console.error("Update Failure:", error);

    // CLEANUP
    for (const publicId of uploadedPublicIds) {
      try {
        await deleteFromCloudinary(publicId);
      } catch (delErr) {
        console.error("Cleanup Error:", delErr);
      }
    }

    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * DELETE /api/users/staff/[id]
 */
async function deleteStaff(req, { params }) {
  try {
    const { id } = await params;
    const currentUser = req.user;

    const staff = await User.findByPk(id);
    if (!staff || (staff.role !== "STAFF" && staff.role !== "TEACHER")) {
      return NextResponse.json({ error: "Staff not found" }, { status: 404 });
    }


    if (currentUser.role !== "SUPER_ADMIN" && staff.branch_id !== currentUser.branch_id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    await staff.destroy();
    return NextResponse.json({ success: true, message: "Staff deleted successfully" });
  } catch (error) {
    console.error("Delete Staff Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export const GET = withAuth(getStaff, ["SUPER_ADMIN", "BRANCH_ADMIN"]);
export const PUT = withAuth(updateStaff, ["SUPER_ADMIN", "BRANCH_ADMIN"]);
export const DELETE = withAuth(deleteStaff, ["SUPER_ADMIN", "BRANCH_ADMIN"]);

