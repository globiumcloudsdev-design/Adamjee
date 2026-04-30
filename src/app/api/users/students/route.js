import { NextResponse } from "next/server";
import { Op } from "sequelize";
import { sequelize, User, Branch, Class, Section, AcademicYear, Subject } from "@/backend/models/postgres";
import { generateStudentQR } from "@/lib/qr-generator";
import { uploadQR, uploadProfilePhoto, uploadStudentDocument } from "@/backend/utils/cloudinary";
import { sendEmail } from "@/backend/utils/emailService";
import { getStudentEmailTemplate } from "@/backend/templates/studentEmail";
import { getCurrentUser } from "@/lib/auth";

export async function POST(req) {
  try {
    const user = await getCurrentUser(req);
    const data = await req.json();

    const {
      first_name,
      last_name,
      email,
      phone,
      password,
      branch_id,
      academic_year_id,
      class_id,
      section_id,
      subjects = [],
      discount,
      registration_no,
      roll_no,
    } = data;

    // 1. Authorization
    const targetBranchId =
      user.role === "SUPER_ADMIN" ? branch_id : user.branch_id;

    // 2. Roll Number Auto-Generation Logic
    let finalRollNo = roll_no;
    if (!finalRollNo) {
      // Find the last student in this class/section/year
      const lastStudent = await User.findOne({
        where: {
          role: "STUDENT",
          branch_id: targetBranchId,
          "details": {
            [Op.contains]: {
              academic_info: {
                class_id,
                section_id,
                academic_year_id,
              }
            }
          }
        },
        order: [
          [
            sequelize.literal(
              "CAST(details->'academic_info'->>'roll_no' AS INTEGER)",
            ),
            "DESC",
          ],
        ],
      });

      const lastRollNo = lastStudent
        ? parseInt(lastStudent.details.academic_info.roll_no)
        : 0;
      finalRollNo = (lastRollNo + 1).toString();
    }

    // 3. Registration No Auto-Generation Logic
    let finalRegNo = registration_no;
    if (!finalRegNo) {
      const branch = await Branch.findByPk(targetBranchId);
      const branchCode = branch.name.slice(0, 3).toUpperCase();
      const year = new Date().getFullYear();
      const count = await User.count({
        where: { role: "STUDENT", branch_id: targetBranchId },
      });
      finalRegNo = `${branchCode}-${year}-${(count + 1).toString().padStart(4, "0")}`;
    }

    // 3. Fee Calculation logic
    // $TotalFee = \sum SubjectFees - Discount$
    const total_subject_fee = subjects.reduce(
      (acc, sub) => acc + (sub.fee || 0),
      0,
    );
    const payable_fee = total_subject_fee - (discount || 0);

    // Lookup subject names from DB using subject ids
    let enrichedSubjects = subjects;
    if (subjects && subjects.length > 0) {
      const subjectIds = subjects.map((s) => s.id).filter(Boolean);
      const subjectRecords = await Subject.findAll({
        where: { id: subjectIds },
        attributes: ["id", "name"],
      });
      const subjectMap = {};
      subjectRecords.forEach((s) => { subjectMap[s.id] = s.name; });
      enrichedSubjects = subjects.map((s) => ({
        ...s,
        name: subjectMap[s.id] || "Unknown Subject",
      }));
    }

    // 4. Create User (Student)
    const student = await User.create({
      first_name,
      last_name,
      email: email || null,
      phone,
      role: "STUDENT",
      registration_no: finalRegNo,
      branch_id: targetBranchId,
      password_hash: password, // Model will hash it
      details: {
        academic_info: {
          ...data.academic_info, // baki details (e.g. parent_name etc agar frontend se arahe)
          academic_year_id,
          class_id,
          section_id,
          roll_no: finalRollNo,
          subjects: enrichedSubjects,
          total_fee: total_subject_fee,
          discount: discount || 0,
          payable_fee,
        },
      },
      created_by: user.id,
    });

    // 5. File Uploads (Profile Photo & Documents)
    const { pendingProfileFile, pendingDocuments } = data;
    let avatarUrl = null;
    const uploadedDocuments = [];

    // 5.1 Profile Photo
    if (pendingProfileFile) {
      try {
        const uploadRes = await uploadProfilePhoto(pendingProfileFile, student.id);
        avatarUrl = uploadRes.url;
        await student.update({ avatar_url: avatarUrl });
      } catch (uploadErr) {
        console.error("Profile photo upload failed:", uploadErr);
      }
    }

    // 5.2 Documents
    if (pendingDocuments && Array.isArray(pendingDocuments)) {
      for (const doc of pendingDocuments) {
        try {
          const uploadRes = await uploadStudentDocument(doc.file, student.id, doc.type || "other");
          uploadedDocuments.push({
            id: crypto.randomUUID(),
            name: doc.name || "Untitled",
            type: doc.type || "other",
            url: uploadRes.url,
            publicId: uploadRes.publicId,
            uploaded_at: new Date().toISOString()
          });
        } catch (docErr) {
          console.error(`Document upload failed for ${doc.name}:`, docErr);
        }
      }
    }

    // 6. QR Code Generation & Final Update
    const qrDataUrl = await generateStudentQR(student);
    const qrResult = await uploadQR(qrDataUrl, student.id, "student");

    await student.update({
      qr_code_url: qrResult.url,
      details: {
        ...student.details,
        qrPublicId: qrResult.publicId,
        documents: uploadedDocuments
      },
    });

    // 6. Send Welcome Email
    if (email) {
      try {
        // Fetch names for email
        const [targetClass, targetSection, targetYear] = await Promise.all([
          class_id ? Class.findByPk(class_id) : null,
          section_id ? Section.findByPk(section_id) : null,
          academic_year_id ? AcademicYear.findByPk(academic_year_id) : null,
        ]);

        const studentDataForEmail = {
          firstName: first_name,
          lastName: last_name,
          email: email,
          phone: phone,
          password: password, // Plain password for the email
          studentProfile: {
            registrationNumber: finalRegNo,
            rollNumber: finalRollNo,
            className: targetClass?.name || "N/A",
            sectionName: targetSection?.name || "N/A",
            academicYearName: targetYear?.name || "N/A",
          }
        };
        const emailHtml = getStudentEmailTemplate("STUDENT_CREATED", studentDataForEmail);
        
        await sendEmail(
          email,
          "Welcome to Adamjee Coaching - Student Portal",
          emailHtml
        );
      } catch (emailError) {
        console.warn("Student created but failed to send welcome email:", emailError.message);
      }
    }

    return NextResponse.json(
      {
        message: "Student enrolled successfully",
        roll_no: finalRollNo,
        registration_no: finalRegNo,
        student,
      },
      { status: 201 },
    );
  } catch (error) {
    if (error.name === "SequelizeUniqueConstraintError") {
      const field = error.errors[0]?.path;
      const message =
        field === "email"
          ? "A student with this email already exists."
          : field === "phone"
            ? "A student with this phone number already exists."
            : "Duplicate entry detected.";
      return NextResponse.json({ error: message }, { status: 400 });
    }
    console.error("Student creation error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to enroll student" },
      { status: 500 },
    );
  }
}

