import { NextResponse } from "next/server";
import { User } from "@/backend/models/postgres";
import { withAuth } from "@/backend/middleware/auth.middleware.js";
import {
  uploadProfilePhoto,
  uploadAdminDocument,
} from "@/backend/utils/cloudinary";

async function handleUpload(req) {
  try {
    const formData = await req.formData();
    const file = formData.get("file");
    const fileType = formData.get("fileType"); // 'profile' or 'admin_document'
    const userId = formData.get("userId");
    const documentType = formData.get("documentType") || "other";

    if (!file || !userId) {
      return NextResponse.json(
        { error: "Missing file or userId" },
        { status: 400 },
      );
    }

    const user = await User.findByPk(userId);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Convert file to base64 for Cloudinary
    const buffer = Buffer.from(await file.arrayBuffer());
    const base64 = `data:${file.type};base64,${buffer.toString("base64")}`;

    if (fileType === "profile") {
      const uploadRes = await uploadProfilePhoto(base64, userId);
      await user.update({
        avatar_url: uploadRes.url,
        avatar_public_id: uploadRes.publicId,
      });
      return NextResponse.json({ success: true, url: uploadRes.url });
    } else if (fileType === "admin_document") {
      const uploadRes = await uploadAdminDocument(base64, userId, documentType);

      // Use the model's helper method to add document
      await user.addDocument(documentType, uploadRes.url, file.name);

      return NextResponse.json({ success: true, url: uploadRes.url });
    } else {
      return NextResponse.json({ error: "Invalid fileType" }, { status: 400 });
    }
  } catch (error) {
    console.error("Upload API Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export const POST = withAuth(handleUpload, ["SUPER_ADMIN", "BRANCH_ADMIN"]);
