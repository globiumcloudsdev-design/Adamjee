import { NextResponse } from "next/server";
import sequelize from "@/backend/config/database";

export async function GET() {
  try {
    console.log("Starting Database Fix...");
    
    // 1. Alter staff_sub_type to VARCHAR
    await sequelize.query(`
      ALTER TABLE users 
      ALTER COLUMN staff_sub_type TYPE VARCHAR(100) 
      USING staff_sub_type::VARCHAR;
    `);

    // 2. Make last_name optional
    await sequelize.query(`
      ALTER TABLE users 
      ALTER COLUMN last_name DROP NOT NULL;
    `);

    // 3. Make phone optional
    await sequelize.query(`
      ALTER TABLE users 
      ALTER COLUMN phone DROP NOT NULL;
    `);

    console.log("Database Fix Completed Successfully!");
    
    return NextResponse.json({ 
      success: true, 
      message: "Database schema updated successfully. You can now add staff with any role." 
    });
  } catch (error) {
    console.error("Database Fix Failed:", error);
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}
