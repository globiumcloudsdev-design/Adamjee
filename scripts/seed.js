"use strict";
const bcrypt = require("bcryptjs");
const { v4: uuidv4 } = require("uuid");

module.exports = {
  up: async (queryInterface) => {
    const hashedPassword = await bcrypt.hash("Admin@123", 10);
    await queryInterface.bulkInsert("users", [
      {
        id: uuidv4(),
        role: "SUPER_ADMIN",
        first_name: "Super",
        last_name: "Admin",
        email: process.env.SUPER_ADMIN_EMAIL || "admin@coaching.com",
        phone: "0000000000",
        password_hash: hashedPassword,
        plain_password: "Admin@123", // dev only
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
      },
    ]);
  },

  down: async (queryInterface) => {
    await queryInterface.bulkDelete("users", { role: "SUPER_ADMIN" });
  },
};
