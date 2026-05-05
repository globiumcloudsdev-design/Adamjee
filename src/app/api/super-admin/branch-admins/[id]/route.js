// import { NextResponse } from "next/server";
// import { withAuth } from "@/backend/middleware/auth.middleware.js";
// import { User, Branch } from "@/backend/models/postgres";

// // PUT /api/super-admin/branch-admins/:id
// async function updateBranchAdmin(req, { params }) {
//   const currentUser = req.user;
//   if (currentUser.role !== "SUPER_ADMIN") {
//     return NextResponse.json(
//       { error: "Only Super Admin can update branch admins" },
//       { status: 403 },
//     );
//   }

//   const { id } = params;
//   const admin = await User.findByPk(id);
//   if (!admin || admin.role !== "BRANCH_ADMIN") {
//     return NextResponse.json(
//       { error: "Branch admin not found" },
//       { status: 404 },
//     );
//   }

//   const body = await req.json();
//   const {
//     first_name,
//     last_name,
//     email,
//     phone,
//     password,
//     is_active,
//     registration_no,
//   } = body;

//   // Update fields
//   if (first_name !== undefined) admin.first_name = first_name;
//   if (last_name !== undefined) admin.last_name = last_name;
//   if (email !== undefined) admin.email = email;
//   if (phone !== undefined) admin.phone = phone;
//   if (is_active !== undefined) admin.is_active = is_active;
//   if (registration_no !== undefined) admin.registration_no = registration_no;
//   if (password) {
//     admin.password_hash = password; // will be hashed by hook
//   }

//   admin.updated_by = currentUser.id;
//   await admin.save();

//   // Remove sensitive fields
//   const updatedAdmin = admin.toJSON();
//   delete updatedAdmin.password_hash;
//   delete updatedAdmin.plain_password;

//   return NextResponse.json({ success: true, branch_admin: updatedAdmin });
// }

// // DELETE /api/super-admin/branch-admins/:id
// async function deleteBranchAdmin(req, { params }) {
//   const currentUser = req.user;
//   if (currentUser.role !== "SUPER_ADMIN") {
//     return NextResponse.json(
//       { error: "Only Super Admin can delete branch admins" },
//       { status: 403 },
//     );
//   }

//   const { id } = params;
//   const admin = await User.findByPk(id);
//   if (!admin || admin.role !== "BRANCH_ADMIN") {
//     return NextResponse.json(
//       { error: "Branch admin not found" },
//       { status: 404 },
//     );
//   }

//   // Prevent deleting yourself
//   if (admin.id === currentUser.id) {
//     return NextResponse.json(
//       { error: "You cannot delete your own account" },
//       { status: 400 },
//     );
//   }

//   await admin.destroy(); // soft delete (paranoid true)
//   return NextResponse.json({ success: true, message: "Branch admin deleted" });
// }

// export const DELETE = withAuth(deleteBranchAdmin, ["SUPER_ADMIN"]);
// export const PUT = withAuth(updateBranchAdmin, ["SUPER_ADMIN"]);

import { NextResponse } from "next/server";
import { withAuth } from "@/backend/middleware/auth.middleware.js";
import { User } from "@/backend/models/postgres";
import {
  uploadProfilePhoto,
  deleteFromCloudinary,
  uploadAdminDocument,
} from "@/backend/utils/cloudinary";
import { v4 as uuidv4 } from "uuid";

async function updateBranchAdmin(req, { params }) {
  const currentUser = req.user;
  if (currentUser.role !== "SUPER_ADMIN") {
    return NextResponse.json(
      { error: "Only Super Admin can update branch admins" },
      { status: 403 },
    );
  }

  const { id } = await params;
  const admin = await User.findByPk(id);
  if (!admin || admin.role !== "BRANCH_ADMIN") {
    return NextResponse.json(
      { error: "Branch admin not found" },
      { status: 404 },
    );
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
    data = await req.json();
  }

  const {
    first_name,
    last_name,
    email,
    phone,
    password,
    is_active,
    registration_no,
    avatar,
  } = data;

  // Update simple fields
  if (first_name !== undefined) admin.first_name = first_name;
  if (last_name !== undefined) admin.last_name = last_name;
  if (email !== undefined) admin.email = email;
  if (phone !== undefined) admin.phone = phone;
  if (is_active !== undefined) admin.is_active = is_active;
  if (registration_no !== undefined) admin.registration_no = registration_no;
  if (password) admin.password_hash = password;

  // Handle avatar update
  if (avatar && avatar.startsWith("data:image")) {
    if (admin.avatar_public_id) {
      await deleteFromCloudinary(admin.avatar_public_id).catch(console.error);
    }
    const uploadResult = await uploadProfilePhoto(avatar, admin.id);
    admin.avatar_url = uploadResult.url;
    admin.avatar_public_id = uploadResult.publicId;
  } else if (formData && formData.get('profilePhoto')) {
    const profilePhoto = formData.get('profilePhoto');
    if (profilePhoto instanceof File) {
      if (admin.avatar_public_id) {
        await deleteFromCloudinary(admin.avatar_public_id).catch(console.error);
      }
      const buffer = Buffer.from(await profilePhoto.arrayBuffer());
      const base64 = `data:${profilePhoto.type};base64,${buffer.toString('base64')}`;
      const uploadResult = await uploadProfilePhoto(base64, admin.id);
      admin.avatar_url = uploadResult.url;
      admin.avatar_public_id = uploadResult.publicId;
    }
  }

  // Handle documents update
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
            const uploadRes = await uploadAdminDocument(base64, admin.id, meta.type || "other");
            
            updatedDocs.push({
              id: uuidv4(),
              type: meta.type || "other",
              name: meta.name || file.name,
              url: uploadRes.url,
              publicId: uploadRes.publicId,
              uploaded_at: new Date().toISOString()
            });
          } catch (uploadErr) {
            console.error("Doc Upload Error:", uploadErr);
          }
        }
      }
    }
    admin.documents = updatedDocs;
    admin.changed('documents', true);
  } else if (data.documents) {
    // If sent via JSON (e.g. just deleting a doc)
    admin.documents = data.documents;
    admin.changed('documents', true);
  }

  admin.updated_by = currentUser.id;
  await admin.save();

  const updatedAdmin = admin.toJSON();
  delete updatedAdmin.password_hash;
  delete updatedAdmin.plain_password;

  return NextResponse.json({ success: true, branch_admin: updatedAdmin });
}

async function deleteBranchAdmin(req, { params }) {
  const currentUser = req.user;
  if (currentUser.role !== "SUPER_ADMIN") {
    return NextResponse.json(
      { error: "Only Super Admin can delete branch admins" },
      { status: 403 },
    );
  }

  const { id } = await params;
  const admin = await User.findByPk(id);
  if (!admin || admin.role !== "BRANCH_ADMIN") {
    return NextResponse.json(
      { error: "Branch admin not found" },
      { status: 404 },
    );
  }

  if (admin.id === currentUser.id) {
    return NextResponse.json(
      { error: "You cannot delete your own account" },
      { status: 400 },
    );
  }

  // Delete associated Cloudinary files
  if (admin.avatar_public_id)
    await deleteFromCloudinary(admin.avatar_public_id).catch(console.error);
  if (admin.qr_code_public_id)
    await deleteFromCloudinary(admin.qr_code_public_id).catch(console.error);

  await admin.destroy();
  return NextResponse.json({ success: true, message: "Branch admin deleted" });
}

export const PUT = withAuth(updateBranchAdmin, ["SUPER_ADMIN"]);
export const DELETE = withAuth(deleteBranchAdmin, ["SUPER_ADMIN"]);
