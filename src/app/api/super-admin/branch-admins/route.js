// import { NextResponse } from "next/server";
// import { withAuth } from "@/backend/middleware/auth.middleware.js";
// import { User, Branch } from "@/backend/models/postgres";
// import sequelize from "@/backend/config/database";
// import { sendEmail } from "@/backend/utils/emailService";

// // Helper to generate unique registration_no for branch admin
// async function generateBranchAdminId(branchCode) {
//   const prefix = `BA-${branchCode.toUpperCase()}`;
//   const lastAdmin = await User.findOne({
//     where: {
//       role: "BRANCH_ADMIN",
//       registration_no: { [User.sequelize.Sequelize.Op.startsWith]: prefix },
//     },
//     order: [["registration_no", "DESC"]],
//   });
//   let lastSeq = 0;
//   if (lastAdmin && lastAdmin.registration_no) {
//     const parts = lastAdmin.registration_no.split("-");
//     lastSeq = parseInt(parts[parts.length - 1]) || 0;
//   }
//   const newSeq = (lastSeq + 1).toString().padStart(3, "0");
//   return `${prefix}-${newSeq}`;
// }

// async function createBranchAdmin(req) {
//   const currentUser = req.user;
//   if (currentUser.role !== "SUPER_ADMIN") {
//     return NextResponse.json(
//       { error: "Only Super Admin can add branch admins" },
//       { status: 403 },
//     );
//   }

//   const body = await req.json();
//   let {
//     branch_id,
//     first_name,
//     last_name,
//     email,
//     phone,
//     password,
//     registration_no,
//     details,
//   } = body;

//   if (!branch_id || !first_name || !last_name || !phone || !password) {
//     return NextResponse.json(
//       { error: "branch_id, first_name, last_name, phone, password required" },
//       { status: 400 },
//     );
//   }

//   const branch = await Branch.findByPk(branch_id);
//   if (!branch) {
//     return NextResponse.json({ error: "Branch not found" }, { status: 404 });
//   }

//   // Check existing user with same email/phone
//   const existingUser = await User.findOne({
//     where: {
//       [User.sequelize.Sequelize.Op.or]: [{ email: email || null }, { phone }],
//     },
//   });
//   if (existingUser) {
//     return NextResponse.json(
//       { error: "Email or phone already registered" },
//       { status: 409 },
//     );
//   }

//   // Generate registration_no if not provided
//   if (!registration_no) {
//     registration_no = await generateBranchAdminId(branch.code);
//   } else {
//     // Check uniqueness if provided
//     const existingId = await User.findOne({ where: { registration_no } });
//     if (existingId) {
//       return NextResponse.json(
//         { error: "Registration number already exists" },
//         { status: 409 },
//       );
//     }
//   }

//   const transaction = await sequelize.transaction();
//   try {
//     const newAdmin = await User.create(
//       {
//         role: "BRANCH_ADMIN",
//         first_name,
//         last_name,
//         email: email || null,
//         phone,
//         registration_no,
//         password_hash: password,
//         branch_id,
//         details: details || {},
//         created_by: currentUser.id,
//         is_active: true,
//       },
//       { transaction },
//     );
//     await transaction.commit();

//     // Send email if email provided
//     if (email) {
//       const emailHtml = `
//         <h2>Welcome as Branch Admin</h2>
//         <p>Dear ${first_name} ${last_name},</p>
//         <p>You have been added as a Branch Admin for <strong>${branch.name}</strong>.</p>
//         <p><strong>Your Branch Admin ID:</strong> ${registration_no}</p>
//         <p><strong>Login Credentials:</strong></p>
//         <ul>
//           <li>Login ID: ${email}</li>
//           <li>Password: ${password}</li>
//         </ul>
//         <p>Please change your password after first login.</p>
//       `;
//       await sendEmail(
//         email,
//         "Welcome to Adamjee Coaching - Branch Admin Access",
//         emailHtml,
//       );
//     }

//     const adminResponse = {
//       id: newAdmin.id,
//       first_name: newAdmin.first_name,
//       last_name: newAdmin.last_name,
//       email: newAdmin.email,
//       phone: newAdmin.phone,
//       registration_no: newAdmin.registration_no,
//       role: newAdmin.role,
//       branch_id: newAdmin.branch_id,
//       is_active: newAdmin.is_active,
//       created_at: newAdmin.created_at,
//     };
//     return NextResponse.json(
//       { success: true, branch_admin: adminResponse },
//       { status: 201 },
//     );
//   } catch (error) {
//     await transaction.rollback();
//     console.error("Create branch admin error:", error);
//     return NextResponse.json(
//       { error: "Internal server error" },
//       { status: 500 },
//     );
//   }
// }

