"use strict";
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable("timetables", {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },

      // Foreign Keys
      branch_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: "branches", key: "id" },
      },
      academic_year_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: "academic_years", key: "id" },
      },
      group_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: "groups", key: "id" },
        onDelete: "CASCADE",
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
      },
      teacher_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: "users", key: "id" },
      },

      // Schedule Fields
      day: {
        type: Sequelize.ENUM(
          "Monday",
          "Tuesday",
          "Wednesday",
          "Thursday",
          "Friday",
          "Saturday",
          "Sunday",
        ),
        allowNull: false,
      },
      start_time: { type: Sequelize.TIME, allowNull: false },
      end_time: { type: Sequelize.TIME, allowNull: false },
      room_no: { type: Sequelize.STRING, allowNull: true },

      // Metadata
      created_by: { type: Sequelize.UUID, allowNull: false },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false },
      deleted_at: { type: Sequelize.DATE },
    });
  },
  down: async (queryInterface) => {
    await queryInterface.dropTable("timetables");
  },
};
