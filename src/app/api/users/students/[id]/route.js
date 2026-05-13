import { NextResponse } from "next/server";
import { Op } from "sequelize";
import { User, Branch } from "@/backend/models/postgres";
import { getCurrentUser } from "@/lib/auth";
import { deleteFromCloudinary, uploadProfilePhoto, uploadStudentDocument } from "@/backend/utils/cloudinary";

// --- 1. GET: Single Student Details ---
export async function GET(req, { params }) {
  try {
    const user = await getCurrentUser(req);
    const student = await User.findByPk((await params).id, {
      include: [{ model: Branch, as: "branch", attributes: ["id", "name", "code"] }],
    });

    if (!student || student.role !== "STUDENT") {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }

    // Security Check
    if (user.role !== "SUPER_ADMIN" && student.branch_id !== user.branch_id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    return NextResponse.json(student);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// --- 2. PUT: Update Student & Recalculate Fees ---
export async function PUT(req, { params }) {
  try {
    const user = await getCurrentUser(req);
    // --- Content-Type Detection ---
    const contentType = req.headers.get("content-type") || "";
    let data = {};
    let formData = null;

    if (contentType.includes("multipart/form-data")) {
      try {
        formData = await req.formData();
        if (formData) {
          const dataStr = formData.get('data');
          if (dataStr) data = JSON.parse(dataStr);
        }
      } catch (e) {
        console.error("FormData parse error:", e);
      }
    }
    
    if (!formData) {
      try {
        data = await req.json();
      } catch (e) {
        data = {};
      }
    }

    const student = await User.findByPk((await params).id);
    if (!student)
      return NextResponse.json({ error: "Student not found" }, { status: 404 });

    // Support password update from Admin Modal
    if (data.password) {
      data.password_hash = data.password;
    }

    // Branch Admin Restriction
    if (user.role !== "SUPER_ADMIN" && student.branch_id !== user.branch_id) {
      return NextResponse.json(
        { error: "Unauthorized access" },
        { status: 403 },
      );
    }

    // --- 2.5 Duplicate Check (Email/Phone/RegNo) ---
    const { email, phone, registration_no } = data;
    if (email || phone || registration_no) {
      const existingUser = await User.findOne({
        where: {
          [Op.or]: [
            email ? { email } : null,
            registration_no ? { registration_no } : null
          ].filter(Boolean),
          id: { [Op.ne]: student.id }, // Exclude current student
          deleted_at: null // Active users only
        }
      });

      if (existingUser) {
        let duplicateField = "";
        if (email && existingUser.email === email) duplicateField = "Email";
        else duplicateField = "Registration number";

        return NextResponse.json(
          { error: `Another student with this ${duplicateField} already exists.` },
          { status: 400 }
        );
      }
    }

    // --- 3. Handle File Updates (Profile & Documents) ---
    const { pendingProfileFile, pendingDocuments, documentsToDelete } = data;
    
    // 3.1 Profile Photo Update
    if (pendingProfileFile) {
      try {
        const uploadRes = await uploadProfilePhoto(pendingProfileFile, student.id);
        data.avatar_url = uploadRes.url;
      } catch (err) {
        console.error("Update: Profile photo upload failed:", err);
      }
    }

    // 3.2 Documents Management
    let updatedDocuments = student.details?.documents || [];

    // 3.2.1 Delete marked documents
    if (documentsToDelete && Array.isArray(documentsToDelete)) {
      for (const doc of documentsToDelete) {
        try {
          if (doc.publicId) await deleteFromCloudinary(doc.publicId, "auto");
          updatedDocuments = updatedDocuments.filter(d => d.publicId !== doc.publicId);
        } catch (err) {
          console.error("Update: Document deletion failed:", err);
        }
      }
    }

    // 3.2.2 Upload new documents
    if (pendingDocuments && Array.isArray(pendingDocuments)) {
      for (const doc of pendingDocuments) {
        try {
          const uploadRes = await uploadStudentDocument(doc.file, student.id, doc.type || "other");
          updatedDocuments.push({
            id: crypto.randomUUID(),
            name: doc.name || "Untitled",
            type: doc.type || "other",
            url: uploadRes.url,
            publicId: uploadRes.publicId,
            uploaded_at: new Date().toISOString()
          });
        } catch (err) {
          console.error("Update: Document upload failed:", err);
        }
      }
    }

    // Update details with new document list
    data.details = {
      ...(data.details || student.details),
      documents: updatedDocuments
    };

    // --- 4. Recalculate Fees if needed ---
    if (data.subjects || data.discount !== undefined || data.academic_info || data.total_fee !== undefined) {
      const subjects = data.subjects || data.academic_info?.subjects || student.details?.academic_info?.subjects || [];
      const manualDiscount = data.discount !== undefined ? data.discount : (data.academic_info?.discount !== undefined ? data.academic_info.discount : (student.details?.academic_info?.discount || 0));
      
      const manualTotalFee = data.total_fee || data.academic_info?.total_fee || data.academic_info?.fee_estimate;
      const calculated_fee = subjects.reduce((acc, sub) => acc + (sub.fee || 0), 0);
      
      const total_fee = (manualTotalFee !== undefined && manualTotalFee !== null) ? Number(manualTotalFee) : calculated_fee;
      const final_discount = Number(manualDiscount || 0);
      const payable_fee = total_fee - final_discount;

      console.log(`[Student Update API] Fee Update: id=${student.id}, manualTotal=${manualTotalFee}, total=${total_fee}, discount=${final_discount}`);

      data.details.academic_info = {
        ...(student.details?.academic_info || {}),
        ...(data.academic_info || {}),
        subjects,
        total_fee,
        fee_estimate: total_fee,
        admission_fee: Number(data.admission_fee || data.academic_info?.admission_fee || student.details?.academic_info?.admission_fee || 0),
        discount: final_discount,
        fee_discount: { type: 'fixed', amount: final_discount, reason: '' },
        payable_fee,
        payment_date: data.payment_date || data.academic_info?.payment_date || student.details?.academic_info?.payment_date || '10',
        fee_mention: data.fee_mention || data.academic_info?.fee_mention || student.details?.academic_info?.fee_mention || 'Monthly',
      };
    }

    student.changed('details', true);
    await student.update(data);
    return NextResponse.json({
      success: true,
      message: "Student updated successfully",
      student,
    });
  } catch (error) {
    if (error.name === "SequelizeUniqueConstraintError") {
      const field = error.errors[0]?.path;
      const message =
        field === "email"
          ? "A student with this email already exists."
          : "Duplicate entry detected.";
      return NextResponse.json({ error: message }, { status: 400 });
    }
    console.error("Student update error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  try {
    const user = await getCurrentUser(req);
    const student = await User.findByPk((await params).id);

    if (!student)
      return NextResponse.json({ error: "Student not found" }, { status: 404 });

    // Branch Admin security
    if (user.role !== "SUPER_ADMIN" && student.branch_id !== user.branch_id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // 1. Cloudinary Cleanup
    // Delete QR
    if (student.details?.qrPublicId) {
      await deleteFromCloudinary(student.details.qrPublicId, "image");
    }

    // Delete other docs if any (e.g. B-form, certificate)
    if (student.details?.documents) {
      const docPromises = student.details.documents.map((doc) =>
        deleteFromCloudinary(doc.publicId, "raw"),
      );
      await Promise.all(docPromises);
    }

    // 2. Soft Delete from DB
    await student.destroy();

    return NextResponse.json({
      success: true,
      message: "Student and cloud data deleted successfully",
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
