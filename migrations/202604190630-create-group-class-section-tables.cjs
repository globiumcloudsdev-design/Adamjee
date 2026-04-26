"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // 1. Create groups table
    await queryInterface.createTable("groups", {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      branch_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: { model: "branches", key: "id" },
        onDelete: "CASCADE",
      },
      name: { type: Sequelize.STRING(50), allowNull: false },
      code: { type: Sequelize.STRING(10), allowNull: false, unique: true },
      description: { type: Sequelize.STRING(200), allowNull: true },
      is_active: { type: Sequelize.BOOLEAN, defaultValue: true },
      is_super_admin_only: { type: Sequelize.BOOLEAN, defaultValue: false },
      created_at: { allowNull: false, type: Sequelize.DATE },
      updated_at: { allowNull: false, type: Sequelize.DATE },
    });

    // 2. Create classes table
    await queryInterface.createTable("classes", {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      branch_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: { model: "branches", key: "id" },
        onDelete: "CASCADE",
      },
      academic_year_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: "academic_years", key: "id" },
        onDelete: "CASCADE",
      },
      group_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: { model: "groups", key: "id" },
        onDelete: "SET NULL",
      },
      name: { type: Sequelize.STRING(50), allowNull: false },
      code: { type: Sequelize.STRING(10), allowNull: false },
      display_order: { type: Sequelize.INTEGER, defaultValue: 0 },
      is_active: { type: Sequelize.BOOLEAN, defaultValue: true },
      is_super_admin_only: { type: Sequelize.BOOLEAN, defaultValue: false },
      created_at: { allowNull: false, type: Sequelize.DATE },
      updated_at: { allowNull: false, type: Sequelize.DATE },
    });

    // 3. Create sections table
    await queryInterface.createTable("sections", {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      branch_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: { model: "branches", key: "id" },
        onDelete: "CASCADE",
      },
      class_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: "classes", key: "id" },
        onDelete: "CASCADE",
      },
      name: { type: Sequelize.STRING(10), allowNull: false },
      capacity: { type: Sequelize.INTEGER, defaultValue: 0 },
      is_active: { type: Sequelize.BOOLEAN, defaultValue: true },
      is_super_admin_only: { type: Sequelize.BOOLEAN, defaultValue: false },
      created_at: { allowNull: false, type: Sequelize.DATE },
      updated_at: { allowNull: false, type: Sequelize.DATE },
    });

    // Add indexes manually if desired, but querying already indexes FKs on creation
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("sections");
    await queryInterface.dropTable("classes");
    await queryInterface.dropTable("groups");
  },
};
