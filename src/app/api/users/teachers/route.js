import { NextResponse } from "next/server";
import { withAuth } from "@/backend/middleware/auth.middleware.js";
import { sequelize, User, Branch, Timetable } from "@/backend/models/postgres";
import { Op } from "sequelize";
import { generateTeacherQR } from "@/lib/qr-generator";
import { getWelcomeEmailTemplate } from "@/backend/utils/email-templates";
import { sendEmail } from "@/backend/utils/emailService";
import { uploadQR, uploadTeacherDocument, uploadProfilePhoto, deleteFromCloudinary } from "@/backend/utils/cloudinary";

async function createTeacher(req) {
  const transaction = await sequelize.transaction();
  const uploadedPublicIds = [];

  try {
    const currentUser = req.user;
    const formData = await req.formData();
    
    // Extract JSON data
    const dataStr = formData.get('data');
    if (!dataStr) return NextResponse.json({ error: "Missing data" }, { status: 400 });
    const data = JSON.parse(dataStr);
    
    const {
      first_name, firstName,
      last_name, lastName,
      email,
      phone,
      password,
      branch_id, branchId,
      academicYearId,
      details,
      registration_no, registrationNo,
    } = data;

    const finalFirstName = first_name || firstName;
    const finalLastName = last_name || lastName;
    const finalBranchId = branch_id || branchId || (currentUser.role === "BRANCH_ADMIN" ? currentUser.branch_id : null);
    const finalPassword = password || "Welcome@123";
    
    // Validation
    if (!finalFirstName || !finalLastName || !phone || !finalPassword || !finalBranchId) {
      return NextResponse.json(
        { error: "Missing required fields: first_name, last_name, phone, password, and branch_id are required." },
        { status: 400 }
      );
    }

    // --- 1. Role & Branch Validation ---
    if (currentUser.role !== "SUPER_ADMIN" && finalBranchId !== currentUser.branch_id) {
       return NextResponse.json({ error: "Unauthorized branch access" }, { status: 403 });
    }

    // --- 2. ID Generation ---
    const finalRegNo = registration_no || registrationNo || `TCH-${Date.now().toString().slice(-6)}`;

    // --- 3. Create User in DB (initial) ---
    const teacher = await User.create({
      first_name: finalFirstName,
      last_name: finalLastName,
      email: email || null,
      phone,
      role: "TEACHER",
      registration_no: finalRegNo,
      branch_id: finalBranchId,
      password_hash: finalPassword, 
      details: {
        teacher: {
          academic_year_id: academicYearId || null,
          qualification: details?.qualification || data.teacherProfile?.qualifications?.[0]?.degree || "",
          subject: details?.subject || data.teacherProfile?.subjects?.[0] || "",
          designation: data.designation || details?.designation || data.teacherProfile?.designation || "Teacher",
          status: data.status || "active",
          joining_date: new Date().toISOString(),
          ...data.teacherProfile
        },
        gender: data.gender,
        date_of_birth: data.dateOfBirth,
        cnic: data.cnic,
        religion: data.religion,
        nationality: data.nationality,
        blood_group: data.bloodGroup,
        address: data.address,
      },
      created_by: currentUser.id,
    }, { transaction });

    // --- 4. Handle Profile Photo Upload ---
    let avatarUrl = null;
    let avatarPublicId = null;
    const profilePhoto = formData.get('profilePhoto');
    if (profilePhoto && profilePhoto instanceof File) {
      const buffer = Buffer.from(await profilePhoto.arrayBuffer());
      const base64 = `data:${profilePhoto.type};base64,${buffer.toString('base64')}`;
      const uploadRes = await uploadProfilePhoto(base64, teacher.id);
      avatarUrl = uploadRes.url;
      avatarPublicId = uploadRes.publicId;
      uploadedPublicIds.push(avatarPublicId);
    }

    // --- 5. Handle Documents Upload ---
    const uploadedDocuments = [];
    const docFiles = formData.getAll('documents');
    const docMetaStr = formData.get('documentMetadata');
    const docMeta = docMetaStr ? JSON.parse(docMetaStr) : [];

    for (let i = 0; i < docFiles.length; i++) {
      const file = docFiles[i];
      const meta = docMeta[i] || { type: 'other', name: file.name };
      
      const buffer = Buffer.from(await file.arrayBuffer());
      const base64 = `data:${file.type};base64,${buffer.toString('base64')}`;
      // Use teacher-specific upload folder
      const uploadRes = await uploadTeacherDocument(base64, teacher.id, meta.type);
      
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

    // --- 6. QR Code Generation ---
    let qrUrl = null;
    let qrPublicId = null;
    try {
      const qrCodeDataUrl = await generateTeacherQR(teacher);
      const qrResult = await uploadQR(qrCodeDataUrl, teacher.id, "teacher");
      qrUrl = qrResult.url;
      qrPublicId = qrResult.publicId;
      uploadedPublicIds.push(qrPublicId);
    } catch (qrError) {
      console.error("QR/Cloudinary Error:", qrError);
    }

    // --- 7. Final Update with all URLs ---
    await teacher.update({
      avatar_url: avatarUrl,
      qr_code_url: qrUrl,
      details: {
        ...teacher.details,
        avatar_public_id: avatarPublicId,
        qr_public_id: qrPublicId,
        documents: uploadedDocuments,
      },
    }, { transaction });

    await transaction.commit();

    // --- 8. Branch Name & Email ---
    if (email) {
      try {
        const branch = await Branch.findByPk(finalBranchId);
        const emailHtml = getWelcomeEmailTemplate({
          name: `${finalFirstName} ${finalLastName}`,
          role: "TEACHER",
          id: finalRegNo,
          email: email,
          password: finalPassword,
          branchName: branch?.name || "Adamjee Coaching",
        });

        await sendEmail(email, "Welcome to Adamjee Coaching - Teacher Portal Access", emailHtml);
      } catch (mailError) {
        console.error("Mail Error:", mailError);
      }
    }

    return NextResponse.json(
      {
        success: true,
        message: "Teacher added successfully",
        teacher: {
          id: teacher.id,
          registration_no: finalRegNo,
          qr_url: qrUrl,
        },
      },
      { status: 201 },
    );
  } catch (error) {
    if (transaction) await transaction.rollback();
    console.error("Teacher Creation Error:", error);

    // CLEANUP: Delete uploaded files from Cloudinary if DB failed
    for (const publicId of uploadedPublicIds) {
      try {
        await deleteFromCloudinary(publicId);
      } catch (delErr) {
        console.error("Cleanup Error:", delErr);
      }
    }
    
    // Handle Sequelize validation errors specifically
    if (error.name === 'SequelizeValidationError' || error.name === 'SequelizeUniqueConstraintError') {
      return NextResponse.json({ 
        error: "Validation error", 
        details: error.errors.map(e => ({ field: e.path, message: e.message }))
      }, { status: 400 });
    }

    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}


async function getTeachers(req) {
  try {
    const currentUser = req.user;
    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search');
    const branchId = searchParams.get('branchId');
    const status = searchParams.get('status');
    const designation = searchParams.get('designation');
    const departmentId = searchParams.get('departmentId');
    let whereClause = { role: "TEACHER" };

    // Role-based scope: Branch Admin ko sirf apni branch ke teachers dikhain, Super Admin ko saray
    if (currentUser.role === "BRANCH_ADMIN") {
      if (!currentUser.branch_id) {
        return NextResponse.json({ error: "No branch assigned to this admin" }, { status: 400 });
      }
      whereClause.branch_id = currentUser.branch_id;
    } else if (currentUser.role === "SUPER_ADMIN" && branchId) {
      // Super Admin specified a branch filter
      whereClause.branch_id = branchId;
    }

    // Search filter
    if (search) {
      whereClause[Op.or] = [
        { first_name: { [Op.iLike]: `%${search}%` } },
        { last_name: { [Op.iLike]: `%${search}%` } },
        { email: { [Op.iLike]: `%${search}%` } },
        { phone: { [Op.iLike]: `%${search}%` } },
        { registration_no: { [Op.iLike]: `%${search}%` } }
      ];
    }

    // Status filter
    if (status) {
      if (status === 'active' || status === 'inactive') {
        whereClause.is_active = (status === 'active');
      } else {
        // For other statuses like 'on_leave' or 'terminated', check details.teacher.status
        whereClause['details.teacher.status'] = status;
      }
    }

    // Designation filter (stored in JSONB details)
    if (designation) {
      // Postgres JSONB path query
      whereClause['details.teacher.designation'] = designation;
    }

    // Department filter
    if (departmentId) {
      whereClause.department_id = departmentId;
    }

    const teachers = await User.findAll({
      where: whereClause,
      include: [
        {
          model: Branch,
          as: "branch",
          attributes: ["id", "name", "code"],
        },
      ],
      order: [["created_at", "DESC"]],
    });

    // --- NEW: Fetch dynamic assignments from Timetable ---
    const branchIds = [...new Set(teachers.map(t => t.branch_id))].filter(Boolean);
    const timetables = await Timetable.findAll({
      where: { branch_id: { [Op.in]: branchIds } },
      attributes: ['id', 'class_id', 'section_id', 'periods']
    });

    // Map teacherId -> set of unique (class, section) assignments
    const teacherAssignments = {};
    timetables.forEach(tt => {
      (tt.periods || []).forEach(p => {
        const tId = p.teacherId;
        if (!tId) return;
        
        if (!teacherAssignments[tId]) teacherAssignments[tId] = new Set();
        // Store as a unique string key to avoid duplicates
        teacherAssignments[tId].add(`${tt.class_id}:${tt.section_id}`);
      });
    });

    // Augment teacher data with dynamic counts
    const data = teachers.map(t => {
      const teacherObj = t.toJSON();
      const assignmentSet = teacherAssignments[t.id];
      const assignedCount = assignmentSet ? assignmentSet.size : 0;

      if (!teacherObj.details) teacherObj.details = {};
      if (!teacherObj.details.teacher) teacherObj.details.teacher = {};
      
      // If the static classes array is empty or missing, use the dynamic count
      // This ensures the frontend table shows the classes assigned via Timetable
      if (!teacherObj.details.teacher.classes || teacherObj.details.teacher.classes.length === 0) {
        // Create a dummy array of the right length so .length works in frontend
        teacherObj.details.teacher.classes = new Array(assignedCount).fill({});
      }
      
      return teacherObj;
    });

    return NextResponse.json({
      success: true,
      data: data,
    });
  } catch (error) {
    console.error("Get Teachers Error:", error);
    return NextResponse.json(
      { error: error.message || "Internal Server Error" },
      { status: 500 },
    );
  }
}

export const GET = withAuth(getTeachers, ["SUPER_ADMIN", "BRANCH_ADMIN"]);
export const POST = withAuth(createTeacher, ["SUPER_ADMIN", "BRANCH_ADMIN"]);
