"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable("assignment_submissions", {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      assignment_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: "assignments", key: "id" },
        onDelete: "CASCADE",
      },
      student_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: "users", key: "id" },
        onDelete: "CASCADE",
      },
      submission_text: { type: Sequelize.TEXT },
      submission_url: { type: Sequelize.STRING(500) },
      submission_public_id: { type: Sequelize.STRING },
      submitted_at: { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
      is_late: { type: Sequelize.BOOLEAN, defaultValue: false },
      obtained_marks: { type: Sequelize.INTEGER },
      feedback: { type: Sequelize.TEXT },
      graded_by: {
        type: Sequelize.UUID,
        references: { model: "users", key: "id" },
      },
      graded_at: { type: Sequelize.DATE },
      status: {
        type: Sequelize.ENUM("draft", "submitted", "graded"),
        defaultValue: "submitted",
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
    });
    await queryInterface.addIndex("assignment_submissions", ["assignment_id"]);
    await queryInterface.addIndex("assignment_submissions", ["student_id"]);
    await queryInterface.addIndex("assignment_submissions", ["submitted_at"]);
  },
  down: async (queryInterface) => {
    await queryInterface.dropTable("assignment_submissions");
    await queryInterface.sequelize.query(
      'DROP TYPE IF EXISTS "enum_assignment_submissions_status";',
    );
  },
};
