import { DataTypes } from "sequelize";
import sequelize from "../../config/database.js";

const Exam = sequelize.define(
  "Exam",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    exam_type: {
      type: DataTypes.ENUM(
        "midterm",
        "final",
        "quiz",
        "unit_test",
        "mock",
        "surprise",
        "practical",
        "oral"
      ),
      defaultValue: "midterm",
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
    group_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: { model: "groups", key: "id" },
      onDelete: "SET NULL",
    },
    // Subjects array: [{ subject_id, date, start_time, end_time, total_marks, passing_marks }]
    subjects: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: [],
    },
    status: {
      type: DataTypes.ENUM(
        "scheduled",
        "ongoing",
        "completed",
        "cancelled",
        "postponed"
      ),
      defaultValue: "scheduled",
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    created_by: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    updated_by: {
      type: DataTypes.UUID,
      allowNull: true,
    },
  },
  {
    tableName: "exams",
    timestamps: true,
    underscored: true,
    paranoid: true,
  }
);

Exam.associate = (models) => {
  Exam.belongsTo(models.Branch, { as: "branch", foreignKey: "branch_id" });
  Exam.belongsTo(models.Class, { as: "class", foreignKey: "class_id" });
  Exam.belongsTo(models.Section, { as: "section", foreignKey: "section_id" });
  Exam.belongsTo(models.Group, { as: "group", foreignKey: "group_id" });
  Exam.belongsTo(models.AcademicYear, {
    as: "academicYear",
    foreignKey: "academic_year_id",
  });
  Exam.hasMany(models.ExamMark, { as: "marks", foreignKey: "exam_id" });
};

export default Exam;