// // GET /api/super-admin/branch-admins?branch_id=...
// async function listBranchAdmins(req) {
//   const currentUser = req.user;
//   if (currentUser.role !== "SUPER_ADMIN") {
//     return NextResponse.json({ error: "Forbidden" }, { status: 403 });
//   }
//   const { searchParams } = new URL(req.url);
//   const branch_id = searchParams.get("branch_id");
//   const where = { role: "BRANCH_ADMIN" };
//   if (branch_id) where.branch_id = branch_id;
//   const admins = await User.findAll({
//     where,
//     attributes: {
//       exclude: [
//         "password_hash",
//         "plain_password",
//         "password_reset_token",
//         "password_reset_expires",
//       ],
//     },
//     order: [["created_at", "DESC"]],
//   });
//   return NextResponse.json({ branch_admins: admins });
// }

// export const GET = withAuth(listBranchAdmins, ["SUPER_ADMIN"]);
// export const POST = withAuth(createBranchAdmin, ["SUPER_ADMIN"]);

import { NextResponse } from "next/server";
import { withAuth } from "@/backend/middleware/auth.middleware.js";
import { User, Branch } from "@/backend/models/postgres";
import sequelize from "@/backend/config/database";
import { sendEmail } from "@/backend/utils/emailService";
import {
  uploadProfilePhoto,
  uploadQR,
  deleteFromCloudinary,
  uploadAdminDocument,
} from "@/backend/utils/cloudinary";
import QRCode from "qrcode";
import { getWelcomeEmailTemplate } from "@/backend/utils/email-templates";
import { v4 as uuidv4 } from "uuid";

// Helper to generate unique registration_no for branch admin
async function generateBranchAdminId(branchCode) {
  const prefix = `BA-${branchCode.toUpperCase()}`;
  const lastAdmin = await User.findOne({
    where: {
      registration_no: { [User.sequelize.Sequelize.Op.startsWith]: prefix },
    },
    order: [["registration_no", "DESC"]],
    paranoid: false,
  });
  let lastSeq = 0;
  if (lastAdmin && lastAdmin.registration_no) {
    const parts = lastAdmin.registration_no.split("-");
    lastSeq = parseInt(parts[parts.length - 1]) || 0;
  }
  const newSeq = (lastSeq + 1).toString().padStart(3, "0");
  return `${prefix}-${newSeq}`;
}

