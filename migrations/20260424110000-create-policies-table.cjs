"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable("policies", {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      branch_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: { model: "branches", key: "id" },
        onDelete: "SET NULL",
      },
      policy_type: {
        type: Sequelize.ENUM(
          "id_card",
          "payroll",
          "attendance",
          "leave",
          "exam",
          "fee",
          "transport",
          "hostel",
          "library",
          "hr",
          "academic",
          "it",
          "security"
        ),
        allowNull: false,
      },
      policy_name: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      config: {
        type: Sequelize.JSONB,
        allowNull: false,
        defaultValue: {},
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      version: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 1,
      },
      created_by: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: "users", key: "id" },
        onDelete: "RESTRICT",
      },
      updated_by: {
        type: Sequelize.UUID,
        allowNull: true,
        references: { model: "users", key: "id" },
        onDelete: "SET NULL",
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
        allowNull: true,
      },
    });

    await queryInterface.addIndex("policies", ["branch_id"]);
    await queryInterface.addIndex("policies", ["policy_type"]);
    await queryInterface.addIndex("policies", ["is_active"]);
    await queryInterface.addIndex("policies", ["branch_id", "policy_type", "is_active"], {
      name: "policies_branch_type_active_idx",
    });
  },

  down: async (queryInterface) => {
    await queryInterface.removeIndex("policies", "policies_branch_type_active_idx");
    await queryInterface.dropTable("policies");

    // Keep this safe for Postgres ENUM cleanup.
    await queryInterface.sequelize.query(
      'DROP TYPE IF EXISTS "enum_policies_policy_type";'
    );
  },
};
