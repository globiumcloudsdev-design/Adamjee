import { DataTypes } from "sequelize";
import sequelize from "../../config/database.js";

const Class = sequelize.define(
  "Class",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    name: { type: DataTypes.STRING, allowNull: false },
    group_id: { type: DataTypes.UUID, allowNull: false },
    branch_id: { type: DataTypes.UUID, allowNull: false },
    academic_year_id: { type: DataTypes.UUID, allowNull: true },
    is_active: { type: DataTypes.BOOLEAN, defaultValue: true },
    created_by: { type: DataTypes.UUID, allowNull: false },
  },
  {
    tableName: "classes",
    timestamps: true,
    underscored: true,
    paranoid: true,
  },
);

Class.associate = (models) => {
  Class.belongsTo(models.Group, { foreignKey: "group_id", as: "group" });
  Class.hasMany(models.Section, { foreignKey: "class_id", as: "sections" });
  Class.hasMany(models.Subject, { foreignKey: "class_id", as: "subjects" });
  Class.belongsTo(models.Branch, { foreignKey: "branch_id", as: "branch" });
  Class.belongsTo(models.AcademicYear, { foreignKey: "academic_year_id", as: "academic_year" });
};

export default Class;
