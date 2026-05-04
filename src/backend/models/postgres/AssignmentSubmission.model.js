import { DataTypes } from "sequelize";
import sequelize from "../../config/database.js";

const AssignmentSubmission = sequelize.define(
  "AssignmentSubmission",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    assignment_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: "assignments", key: "id" },
      onDelete: "CASCADE",
    },
    student_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: "users", key: "id" },
      onDelete: "CASCADE",
      comment: "Student (role STUDENT)",
    },
    submission_text: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: "Text answer",
    },
    submission_url: {
      type: DataTypes.STRING(500),
      allowNull: true,
      comment: "Uploaded file link",
    },
    submission_public_id: { type: DataTypes.STRING, allowNull: true },
    submitted_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    is_late: { type: DataTypes.BOOLEAN, defaultValue: false },
    obtained_marks: { type: DataTypes.INTEGER, allowNull: true },
    feedback: { type: DataTypes.TEXT, allowNull: true },
    graded_by: {
      type: DataTypes.UUID,
      allowNull: true,
      references: { model: "users", key: "id" },
    },
    graded_at: { type: DataTypes.DATE, allowNull: true },
    status: {
      type: DataTypes.ENUM("draft", "submitted", "graded"),
      defaultValue: "submitted",
    },
  },
  {
    tableName: "assignment_submissions",
    timestamps: true,
    underscored: true,
    indexes: [
      { fields: ["assignment_id"] },
      { fields: ["student_id"] },
      { fields: ["submitted_at"] },
    ],
  },
);

AssignmentSubmission.associate = (models) => {
  AssignmentSubmission.belongsTo(models.Assignment, {
    foreignKey: "assignment_id",
    as: "assignment",
  });
  AssignmentSubmission.belongsTo(models.User, {
    foreignKey: "student_id",
    as: "student",
  });
  AssignmentSubmission.belongsTo(models.User, {
    foreignKey: "graded_by",
    as: "grader",
  });
};

export default AssignmentSubmission;
