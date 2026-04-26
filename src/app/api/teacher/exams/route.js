import { NextResponse } from "next/server";
import { withAuth, requireRole } from "@/backend/middleware/auth";
import Exam from "@/backend/models/Exam";
import Timetable from "@/backend/models/Timetable";
import { User } from "@/backend/models/postgres";
import { Branch } from "@/backend/models/postgres";
import { Class } from "@/backend/models/postgres";
import Subject from "@/backend/models/Subject";
import { uploadToCloudinary } from "@/backend/utils/cloudinary";

// GET - List exams for teacher's classes
export const GET = withAuth(async (request, user, userDoc) => {
  try {
    
    const { searchParams } = new URL(request.url);
    const classId = searchParams.get("classId");
    const status = searchParams.get("status");
    const examType = searchParams.get("examType");

    // Build query
    const query = { branchId: userDoc.branchId };

    // If teacher, only show exams for their classes and subjects
    if (userDoc.role === "teacher") {
      const teacherId = userDoc._id;
      const timetables = await Timetable.find({
        "periods.teacherId": teacherId,
        status: "active",
      });

      // Map of classId -> { section -> Set(subjectIds) }
      const teacherAssignments = {};

      timetables.forEach((tt) => {
        const cId = tt.classId.toString();
        const sec = tt.section || "";
        if (!teacherAssignments[cId]) teacherAssignments[cId] = {};
        if (!teacherAssignments[cId][sec])
          teacherAssignments[cId][sec] = new Set();

        tt.periods.forEach((p) => {
          if (p.teacherId?.toString() === teacherId.toString() && p.subjectId) {
            teacherAssignments[cId][sec].add(p.subjectId.toString());
          }
        });
      });

      const filters = [];
      for (const [cId, sections] of Object.entries(teacherAssignments)) {
        for (const [sec, sIds] of Object.entries(sections)) {
          filters.push({
            classId: cId,
            $or: [{ section: sec }, { section: { $in: [null, ""] } }],
            "subjects.subjectId": { $in: Array.from(sIds) },
          });
        }
      }

      if (filters.length > 0) {
        query.$or = filters;
      } else {
        // Teacher has no assignments
        return NextResponse.json({ success: true, exams: [] });
      }

      if (classId) {
        if (!teacherAssignments[classId]) {
          return NextResponse.json(
            { success: false, message: "Access denied to this class" },
            { status: 403 },
          );
        }
        query.classId = classId;
      }
    } else if (classId) {
      query.classId = classId;
    }

    if (status) query.status = status;
    if (examType) query.examType = examType;

    const exams = await Exam.find(query)
      .populate("classId", "name grade section")
      .populate("subjects.subjectId", "name code")
      .sort({ createdAt: -1 })
      .lean();

    // If teacher, filter the subjects array within each exam to only show their assigned subjects
    if (userDoc.role === "teacher") {
      const teacherId = userDoc._id;
      const timetables = await Timetable.find({
        "periods.teacherId": teacherId,
        status: "active",
      });

      // Map of classId -> { section -> Set(subjectIds) }
      const teacherAssignments = {};
      timetables.forEach((tt) => {
        const cId = tt.classId.toString();
        const sec = tt.section || "";
        if (!teacherAssignments[cId]) teacherAssignments[cId] = {};
        if (!teacherAssignments[cId][sec])
          teacherAssignments[cId][sec] = new Set();

        tt.periods.forEach((p) => {
          if (p.teacherId?.toString() === teacherId.toString() && p.subjectId) {
            teacherAssignments[cId][sec].add(p.subjectId.toString());
          }
        });
      });

      return NextResponse.json({
        success: true,
        exams: exams
          .map((exam) => {
            const cId = exam.classId._id.toString();
            const examSection = exam.section || "";

            // Get all subjects the teacher teaches in this class and section
            // If exam has no section, teacher can see subjects from any of their sections in this class
            let allowedSubjects = new Set();
            if (examSection) {
              allowedSubjects =
                teacherAssignments[cId]?.[examSection] || new Set();
            } else {
              const sections = teacherAssignments[cId] || {};
              Object.values(sections).forEach((sIds) => {
                sIds.forEach((id) => allowedSubjects.add(id));
              });
            }

            return {
              ...exam,
              subjects: exam.subjects.filter((s) =>
                allowedSubjects.has(s.subjectId._id.toString()),
              ),
            };
          })
          .filter((exam) => exam.subjects.length > 0), // Only return exams that have at least one subject for this teacher
      });
    }

    return NextResponse.json({ success: true, exams });
  } catch (error) {
    console.error("Error fetching exams:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch exams" },
      { status: 500 },
    );
  }
});

// POST - Create new exam (Restricted to Admins)
export const POST = withAuth(
  async (request, user, userDoc) => {
    try {
            const body = await request.json();

      const { title, examType, classId, subjects, status, section } = body;

      if (
        !title ||
        !examType ||
        !classId ||
        !subjects ||
        subjects.length === 0
      ) {
        return NextResponse.json(
          { success: false, message: "Missing required fields" },
          { status: 400 },
        );
      }

      const exam = await Exam.create({
        title,
        examType,
        classId,
        section,
        branchId: userDoc.branchId,
        subjects,
        status: status || "scheduled",
        createdBy: userDoc._id,
      });

      return NextResponse.json({
        success: true,
        message: "Exam created successfully",
        exam,
      });
    } catch (error) {
      console.error("Error creating exam:", error);
      return NextResponse.json(
        { success: false, message: "Failed to create exam" },
        { status: 500 },
      );
    }
  },
  [requireRole(["super_admin", "branch_admin"])],
);
