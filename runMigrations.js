import * as dotenv from 'dotenv';
dotenv.config({ path: '/home/sajoodali/Project/Adamjee-Couching-Center-Campus-12/.env' });
import sequelize from "./src/backend/config/database.js";

async function run() {
  try {
    await sequelize.authenticate();
    console.log("Connected to NeonDB");
    
    await sequelize.query("ALTER TABLE academic_years ADD COLUMN IF NOT EXISTS is_super_admin_only BOOLEAN DEFAULT false;");
    await sequelize.query("ALTER TABLE groups ADD COLUMN IF NOT EXISTS is_super_admin_only BOOLEAN DEFAULT false;");
    await sequelize.query("ALTER TABLE classes ADD COLUMN IF NOT EXISTS is_super_admin_only BOOLEAN DEFAULT false;");
    await sequelize.query("ALTER TABLE sections ADD COLUMN IF NOT EXISTS is_super_admin_only BOOLEAN DEFAULT false;");
    
    console.log("✅ Custom DB alterations executed successfully");
  } catch (e) {
    console.error("Migration failed:", e);
  } finally {
    await sequelize.close();
  }
}
run();