export async function GET(req) {
  try {
    const user = await getCurrentUser(req);
    const { searchParams } = new URL(req.url);

    // Filters from Query Params
    const academicYearId = searchParams.get("academic_year_id");
    const classId = searchParams.get("class_id");
    const branchId = searchParams.get("branch_id") || searchParams.get("branchId");
    const q = searchParams.get("q");

    // --- Role-Based Filter ---
    let whereClause = { role: "STUDENT" };

    if (user.role === "BRANCH_ADMIN") {
      whereClause.branch_id = user.branch_id; 
    } else if (user.role === "SUPER_ADMIN" && branchId) {
      whereClause.branch_id = branchId; 
    }

    if (q) {
      whereClause[Op.or] = [
        { first_name: { [Op.iLike]: `%${q}%` } },
        { last_name: { [Op.iLike]: `%${q}%` } },
        { email: { [Op.iLike]: `%${q}%` } },
        { phone: { [Op.iLike]: `%${q}%` } },
        { registration_no: { [Op.iLike]: `%${q}%` } },
        sequelize.where(
          sequelize.fn('concat', sequelize.col('first_name'), ' ', sequelize.col('last_name')),
          { [Op.iLike]: `%${q}%` }
        )
      ];
    }


    // --- Academic Info Filtering (JSONB search) ---
    const academicInfoFilter = {};
    let hasAcademicFilter = false;
    if (academicYearId) {
      academicInfoFilter.academic_year_id = academicYearId;
      hasAcademicFilter = true;
    }
    if (classId) {
      academicInfoFilter.class_id = classId;
      hasAcademicFilter = true;
    }

    if (hasAcademicFilter) {
      whereClause.details = {
        [Op.contains]: {
          academic_info: academicInfoFilter
        }
      };
    }

    const students = await User.findAll({
      where: whereClause,
      include: [
        {
          model: Branch,
          as: "branch",
          attributes: ["id", "name", "code"],
        },
      ],
      attributes: { exclude: ["password_hash"] },
      order: [["created_at", "DESC"]],
    });

    return NextResponse.json(students);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
