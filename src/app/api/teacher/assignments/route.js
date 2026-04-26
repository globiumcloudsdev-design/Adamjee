import { NextResponse } from "next/server";
import { withAuth } from "@/backend/middleware/auth";
import Assignment from "@/backend/models/Assignment";
import Submission from "@/backend/models/Submission";
import { successResponse, errorResponse } from "@/backend/middleware/response";
import { User } from "@/backend/models/postgres";
import { Class } from "@/backend/models/postgres";
import Subject from "@/backend/models/Subject";
import { Branch } from "@/backend/models/postgres";
import { uploadToCloudinary } from "@/backend/utils/cloudinary";

// GET: List assignments for the teacher
export const GET = withAuth(async (req, user, userDoc) => {
  try {
    
    const { searchParams } = new URL(req.url);
    const classId = searchParams.get("classId");
    const status = searchParams.get("status");

    const query = {
      teacherId: userDoc._id,
      branchId: userDoc.branchId,
    };

    if (classId) query.classId = classId;
    if (status) query.status = status;

    const assignments = await Assignment.find(query)
      .populate("classId", "name code")
      .populate("subjectId", "name code")
      .sort({ createdAt: -1 })
      .lean();

    // For each assignment, get submission stats
    const assignmentsWithStats = await Promise.all(
      assignments.map(async (assignment) => {
        const totalSubmissions = await Submission.countDocuments({
          assignmentId: assignment._id,
        });
        return {
          ...assignment,
          submissionCount: totalSubmissions,
        };
      }),
    );

    return successResponse(
      assignmentsWithStats,
      "Assignments fetched successfully",
    );
  } catch (error) {
    console.error("Error fetching assignments:", error);
    return errorResponse(error.message, 500);
  }
});

// POST: Create a new assignment
export const POST = withAuth(async (req, user, userDoc) => {
  try {
    
    const formData = await req.formData();

    // Extract basic fields
    const title = formData.get("title");
    const description = formData.get("description");
    const classId = formData.get("classId");
    const subjectId = formData.get("subjectId");
    const sectionId = formData.get("sectionId");
    const dueDate = formData.get("dueDate");
    const totalMarks = formData.get("totalMarks");
    const allowLateSubmission = formData.get("allowLateSubmission") === "true";
    const status = formData.get("status") || "published";
    const videoUrl = formData.get("videoUrl");

    // Handle files
    const files = formData.getAll("files");
    const attachments = [];

    if (files && files.length > 0) {
      for (const file of files) {
        if (file instanceof File && file.size > 0) {
          const buffer = Buffer.from(await file.arrayBuffer());
          const base64File = `data:${file.type};base64,${buffer.toString("base64")}`;

          const uploadResult = await uploadToCloudinary(base64File, {
            folder: `assignments/${classId}`,
            resourceType: "auto",
          });

          attachments.push({
            name: file.name,
            url: uploadResult.url,
            publicId: uploadResult.publicId,
            fileType: file.type,
          });
        }
      }
    }

    const newAssignment = await Assignment.create({
      title,
      description,
      classId,
      subjectId,
      sectionId,
      dueDate,
      totalMarks,
      allowLateSubmission,
      status,
      videoUrl,
      attachments,
      teacherId: userDoc._id,
      branchId: userDoc.branchId,
    });

    return successResponse(
      newAssignment,
      "Assignment created successfully",
      201,
    );
  } catch (error) {
    console.error("Error creating assignment:", error);
    return errorResponse(error.message, 400);
  }
});
