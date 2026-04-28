import { NextResponse } from "next/server";
import { sequelize, User, Branch } from "@/backend/models/postgres";
import { Op } from "sequelize";
import { withAuth } from "@/backend/middleware/auth.middleware.js";
import { generateStaffQR } from "@/lib/qr-generator";
import { uploadQR, uploadStaffDocument, uploadProfilePhoto, deleteFromCloudinary } from "@/backend/utils/cloudinary";
import { getWelcomeEmailTemplate } from "@/backend/utils/email-templates";
import { sendEmail } from "@/backend/utils/emailService";

/**
 * POST /api/users/staff
 * Integrated Creation: Uploads documents + Creates User in one atomic-like operation
 */
async function createStaff(req) {
  const transaction = await sequelize.transaction();
  const uploadedPublicIds = []; // Track for cleanup on failure
  
  try {
    const currentUser = req.user;
    const formData = await req.formData();
    
    // Extract JSON data
    const dataStr = formData.get('data');
    if (!dataStr) return NextResponse.json({ error: "Missing data" }, { status: 400 });
    const data = JSON.parse(dataStr);

    const {
      firstName, first_name,
      lastName, last_name,
      email,
      phone,
      password,
      branchId, branch_id,
      registrationNo, registration_no,
      staffType, staff_sub_type,
      permissions,
    } = data;

    // Normalization
    const finalFirstName = firstName || first_name;
    const finalLastName = lastName || last_name;
    const finalBranchId = branchId || branch_id || (currentUser.role === "BRANCH_ADMIN" ? currentUser.branch_id : null);
    const finalStaffType = staffType || staff_sub_type;
    const finalPassword = password || `Staff@${Date.now().toString().slice(-4)}`;
    const finalRegNo = registrationNo || registration_no || `STF-${Date.now().toString().slice(-6)}`;

    // 1. Initial User Creation (without avatar/docs)
    const newStaff = await User.create({
      role: "STAFF",
      staff_sub_type: finalStaffType || null,
      first_name: finalFirstName,
      last_name: finalLastName,
      email: email || null,
      phone: phone || "0000000000",
      registration_no: finalRegNo,
      branch_id: finalBranchId,
      password_hash: finalPassword,
      permissions: permissions || [],
      created_by: currentUser.id,
      details: { ...data }, // Initial details
    }, { transaction });

    // 2. Handle Profile Photo Upload
    let avatarUrl = null;
    const profilePhoto = formData.get('profilePhoto');
    if (profilePhoto && profilePhoto instanceof File) {
      const buffer = Buffer.from(await profilePhoto.arrayBuffer());
      const base64 = `data:${profilePhoto.type};base64,${buffer.toString('base64')}`;
      const uploadRes = await uploadProfilePhoto(base64, newStaff.id);
      avatarUrl = uploadRes.url;
      uploadedPublicIds.push(uploadRes.publicId);
    }

    // 3. Handle Documents Upload
    const uploadedDocuments = [];
    const docFiles = formData.getAll('documents');
    const docMetaStr = formData.get('documentMetadata');
    const docMeta = docMetaStr ? JSON.parse(docMetaStr) : [];

    for (let i = 0; i < docFiles.length; i++) {
      const file = docFiles[i];
      const meta = docMeta[i] || { type: 'other', name: file.name };
      
      const buffer = Buffer.from(await file.arrayBuffer());
      const base64 = `data:${file.type};base64,${buffer.toString('base64')}`;
      const uploadRes = await uploadStaffDocument(base64, newStaff.id, meta.type);
      
      uploadedDocuments.push({
        id: crypto.randomUUID(),
        type: meta.type,
        name: meta.name || file.name,
        url: uploadRes.url,
        publicId: uploadRes.publicId,
        uploaded_at: new Date().toISOString()
      });
      uploadedPublicIds.push(uploadRes.publicId);
    }

    // 4. QR Code Generation
    let qrUrl = null;
    let qrPublicId = null;
    try {
      const qrDataUrl = await generateStaffQR(newStaff);
      const qrRes = await uploadQR(qrDataUrl, newStaff.id, "staff");
      qrUrl = qrRes.url;
      qrPublicId = qrRes.publicId;
      uploadedPublicIds.push(qrPublicId);
    } catch (qrErr) {
      console.error("QR Error:", qrErr);
    }

    // 5. Final Update with all URLs
    await newStaff.update({
      avatar_url: avatarUrl,
      qr_code_url: qrUrl,
      documents: uploadedDocuments,
      details: {
        ...newStaff.details,
        documents: uploadedDocuments,
        qr_public_id: qrPublicId,
      }
    }, { transaction });

    await transaction.commit();

    // 6. Send Email (Post-commit)
    if (email) {
      try {
        const branch = await Branch.findByPk(finalBranchId);
        const emailHtml = getWelcomeEmailTemplate({
          name: `${finalFirstName} ${finalLastName}`,
          role: "STAFF",
          id: finalRegNo,
          email: email,
          password: finalPassword,
          branchName: branch?.name || "Adamjee Coaching",
        });
        await sendEmail(email, "Welcome to Adamjee Coaching - Staff Portal", emailHtml);
      } catch (mailErr) {
        console.error("Mail Error:", mailErr);
      }
    }

    return NextResponse.json({
      success: true,
      message: "Staff created successfully",
      data: { id: newStaff.id, registration_no: finalRegNo, qr_url: qrUrl }
    }, { status: 201 });

  } catch (error) {
    if (transaction) await transaction.rollback();
    console.error("Creation Failure:", error);

    // CLEANUP: Delete uploaded files from Cloudinary if DB failed
    for (const publicId of uploadedPublicIds) {
      try {
        await deleteFromCloudinary(publicId);
      } catch (delErr) {
        console.error("Cleanup Error:", delErr);
      }
    }

    return NextResponse.json({ 
      error: error.message || "Internal Server Error",
      details: error.errors?.map(e => ({ field: e.path, message: e.message }))
    }, { status: 500 });
  }
}

/**
 * GET /api/users/staff
 */
async function getStaff(req) {
  try {
    const currentUser = req.user;
    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search');
    const branchId = searchParams.get('branchId');
    
    const allStaff = searchParams.get('allStaff') === 'true';
    
    let whereClause = {};
    if (allStaff) {
      whereClause.role = { [Op.in]: ["STAFF", "TEACHER"] };
    } else {
      whereClause.role = "STAFF";
    }


    if (currentUser.role === "BRANCH_ADMIN") {
      whereClause.branch_id = currentUser.branch_id;
    } else if (currentUser.role === "SUPER_ADMIN" && branchId) {
      whereClause.branch_id = branchId;
    }

    if (search) {
      whereClause[Op.or] = [
        { first_name: { [Op.iLike]: `%${search}%` } },
        { last_name: { [Op.iLike]: `%${search}%` } },
        { email: { [Op.iLike]: `%${search}%` } },
        { registration_no: { [Op.iLike]: `%${search}%` } }
      ];
    }

    const staff = await User.findAll({
      where: whereClause,
      include: [{ model: Branch, as: "branch", attributes: ["id", "name", "code"] }],
      attributes: { exclude: ["password_hash"] },
      order: [["created_at", "DESC"]],
    });

    return NextResponse.json({ success: true, data: staff });
  } catch (error) {
    console.error("Get Staff Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export const POST = withAuth(createStaff, ["SUPER_ADMIN", "BRANCH_ADMIN"]);
export const GET = withAuth(getStaff, ["SUPER_ADMIN", "BRANCH_ADMIN"]);
