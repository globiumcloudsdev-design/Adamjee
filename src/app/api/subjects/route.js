import { NextResponse } from "next/server";
import { Subject, Class } from "@/backend/models/postgres";
import { getCurrentUser } from "@/lib/auth";
import { uploadToCloudinary } from "@/backend/utils/cloudinary";

// 1. GET ALL SUBJECTS (Filtered by Branch)
export async function GET(req) {
  try {
    const user = await getCurrentUser(req);
    if (!user)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const classId = searchParams.get("class_id");

    // Logic: Super Admin sab dekhay, Branch Admin sirf apni branch
    let whereClause =
      user.role === "SUPER_ADMIN" ? {} : { branch_id: user.branch_id };

    // Agar specific class ke subjects chahiye (?class_id=...)
    if (classId) whereClause.class_id = classId;

    const subjects = await Subject.findAll({
      where: whereClause,
      include: [{ model: Class, as: "class", attributes: ["name"] }],
      order: [["created_at", "DESC"]],
    });

    return NextResponse.json(subjects);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// 2. POST: CREATE SUBJECT & UPLOAD MATERIALS
export async function POST(req) {
  try {
    const user = await getCurrentUser(req);
    if (!user)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const formData = await req.formData();
    const name = formData.get("name");
    const subject_code = formData.get("subject_code");
    const class_id = formData.get("class_id");
    const branch_id = formData.get("branch_id");
    const files = formData.getAll("files");

    console.log("[Subjects POST] Incoming Data:", { name, subject_code, class_id, branch_id, filesCount: files.length });

    if (!name || !class_id) {
      return NextResponse.json(
        { error: "Subject Name and Class are required" },
        { status: 400 },
      );
    }

    const targetBranchId =
      user.role === "SUPER_ADMIN" ? branch_id : user.branch_id;
    
    if (!targetBranchId) {
       return NextResponse.json({ error: "Branch ID is required" }, { status: 400 });
    }

    // --- Cloudinary Upload Loop ---
    let uploadedMaterials = [];
    if (files && files.length > 0) {
      for (const file of files) {
        if (!file || file.size === 0) continue;

        // Convert file to data URL for Cloudinary
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        const base64 = buffer.toString("base64");
        const dataUrl = `data:${file.type};base64,${base64}`;

        const uploadResult = await uploadToCloudinary(dataUrl, {
          folder: `adamjee-campus12/subjects/${name}`,
          resourceType: "auto",
        });

        uploadedMaterials.push({
          title: file.name,
          url: uploadResult.url,
          public_id: uploadResult.publicId,
          type: uploadResult.format,
        });
      }
    }

    const newSubject = await Subject.create({
      name,
      subject_code,
      class_id,
      branch_id: targetBranchId,
      materials: uploadedMaterials,
      created_by: user.id,
    });

    return NextResponse.json(newSubject, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
