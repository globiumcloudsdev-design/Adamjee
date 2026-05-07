import dotenv from "dotenv";
import fs from "fs";
import path from "path";

// Manually load .env.local
const envPath = path.resolve(".env.local");
if (fs.existsSync(envPath)) {
  const envConfig = dotenv.parse(fs.readFileSync(envPath));
  for (const k in envConfig) {
    process.env[k] = envConfig[k];
  }
}

async function checkCounts() {
  try {
    const { Assignment, AssignmentSubmission, sequelize } = await import("../src/backend/models/postgres/index.js");

    const assignments = await Assignment.findAll({
      attributes: [
        'id',
        'title',
        [
          sequelize.literal(`(SELECT COUNT(*) FROM assignment_submissions WHERE assignment_id = "Assignment".id)`),
          "sub_count"
        ],
        [
          sequelize.literal(`(SELECT COUNT(*) FROM users WHERE role = 'STUDENT' AND branch_id = "Assignment".branch_id AND (details->'academic_info'->>'class_id')::text = "Assignment".class_id::text AND (details->'academic_info'->>'section_id')::text = "Assignment".section_id::text)`),
          "total_students"
        ]
      ],
      raw: true
    });

    console.log("Assignments and counts:");
    assignments.forEach(a => {
      console.log(`- [${a.id}] ${a.title}: ${a.sub_count} / ${a.total_students}`);
    });

    // Check raw count for one assignment
    if (assignments.length > 0) {
        const rawCount = await AssignmentSubmission.count({ where: { assignment_id: assignments[0].id } });
        console.log(`\nRaw count for "${assignments[0].title}": ${rawCount}`);
    }

  } catch (error) {
    console.error("Error:", error);
  } finally {
    process.exit();
  }
}

checkCounts();
