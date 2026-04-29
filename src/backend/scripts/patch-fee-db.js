import sequelize from "../../config/database.js";

async function runPatch() {
  try {
    console.log("Executing DB patch for fee_vouchers columns...");
    await sequelize.query(`
      ALTER TABLE fee_vouchers 
      ADD COLUMN IF NOT EXISTS paid_amount DECIMAL(10, 2) DEFAULT 0;
    `);
    await sequelize.query(`
      ALTER TABLE fee_vouchers 
      ADD COLUMN IF NOT EXISTS payment_history JSONB DEFAULT '[]';
    `);
    console.log("DB patch applied successfully!");
    process.exit(0);
  } catch (error) {
    console.error("Error applying patch:", error);
    process.exit(1);
  }
}

runPatch();
