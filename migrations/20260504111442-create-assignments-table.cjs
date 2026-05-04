"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable("assignments", {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      branch_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: "branches", key: "id" },
        onDelete: "CASCADE",
      },
      academic_year_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: { model: "academic_years", key: "id" },
        onDelete: "SET NULL",
      },
      class_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: "classes", key: "id" },
        onDelete: "CASCADE",
      },
      section_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: "sections", key: "id" },
        onDelete: "CASCADE",
      },
      subject_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: "subjects", key: "id" },
        onDelete: "CASCADE",
      },
      teacher_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: "users", key: "id" },
        onDelete: "CASCADE",
      },
      title: { type: Sequelize.STRING(200), allowNull: false },
      description: { type: Sequelize.TEXT },
      attachment_url: { type: Sequelize.STRING(500) },
      attachment_public_id: { type: Sequelize.STRING },
      due_date: { type: Sequelize.DATE, allowNull: false },
      total_marks: { type: Sequelize.INTEGER, defaultValue: 0 },
      is_active: { type: Sequelize.BOOLEAN, defaultValue: true },
      created_by: { type: Sequelize.UUID },
      updated_by: { type: Sequelize.UUID },
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
    });
    await queryInterface.addIndex("assignments", ["branch_id"]);
    await queryInterface.addIndex("assignments", ["class_id", "section_id"]);
    await queryInterface.addIndex("assignments", ["subject_id"]);
    await queryInterface.addIndex("assignments", ["teacher_id"]);
    await queryInterface.addIndex("assignments", ["due_date"]);
  },
  down: async (queryInterface) => {
    await queryInterface.dropTable("assignments");
  },
};
