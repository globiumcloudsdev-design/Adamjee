import { NextResponse } from "next/server";
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
    const data = await req.json();

    const student = await User.findByPk((await params).id);
    if (!student)
      return NextResponse.json({ error: "Student not found" }, { status: 404 });

    // Branch Admin Restriction
    if (user.role !== "SUPER_ADMIN" && student.branch_id !== user.branch_id) {
      return NextResponse.json(
        { error: "Unauthorized access" },
        { status: 403 },
      );
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
    if (data.subjects || data.discount !== undefined || data.academic_info) {
      const subjects = data.subjects || data.academic_info?.subjects || student.details?.academic_info?.subjects || [];
      const discount = data.discount !== undefined ? data.discount : (data.academic_info?.discount || student.details?.academic_info?.discount || 0);

      const total_fee = subjects.reduce((acc, sub) => acc + (sub.fee || 0), 0);
      const payable_fee = total_fee - discount;

      data.details.academic_info = {
        ...(student.details?.academic_info || {}),
        ...(data.academic_info || {}),
        subjects,
        total_fee,
        discount,
        payable_fee,
      };
    }

    student.changed('details', true);
    await student.update(data);
    return NextResponse.json({
      message: "Student updated successfully",
      student,
    });
  } catch (error) {
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
      message: "Student and cloud data deleted successfully",
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
