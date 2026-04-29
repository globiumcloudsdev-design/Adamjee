import { NextResponse } from "next/server";
import { withAuth } from "@/backend/middleware/auth.middleware.js";
import { User, Branch, Timetable } from "@/backend/models/postgres";
import { Op } from "sequelize";
import { generateTeacherQR } from "@/lib/qr-generator";
import { getWelcomeEmailTemplate } from "@/backend/utils/email-templates";
import { sendEmail } from "@/backend/utils/emailService";
import { uploadQR } from "@/backend/utils/cloudinary";

async function createTeacher(req) {
  try {
    const currentUser = req.user;
    const data = await req.json();
    
    // Support both camelCase (frontend) and snake_case (backend/models)
    const {
      first_name, firstName,
      last_name, lastName,
      email,
      phone,
      password,
      branch_id, branchId,
      details,
      registration_no, registrationNo,
    } = data;

    const finalFirstName = first_name || firstName;
    const finalLastName = last_name || lastName;
    const finalBranchId = branch_id || branchId || (currentUser.role === "BRANCH_ADMIN" ? currentUser.branch_id : null);
    
    // Validation
    if (!finalFirstName || !finalLastName || !phone || !password) {
      return NextResponse.json(
        { error: "Missing required fields: first_name, last_name, phone, and password are required." },
        { status: 400 }
      );
    }

    // --- 1. Role & Branch Validation ---
    if (currentUser.role !== "SUPER_ADMIN" && finalBranchId !== currentUser.branch_id) {
       return NextResponse.json({ error: "Unauthorized branch access" }, { status: 403 });
    }

    // --- 2. ID Generation ---
    const finalRegNo = registration_no || registrationNo || `TCH-${Date.now().toString().slice(-6)}`;

    // --- 3. Create User in DB ---
    const teacher = await User.create({
      first_name: finalFirstName,
      last_name: finalLastName,
      email: email || null,
      phone,
      role: "TEACHER",
      registration_no: finalRegNo,
      branch_id: finalBranchId,
      password_hash: password, 
      details: {
        teacher: {
          qualification: details?.qualification || details?.teacher?.qualification || "",
          subject: details?.subject || details?.teacher?.subject || "",
          designation: data.designation || details?.designation || details?.teacher?.designation || "Teacher",
          status: data.status || "active",
          joining_date: new Date().toISOString(),
        },
      },
      created_by: currentUser.id,
    });

    // --- 4. QR Code & Cloudinary Logic ---
    let qrUrl = null;
    try {
      const qrCodeDataUrl = await generateTeacherQR(teacher);
      const qrResult = await uploadQR(qrCodeDataUrl, teacher.id, "teacher");
      
      await teacher.update({
        qr_code_url: qrResult.url,
        details: {
          ...(teacher.details || {}),
          qr_public_id: qrResult.publicId,
        },
      });
      qrUrl = qrResult.url;
    } catch (qrError) {
      console.error("QR/Cloudinary Error:", qrError);
      // Don't fail the whole request if QR fails
    }

    // --- 5. Branch Name & Email ---
    if (email) {
      try {
        const branch = await Branch.findByPk(finalBranchId);
        const emailHtml = getWelcomeEmailTemplate({
          name: `${finalFirstName} ${finalLastName}`,
          role: "TEACHER",
          id: finalRegNo,
          email: email,
          password: password,
          branchName: branch?.name || "Adamjee Coaching",
        });

        await sendEmail(email, "Welcome to Adamjee Coaching - Teacher Portal Access", emailHtml);
      } catch (mailError) {
        console.error("Mail Error:", mailError);
      }
    }

    return NextResponse.json(
      {
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
    console.error("Teacher Creation Error:", error);
    
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
