import sequelize from "../../src/backend/config/database.js";

async function runMigration() {
  try {
    console.log("Altering staff_sub_type column...");
    await sequelize.query(`
      ALTER TABLE users 
      ALTER COLUMN staff_sub_type TYPE VARCHAR(100) 
      USING staff_sub_type::VARCHAR;
    `);
    console.log("Column altered successfully!");
    process.exit(0);
  } catch (error) {
    console.error("Migration failed:", error);
    process.exit(1);
  }
}

runMigration();
