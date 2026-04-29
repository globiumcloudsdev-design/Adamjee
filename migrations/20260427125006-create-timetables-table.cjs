"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable("timetables", {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
      branch_id: { type: Sequelize.UUID, allowNull: false, references: { model: "branches", key: "id" }, onDelete: "CASCADE" },
      academic_year_id: { type: Sequelize.UUID, allowNull: true, references: { model: "academic_years", key: "id" }, onDelete: "SET NULL" },
      class_id: { type: Sequelize.UUID, allowNull: false, references: { model: "classes", key: "id" }, onDelete: "CASCADE" },
      section_id: { type: Sequelize.UUID, allowNull: false, references: { model: "sections", key: "id" }, onDelete: "CASCADE" },
      subject_id: { type: Sequelize.UUID, allowNull: false, references: { model: "subjects", key: "id" }, onDelete: "CASCADE" },
      teacher_id: { type: Sequelize.UUID, allowNull: false, references: { model: "users", key: "id" }, onDelete: "RESTRICT" },
      day_of_week: { type: Sequelize.ENUM("Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"), allowNull: false },
      start_time: { type: Sequelize.TIME, allowNull: false },
      end_time: { type: Sequelize.TIME, allowNull: false },
      room_no: { type: Sequelize.STRING(50) },
      created_by: { type: Sequelize.UUID },
      updated_by: { type: Sequelize.UUID },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
    });
    await queryInterface.addIndex("timetables", ["branch_id"]);
    await queryInterface.addIndex("timetables", ["class_id", "section_id"]);
    await queryInterface.addIndex("timetables", ["teacher_id"]);
  },
  down: async (queryInterface) => {
    await queryInterface.dropTable("timetables");
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_timetables_day_of_week";');
  },
};