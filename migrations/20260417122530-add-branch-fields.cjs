"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // 1. Create branches table
    await queryInterface.createTable("branches", {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      name: {
        type: Sequelize.STRING(100),
        allowNull: false,
      },
      code: {
        type: Sequelize.STRING(20),
        allowNull: false,
        unique: true,
      },
      address: {
        type: Sequelize.JSONB,
        defaultValue: {},
      },
      contact: {
        type: Sequelize.JSONB,
        defaultValue: {},
      },
      location: {
        type: Sequelize.JSONB,
        defaultValue: {},
      },
      bankAccounts: {
        type: Sequelize.JSONB,
        defaultValue: [],
        field: "bankAccounts", // keep camelCase to match model's field override
      },
      admin_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: { model: "users", key: "id" },
        onDelete: "SET NULL",
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
      },
      settings: {
        type: Sequelize.JSONB,
        defaultValue: {},
      },
      created_by: {
        type: Sequelize.UUID,
        allowNull: true,
      },
      updated_by: {
        type: Sequelize.UUID,
        allowNull: true,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
      },
      deleted_at: {
        type: Sequelize.DATE,
      },
    });

    // 2. Add indexes on branches table
    await queryInterface.addIndex("branches", ["code"]);
    await queryInterface.addIndex("branches", ["is_active"]);
    await queryInterface.addIndex("branches", ["admin_id"]);

    // 3. Add branch_id column to users table if not exists (safe)
    const usersTable = await queryInterface.describeTable("users");
    if (!usersTable.branch_id) {
      await queryInterface.addColumn("users", "branch_id", {
        type: Sequelize.UUID,
        allowNull: true,
        references: { model: "branches", key: "id" },
        onDelete: "SET NULL",
      });
      await queryInterface.addIndex("users", ["branch_id"]);
    }
  },

  down: async (queryInterface) => {
    // Remove branch_id from users
    const usersTable = await queryInterface.describeTable("users");
    if (usersTable.branch_id) {
      await queryInterface.removeColumn("users", "branch_id");
    }
    // Drop branches table
    await queryInterface.dropTable("branches");
  },
};
