import { DataTypes } from "sequelize";
import sequelize from "../../config/database.js";

const Assignment = sequelize.define(
  "Assignment",
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
      onDelete: "CASCADE",
      comment: "Teacher who created",
    },
    title: { type: DataTypes.STRING(200), allowNull: false },
    description: { type: DataTypes.TEXT, allowNull: true },
    attachment_url: {
      type: DataTypes.STRING(500),
      allowNull: true,
      comment: "Cloudinary/file URL",
    },
    attachment_public_id: { type: DataTypes.STRING, allowNull: true },
    due_date: { type: DataTypes.DATE, allowNull: false },
    total_marks: { type: DataTypes.INTEGER, allowNull: true, defaultValue: 0 },
    is_active: { type: DataTypes.BOOLEAN, defaultValue: true },
    created_by: { type: DataTypes.UUID, allowNull: true },
    updated_by: { type: DataTypes.UUID, allowNull: true },
  },
  {
    tableName: "assignments",
    timestamps: true,
    underscored: true,
    indexes: [
      { fields: ["branch_id"] },
      { fields: ["class_id", "section_id"] },
      { fields: ["subject_id"] },
      { fields: ["teacher_id"] },
      { fields: ["due_date"] },
    ],
  },
);

Assignment.associate = (models) => {
  Assignment.belongsTo(models.Branch, {
    foreignKey: "branch_id",
    as: "branch",
  });
  Assignment.belongsTo(models.AcademicYear, {
    foreignKey: "academic_year_id",
    as: "academicYear",
  });
  Assignment.belongsTo(models.Class, { foreignKey: "class_id", as: "class" });
  Assignment.belongsTo(models.Section, {
    foreignKey: "section_id",
    as: "section",
  });
  Assignment.belongsTo(models.Subject, {
    foreignKey: "subject_id",
    as: "subject",
  });
  Assignment.belongsTo(models.User, {
    foreignKey: "teacher_id",
    as: "teacher",
  });
  Assignment.hasMany(models.AssignmentSubmission, {
    foreignKey: "assignment_id",
    as: "submissions",
  });
};

export default Assignment;
