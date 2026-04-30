import { DataTypes } from "sequelize";
import sequelize from "../../config/database.js";

const ExamMark = sequelize.define(
  "ExamMark",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    exam_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: "exams", key: "id" },
      onDelete: "CASCADE",
    },
    student_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: "users", key: "id" },
      onDelete: "CASCADE",
    },
    subject_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: "subjects", key: "id" },
      onDelete: "CASCADE",
    },
    marks_obtained: {
      type: DataTypes.FLOAT,
      allowNull: true,
    },
    is_absent: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    remarks: {
      type: DataTypes.STRING,
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
    tableName: "exam_marks",
    timestamps: true,
    underscored: true,
    // Ensure one mark entry per student per subject per exam
    indexes: [
      {
        unique: true,
        fields: ["exam_id", "student_id", "subject_id"],
      },
    ],
  }
);

ExamMark.associate = (models) => {
  ExamMark.belongsTo(models.Exam, { as: "exam", foreignKey: "exam_id" });
  ExamMark.belongsTo(models.User, { as: "student", foreignKey: "student_id" });
  ExamMark.belongsTo(models.Subject, { as: "subject", foreignKey: "subject_id" });
};

export default ExamMark;
