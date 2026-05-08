import { NextResponse } from "next/server";
import { withAuth } from "@/backend/middleware/auth.middleware.js";
import {
  Timetable,
  Class,
  Section,
  Subject,
  User,
} from "@/backend/models/postgres";

function isValidUUID(value) {
  if (typeof value !== "string") return false;
  const v = value.trim();
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v);
}

const DAY_ORDER = {
  Monday: 1,
  Tuesday: 2,
  Wednesday: 3,
  Thursday: 4,
  Friday: 5,
  Saturday: 6,
};

function timeToMinutes(t) {
  if (!t) return Number.POSITIVE_INFINITY;
  const s = String(t).trim();
  // Accept HH:mm or HH:mm:ss
  const match = s.match(/^(\d{1,2}):(\d{2})/);
  if (!match) return Number.POSITIVE_INFINITY;
  const hh = parseInt(match[1], 10);
  const mm = parseInt(match[2], 10);
  return hh * 60 + mm;
}

async function getStudentTimetable(req) {
  try {
    const currentUser = req.user;
    const { searchParams } = new URL(req.url);
    let class_id = searchParams.get("class_id");
    let section_id = searchParams.get("section_id");

    // For STUDENT role: auto-fetch from their enrolled class/section
    if (currentUser.role === "STUDENT") {
      const academicInfo = currentUser.details?.academic_info || {};
      class_id = class_id || academicInfo.class_id;
      section_id = section_id || academicInfo.section_id;
    }

    const errors = {};
    if (!class_id) errors.class_id = "class_id is required";
    if (!section_id) errors.section_id = "section_id is required";

    if (class_id && !isValidUUID(class_id)) errors.class_id = "class_id must be a valid UUID";
    if (section_id && !isValidUUID(section_id)) errors.section_id = "section_id must be a valid UUID";

    if (Object.keys(errors).length) {
      return NextResponse.json(
        {
          success: false,
          message: "Validation failed",
          errors,
        },
        { status: 400 },
      );
    }

    let timetables = [];
    let studentSubjects = [];

    if (currentUser.role === "STUDENT") {
      // Fetch full student record to get their details
      const student = await User.findByPk(currentUser.id);
      if (!student) throw new Error("Student record not found");

      studentSubjects = student.details?.academic_info?.subjects || [];
      
      if (studentSubjects.length === 0) {
        return NextResponse.json({
          success: true,
          message: "No subjects selected for this student",
          data: [],
        });
      }

      // Group section IDs
      const sectionIds = [...new Set(studentSubjects.map(s => s.section_id).filter(isValidUUID))];
      
      if (sectionIds.length === 0) {
         // Fallback to primary section if subjects don't have sections
         const primarySection = student.details?.academic_info?.section_id;
         if (isValidUUID(primarySection)) sectionIds.push(primarySection);
      }

      timetables = await Timetable.findAll({
        where: {
          class_id: student.details?.academic_info?.class_id,
          section_id: sectionIds,
        },
        include: [
          { model: Class, as: "class", attributes: ["id", "name"] },
          { model: Section, as: "section", attributes: ["id", "name"] },
        ],
      });
    } else {
      // Admin/Teacher view: fallback to query params
      const where = { class_id };
      if (section_id) where.section_id = section_id;

      timetables = await Timetable.findAll({
        where,
        include: [
          { model: Class, as: "class", attributes: ["id", "name"] },
          { model: Section, as: "section", attributes: ["id", "name"] },
        ],
        order: [["created_at", "DESC"]],
      });
    }

    // Build day-wise schedule from JSONB `periods`.
    // Expected element shape:
    // [{ day, startTime, endTime, subjectId, teacherId, roomNumber, periodType }]

    const subjectIds = new Set();
    const teacherIds = new Set();

    for (const tt of timetables) {
      const periods = Array.isArray(tt.periods) ? tt.periods : [];
      for (const p of periods) {
        if (p?.subjectId) subjectIds.add(p.subjectId);
        if (p?.teacherId) teacherIds.add(p.teacherId);
      }
    }

    const [subjects, teachers] = await Promise.all([
      subjectIds.size
        ? Subject.findAll({
            where: { id: Array.from(subjectIds) },
            attributes: ["id", "name"],
          })
        : Promise.resolve([]),
      teacherIds.size
        ? User.findAll({
            where: { id: Array.from(teacherIds) },
            attributes: ["id", "first_name", "last_name", "email"],
          })
        : Promise.resolve([]),
    ]);

    const subjectById = new Map(subjects.map((s) => [s.id, s]));
    const teacherById = new Map(teachers.map((t) => [t.id, t]));

    // For STUDENTS: Create a map of subjectId -> sectionId they are enrolled in
    const studentEnrollmentMap = new Map();
    if (currentUser.role === "STUDENT") {
      studentSubjects.forEach(s => {
        if (s.id && s.section_id) studentEnrollmentMap.set(String(s.id), String(s.section_id));
      });
    }

    const data = timetables
      .flatMap((tt) => {
        const classObj = tt.class
          ? { id: tt.class.id, name: tt.class.name }
          : { id: tt.class_id, name: null };
        const sectionObj = tt.section
          ? { id: tt.section.id, name: tt.section.name }
          : { id: tt.section_id, name: null };

        const periods = Array.isArray(tt.periods) ? tt.periods : [];

        return periods
          .filter(p => {
             // If not a student, show all
             if (currentUser.role !== "STUDENT") return true;
             
             // If student, only show if they are enrolled in THIS subject in THIS section
             const enrolledSectionId = studentEnrollmentMap.get(String(p.subjectId));
             return enrolledSectionId === String(tt.section_id);
          })
          .map((p, idx) => {
            const day = p?.day ?? null;
            const startTime = p?.startTime ?? p?.start_time ?? null;
            const endTime = p?.endTime ?? p?.end_time ?? null;

            const formatTime = (val) => {
              if (!val) return null;
              const s = String(val);
              if (s.includes("T")) return s.split("T")[1]?.substring(0, 5) || null;
              return s.substring(0, 5);
            };

            const subject = p?.subjectId
              ? (() => {
                  const s = subjectById.get(p.subjectId);
                  return s
                    ? { id: s.id, name: s.name }
                    : { id: p.subjectId, name: null };
                })()
              : null;

            const teacher = p?.teacherId
              ? (() => {
                  const t = teacherById.get(p.teacherId);
                  if (!t) return { id: p.teacherId, name: null };
                  const name = [t.first_name, t.last_name].filter(Boolean).join(" ").trim();
                  return { id: t.id, name: name || t.email };
                })()
              : null;

            return {
              id: `${tt.id}-${idx}`,
              day,
              start_time: formatTime(startTime),
              end_time: formatTime(endTime),
              subject,
              teacher,
              class: classObj,
              section: sectionObj,
              roomNumber: p?.roomNumber ?? null,
              periodType: p?.periodType ?? null,
            };
          });
      })
      .filter(Boolean);


    // Sort by day (Monday → Saturday) then by start_time ascending
    data.sort((a, b) => {
      const dayA = DAY_ORDER[a.day] ?? 999;
      const dayB = DAY_ORDER[b.day] ?? 999;
      if (dayA !== dayB) return dayA - dayB;
      return timeToMinutes(a.start_time) - timeToMinutes(b.start_time);
    });

    return NextResponse.json({
      success: true,
      message: "Timetable fetched successfully",
      data,
    });
  } catch (error) {
    console.error("Student timetable fetch error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export const GET = withAuth(getStudentTimetable, ["SUPER_ADMIN", "BRANCH_ADMIN", "TEACHER", "STUDENT"]);

