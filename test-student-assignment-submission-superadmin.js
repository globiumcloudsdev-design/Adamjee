const BASE_URL = process.env.BASE_URL || "http://localhost:3000";

const CREDENTIALS = {
  superAdmin: {
    login: process.env.SUPER_ADMIN_LOGIN || "admin@coaching.com",
    password: process.env.SUPER_ADMIN_PASSWORD || "Admin@123",
  },
  student: {
    login: process.env.STUDENT_LOGIN || "nomanirshad0324@gmail.com",
    password: process.env.STUDENT_PASSWORD || "12345678",
  },
};

function print(title) {
  console.log(`\n========== ${title} ==========`);
}

async function request(path, options = {}) {
  const res = await fetch(`${BASE_URL}${path}`, options);
  const text = await res.text();
  let data;
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = { raw: text };
  }
  return { status: res.status, data };
}

async function login({ login, password }) {
  const response = await request("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ login, password }),
  });

  if (response.status !== 200 || !response.data?.accessToken) {
    throw new Error(`Login failed (${response.status}): ${JSON.stringify(response.data)}`);
  }

  return response.data.accessToken;
}

function auth(token) {
  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };
}

async function run() {
  print("AUTH");
  const superToken = await login(CREDENTIALS.superAdmin);
  console.log("Super admin login successful");

  let studentToken = null;
  try {
    studentToken = await login(CREDENTIALS.student);
    console.log("Student login successful");
  } catch (error) {
    console.log(`Student login failed: ${error.message}`);
  }

  print("SEARCH STUDENT BY EMAIL");
  const studentSearch = await request(
    `/api/users/students?q=${encodeURIComponent(CREDENTIALS.student.login)}`,
    {
      headers: {
        Authorization: `Bearer ${superToken}`,
      },
    },
  );
  console.log("Search status:", studentSearch.status);
  console.log("Search result count:", Array.isArray(studentSearch.data) ? studentSearch.data.length : 0);

  let studentRecord = Array.isArray(studentSearch.data) ? studentSearch.data[0] : null;

  print("FETCH STUDENT CONTEXT");
  let studentContext = null;
  if (studentToken) {
    const me = await request("/api/auth/me", { headers: { Authorization: `Bearer ${studentToken}` } });
    studentContext = me.data?.user || null;
    console.log("Student /me status:", me.status);
    console.log("Student ID:", studentContext?.id || "N/A");
  } else {
    console.log("Skipping /api/auth/me because student login failed");
  }

  print("LOAD SUPER ADMIN SETUP DATA");
  const branchesRes = await request("/api/super-admin/branches", {
    headers: { Authorization: `Bearer ${superToken}` },
  });
  const branches = branchesRes.data?.data?.branches || [];
  const branchId = studentRecord?.branch_id || studentContext?.branch_id || branches[0]?.id;
  console.log("Branch selected:", branchId || "N/A");

  const classesRes = await request(`/api/classes?branch_id=${branchId}`, {
    headers: { Authorization: `Bearer ${superToken}` },
  });
  const classes = classesRes.data?.data || classesRes.data || [];

  const studentAcademicInfo = studentContext?.details?.academic_info || studentRecord?.details?.academic_info || {};
  const classId = studentAcademicInfo.class_id || classes[0]?.id;

  const sectionsRes = classId
    ? await request(`/api/sections?class_id=${classId}`, {
        headers: { Authorization: `Bearer ${superToken}` },
      })
    : { data: [] };
  const sections = sectionsRes.data?.data || sectionsRes.data || [];
  const sectionId = studentAcademicInfo.section_id || sections[0]?.id;

  const subjectsRes = classId
    ? await request(`/api/subjects?class_id=${classId}`, {
        headers: { Authorization: `Bearer ${superToken}` },
      })
    : { data: [] };
  const subjects = subjectsRes.data?.data || subjectsRes.data || [];

  const enrolledSubjectIds = (studentAcademicInfo.subjects || []).map((subject) => subject.id).filter(Boolean);
  const subjectId = enrolledSubjectIds[0] || subjects[0]?.id;

  const yearsRes = await request(`/api/academic-years?branch_id=${branchId}`, {
    headers: { Authorization: `Bearer ${superToken}` },
  });
  const years = yearsRes.data?.data || yearsRes.data || [];
  const academicYearId = studentAcademicInfo.academic_year_id || years[0]?.id || null;

  const teacherListRes = await request(`/api/users/teachers?branchId=${branchId}`, {
    headers: { Authorization: `Bearer ${superToken}` },
  });
  const teachers = teacherListRes.data?.data || [];
  let teacherId = teachers[0]?.id;

  if (!teacherId && branchId) {
    print("CREATE TEACHER VIA SUPER ADMIN");
    const formData = new FormData();
    formData.append(
      "data",
      JSON.stringify({
        first_name: "Auto",
        last_name: "Teacher",
        email: `auto.teacher.${Date.now()}@example.com`,
        phone: `03${Math.floor(100000000 + Math.random() * 899999999)}`,
        password: "Welcome@123",
        branch_id: branchId,
      }),
    );

    const createTeacherRes = await fetch(`${BASE_URL}/api/users/teachers`, {
      method: "POST",
      headers: { Authorization: `Bearer ${superToken}` },
      body: formData,
    });

    const teacherText = await createTeacherRes.text();
    let teacherData;
    try {
      teacherData = JSON.parse(teacherText);
    } catch {
      teacherData = { raw: teacherText };
    }

    console.log("Create teacher status:", createTeacherRes.status);
    teacherId = teacherData?.teacher?.id;
    if (!teacherId) {
      console.log("Teacher creation did not return ID. Continuing with existing resources.");
    }
  }

  print("SUPER ADMIN CREATE ASSIGNMENT/EXAM/TIMETABLE");
  let assignmentId = null;

  if (branchId && classId && sectionId && subjectId && teacherId) {
    const assignmentPayload = {
      branch_id: branchId,
      academic_year_id: academicYearId,
      class_id: classId,
      section_id: sectionId,
      subject_id: subjectId,
      teacher_id: teacherId,
      title: `Auto Assignment ${Date.now()}`,
      description: "Created by automated super admin setup test",
      due_date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
      total_marks: 20,
      is_active: true,
    };

    const createAssignmentRes = await request("/api/assignments", {
      method: "POST",
      headers: auth(superToken),
      body: JSON.stringify(assignmentPayload),
    });

    console.log("Create assignment status:", createAssignmentRes.status);
    assignmentId = createAssignmentRes.data?.assignment?.id || null;

    const examPayload = {
      title: `Auto Exam ${Date.now()}`,
      exam_type: "quiz",
      branch_id: branchId,
      academic_year_id: academicYearId,
      group_id: classes[0]?.group_id,
      class_id: classId,
      section_id: sectionId,
      subjects: [
        {
          subject_id: subjectId,
          date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000)
            .toISOString()
            .split("T")[0],
          total_marks: 50,
          passing_marks: 20,
          start_time: "09:00",
          end_time: "10:00",
        },
      ],
      description: "Created by automated super admin setup test",
    };

    const createExamRes = await request("/api/exams", {
      method: "POST",
      headers: auth(superToken),
      body: JSON.stringify(examPayload),
    });
    console.log("Create exam status:", createExamRes.status);

    const timetablePayload = {
      branch_id: branchId,
      academic_year_id: academicYearId,
      class_id: classId,
      section_id: sectionId,
      periods: [
        {
          day: "Monday",
          startTime: "09:00",
          endTime: "10:00",
          subjectId: subjectId,
          teacherId: teacherId,
          roomNumber: "A-01",
          periodType: "Theory",
        },
      ],
    };

    const createTimetableRes = await request("/api/timetable", {
      method: "POST",
      headers: auth(superToken),
      body: JSON.stringify(timetablePayload),
    });
    console.log("Create timetable status:", createTimetableRes.status);
  } else {
    console.log("Skipping setup creation because class/section/subject/teacher context is incomplete");
  }

  print("STUDENT ASSIGNMENT & SUBMISSION APIS");
  if (!studentToken) {
    console.log("Skipping student assignment tests due to missing student token");
    return;
  }

  const assignmentsRes = await request("/api/student/assignments", {
    headers: { Authorization: `Bearer ${studentToken}` },
  });
  console.log("GET /api/student/assignments status:", assignmentsRes.status);
  const assignments = assignmentsRes.data?.data?.assignments || [];
  console.log("Assignment count:", assignments.length);

  const selectedAssignmentId = assignmentId || assignments[0]?.id;
  if (!selectedAssignmentId) {
    console.log("No assignment available for detail/submit test");
    return;
  }

  const assignmentDetailRes = await request(`/api/student/assignments/${selectedAssignmentId}`, {
    headers: { Authorization: `Bearer ${studentToken}` },
  });
  console.log("GET /api/student/assignments/:id status:", assignmentDetailRes.status);

  const submitRes = await request(`/api/student/assignments/${selectedAssignmentId}/submit`, {
    method: "POST",
    headers: auth(studentToken),
    body: JSON.stringify({
      submission_text: `Auto submission ${new Date().toISOString()}`,
    }),
  });
  console.log("POST /api/student/assignments/:id/submit status:", submitRes.status);

  const submissionsRes = await request("/api/student/submissions", {
    headers: { Authorization: `Bearer ${studentToken}` },
  });
  console.log("GET /api/student/submissions status:", submissionsRes.status);
  console.log("Student submissions count:", submissionsRes.data?.data?.length || 0);

  console.log("\nDone");
}

run().catch((error) => {
  console.error("Test failed:", error.message);
  process.exit(1);
});
