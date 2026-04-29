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
    periods: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: [],
      comment:
        "[{ day, startTime, endTime, subjectId, teacherId, roomNumber, periodType }]",
    },
  },
  {
    tableName: "timetables",
    timestamps: true,
    underscored: true,
  }
);

Timetable.associate = (models) => {
  Timetable.belongsTo(models.Branch, { as: "branch", foreignKey: "branch_id" });
  Timetable.belongsTo(models.Class, { as: "class", foreignKey: "class_id" });
  Timetable.belongsTo(models.Section, { as: "section", foreignKey: "section_id" });
  Timetable.belongsTo(models.AcademicYear, {
    as: "academicYear",
    foreignKey: "academic_year_id",
  });
};

export default Timetable;