async function createBranchAdmin(req) {
  const currentUser = req.user;
  if (currentUser.role !== "SUPER_ADMIN") {
    return NextResponse.json(
      { error: "Only Super Admin can add branch admins" },
      { status: 403 },
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

  let {
    branch_id,
    first_name,
    last_name,
    email,
    phone,
    password,
    registration_no,
    details,
    avatar,
  } = data;

  if (!branch_id || !first_name || !last_name || !phone || !password) {
    return NextResponse.json(
      { error: "branch_id, first_name, last_name, phone, password required" },
      { status: 400 },
    );
  }

  const branch = await Branch.findByPk(branch_id);
  if (!branch) {
    return NextResponse.json({ error: "Branch not found" }, { status: 404 });
  }

  // Check existing user with same email/phone
  const existingUser = await User.findOne({
    where: {
      [User.sequelize.Sequelize.Op.or]: [{ email: email || null }, { phone }],
    },
  });
  if (existingUser) {
    return NextResponse.json(
      { error: "Email or phone already registered" },
      { status: 409 },
    );
  }

  // Generate registration_no if not provided
  if (!registration_no) {
    registration_no = await generateBranchAdminId(branch.code);
  } else {
    const existingId = await User.findOne({ where: { registration_no } });
    if (existingId) {
      return NextResponse.json(
        { error: "Registration number already exists" },
        { status: 409 },
      );
    }
  }

  const transaction = await sequelize.transaction();
  let avatarUrl = null,
    avatarPublicId = null;
  let qrCodeUrl = null,
    qrCodePublicId = null;

  try {
    // First create user to get ID (for folder naming)
    const newAdmin = await User.create(
      {
        role: "BRANCH_ADMIN",
        first_name,
        last_name,
        email: email || null,
        phone,
        registration_no,
        password_hash: password,
        branch_id,
        details: details || {},
        created_by: currentUser.id,
        is_active: true,
      },
      { transaction },
    );

    // Handle avatar upload (if provided)
    if (avatar && avatar.startsWith("data:image")) {
      const uploadResult = await uploadProfilePhoto(avatar, newAdmin.id);
      avatarUrl = uploadResult.url;
      avatarPublicId = uploadResult.publicId;
    } else if (formData && formData.get('profilePhoto')) {
      const profilePhoto = formData.get('profilePhoto');
      if (profilePhoto instanceof File) {
        const buffer = Buffer.from(await profilePhoto.arrayBuffer());
        const base64 = `data:${profilePhoto.type};base64,${buffer.toString('base64')}`;
        const uploadResult = await uploadProfilePhoto(base64, newAdmin.id);
        avatarUrl = uploadResult.url;
        avatarPublicId = uploadResult.publicId;
      }
    }

    // Handle documents upload (if provided via FormData)
    let finalDocuments = [];
    if (formData) {
      const docFiles = formData.getAll('documents');
      const docMetaStr = formData.get('documentMetadata');
      const docMeta = docMetaStr ? JSON.parse(docMetaStr) : [];
      
      let fileIdx = 0;
      for (const meta of docMeta) {
        const file = docFiles[fileIdx++];
        if (file && file instanceof File) {
          try {
            const buffer = Buffer.from(await file.arrayBuffer());
            const base64 = `data:${file.type};base64,${buffer.toString('base64')}`;
            const uploadRes = await uploadAdminDocument(base64, newAdmin.id, meta.type || "other");
            
            finalDocuments.push({
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

    // Generate QR code (data URL)
    const qrData = JSON.stringify({
      id: newAdmin.id,
      registration_no,
      role: "BRANCH_ADMIN",
    });
    const qrDataUrl = await QRCode.toDataURL(qrData);
    const qrUpload = await uploadQR(qrDataUrl, newAdmin.id, "branch-admin");
    qrCodeUrl = qrUpload.url;
    qrCodePublicId = qrUpload.publicId;

    // Update user with avatar, QR code, and documents
    await newAdmin.update(
      {
        avatar_url: avatarUrl,
        avatar_public_id: avatarPublicId,
        qr_code_url: qrCodeUrl,
        qr_code_public_id: qrCodePublicId,
        documents: finalDocuments,
      },
      { transaction },
    );

    await transaction.commit();

    // Send email if email provided
    if (email) {
      try {
        const emailHtml = getWelcomeEmailTemplate({
          name: `${first_name} ${last_name}`,
          role: "BRANCH_ADMIN",
          id: registration_no,
          email,
          password,
          branchName: branch.name,
        });

        await sendEmail(
          email,
          "Welcome to Adamjee Coaching - Your Access is Ready",
          emailHtml,
        );
      } catch (emailError) {
        console.error("Failed to send welcome email:", emailError);
        // We don't throw here because the user is already created and committed to the DB
      }
    }

    const adminResponse = {
      id: newAdmin.id,
      first_name: newAdmin.first_name,
      last_name: newAdmin.last_name,
      email: newAdmin.email,
      phone: newAdmin.phone,
      registration_no: newAdmin.registration_no,
      role: newAdmin.role,
      branch_id: newAdmin.branch_id,
      avatar_url: newAdmin.avatar_url,
      qr_code_url: newAdmin.qr_code_url,
      is_active: newAdmin.is_active,
      created_at: newAdmin.created_at,
    };
    return NextResponse.json(
      { success: true, branch_admin: adminResponse },
      { status: 201 },
    );
  } catch (error) {
    if (!transaction.finished) {
      await transaction.rollback();
    }
    // Cleanup uploaded files if any
    if (avatarPublicId)
      await deleteFromCloudinary(avatarPublicId).catch(console.error);
    if (qrCodePublicId)
      await deleteFromCloudinary(qrCodePublicId).catch(console.error);
    console.error("Create branch admin error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// GET list branch admins (optional)
async function listBranchAdmins(req) {
  const currentUser = req.user;
  if (currentUser.role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const branch_id = searchParams.get("branch_id");
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "50");
  const offset = (page - 1) * limit;
  const search = searchParams.get("search");

  const where = { role: "BRANCH_ADMIN" };
  if (branch_id) where.branch_id = branch_id;

  if (search) {
    const { Op } = require("sequelize");
    where[Op.or] = [
      { first_name: { [Op.iLike]: `%${search}%` } },
      { last_name: { [Op.iLike]: `%${search}%` } },
      { email: { [Op.iLike]: `%${search}%` } },
      { registration_no: { [Op.iLike]: `%${search}%` } },
    ];
  }

  const { count, rows } = await User.findAndCountAll({
    where,
    limit,
    offset,
    include: [
      {
        model: Branch,
        as: "branch",
        attributes: ["id", "name", "code", "address"],
      },
    ],
    attributes: {
      exclude: [
        "password_hash",
        "plain_password",
        "password_reset_token",
        "password_reset_expires",
      ],
    },
    order: [["created_at", "DESC"]],
  });

  return NextResponse.json({
    success: true,
    data: {
      admins: rows,
      pagination: {
        total: count,
        page,
        limit,
        totalPages: Math.ceil(count / limit),
      },
    },
    // For backward compatibility if any
    branch_admins: rows
  });
}

export const GET = withAuth(listBranchAdmins, ["SUPER_ADMIN"]);
export const POST = withAuth(createBranchAdmin, ["SUPER_ADMIN"]);
