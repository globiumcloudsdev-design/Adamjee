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

// GET: Get single assignment details with submissions
export const GET = withAuth(async (req, user, userDoc, { params }) => {
  try {
        const { id } = await params;

    const assignment = await Assignment.findOne({
      _id: id,
      teacherId: userDoc._id,
    })
      .populate("classId", "name code")
      .populate("subjectId", "name code")
      .lean();

    if (!assignment) {
      return errorResponse("Assignment not found", 404);
    }

    // Fetch submissions for this assignment
    const submissions = await Submission.find({ assignmentId: id })
      .populate(
        "studentId",
        "firstName lastName fullName email profilePhoto studentProfile.rollNumber",
      )
      .sort({ submittedAt: -1 })
      .lean();

    // Compute total students in this class and section (only students)
    const studentFilter = {
      role: "student",
      branchId: assignment.branchId,
      "studentProfile.classId": assignment.classId,
    };

    // assignment.sectionId stores section name or id; studentProfile.section is a string
    if (assignment.sectionId) {
      studentFilter["studentProfile.section"] = assignment.sectionId;
    }

    const students = await User.find(studentFilter)
      .select("fullName studentProfile.rollNumber profilePhoto")
      .lean();

    const totalStudents = students.length;
    const submissionCount = submissions.length;

    // Build per-student submission mapping for UI (shows who submitted and details)
    const submissionsByStudent = new Map();
    for (const s of submissions) {
      const sid = s.studentId?._id
        ? String(s.studentId._id)
        : String(s.studentId);
      submissionsByStudent.set(sid, s);
    }

    const studentStats = students.map((stu) => ({
      _id: stu._id,
      fullName: stu.fullName,
      rollNumber: stu.studentProfile?.rollNumber || null,
      profilePhoto: stu.profilePhoto?.url || null,
      submitted: submissionsByStudent.has(String(stu._id)),
      submission: submissionsByStudent.get(String(stu._id)) || null,
    }));

    return successResponse(
      {
        ...assignment,
        submissions,
        totalStudents,
        submissionCount,
        studentStats,
      },
      "Assignment details fetched successfully",
    );
  } catch (error) {
    console.error("Error fetching assignment details:", error);
    return errorResponse(error.message, 500);
  }
});

// PUT: Update assignment
export const PUT = withAuth(async (req, user, userDoc, { params }) => {
  try {
        const { id } = await params;

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
    const status = formData.get("status");
    const videoUrl = formData.get("videoUrl");

    // Handle existing attachments
    let attachments = [];
    const existingAttachmentsStr = formData.get("attachments");
    if (existingAttachmentsStr) {
      attachments = JSON.parse(existingAttachmentsStr);
    }

    // Handle new files
    const files = formData.getAll("files");
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

    const updateData = {
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
    };

    const updatedAssignment = await Assignment.findOneAndUpdate(
      { _id: id, teacherId: userDoc._id },
      { $set: updateData },
      { new: true, runValidators: true },
    );

    if (!updatedAssignment) {
      return errorResponse("Assignment not found or unauthorized", 404);
    }

    return successResponse(
      updatedAssignment,
      "Assignment updated successfully",
    );
  } catch (error) {
    console.error("Error updating assignment:", error);
    return errorResponse(error.message, 400);
  }
});

// DELETE: Delete assignment
export const DELETE = withAuth(async (req, user, userDoc, { params }) => {
  try {
        const { id } = await params;

    const deletedAssignment = await Assignment.findOneAndDelete({
      _id: id,
      teacherId: userDoc._id,
    });

    if (!deletedAssignment) {
      return errorResponse("Assignment not found or unauthorized", 404);
    }

    // Also delete all submissions for this assignment
    await Submission.deleteMany({ assignmentId: id });

    return successResponse(
      null,
      "Assignment and its submissions deleted successfully",
    );
  } catch (error) {
    console.error("Error deleting assignment:", error);
    return errorResponse(error.message, 500);
  }
});
