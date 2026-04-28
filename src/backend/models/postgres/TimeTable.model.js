import { DataTypes } from "sequelize";
import sequelize from "../../config/database.js";

const Timetable = sequelize.define(
  "Timetable",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    branch_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: "branches", key: "id" },
      onDelete: "CASCADE",
    },
    academic_year_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: { model: "academic_years", key: "id" },
      onDelete: "SET NULL",
    },
    class_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: "classes", key: "id" },
      onDelete: "CASCADE",
    },
    section_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: "sections", key: "id" },
      onDelete: "CASCADE",
    },
    subject_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: "subjects", key: "id" },
      onDelete: "CASCADE",
    },
    teacher_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: "users", key: "id" },
      onDelete: "RESTRICT",
      comment: "User with role TEACHER",
    },
    day_of_week: {
      type: DataTypes.ENUM(
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
    start_time: { type: DataTypes.TIME, allowNull: false },
    end_time: { type: DataTypes.TIME, allowNull: false },
    room_no: { type: DataTypes.STRING(50), allowNull: true },
    created_by: { type: DataTypes.UUID, allowNull: true },
    updated_by: { type: DataTypes.UUID, allowNull: true },
  },
  {
    tableName: "timetables",
    timestamps: true,
    underscored: true,
    paranoid: false, // we can keep soft delete optional
    indexes: [
      { fields: ["branch_id"] },
      { fields: ["class_id", "section_id"] },
      { fields: ["academic_year_id"] },
      { fields: ["teacher_id"] },
    ],
  },
);

Timetable.associate = (models) => {
  Timetable.belongsTo(models.Branch, { foreignKey: "branch_id", as: "branch" });
  Timetable.belongsTo(models.AcademicYear, {
    foreignKey: "academic_year_id",
    as: "academicYear",
  });
  Timetable.belongsTo(models.Class, { foreignKey: "class_id", as: "class" });
  Timetable.belongsTo(models.Section, {
    foreignKey: "section_id",
    as: "section",
  });
  Timetable.belongsTo(models.Subject, {
    foreignKey: "subject_id",
    as: "subject",
  });
  Timetable.belongsTo(models.User, {
    foreignKey: "teacher_id",
    as: "teacher",
    scope: { role: "TEACHER" },
  });
};

export default Timetable;
