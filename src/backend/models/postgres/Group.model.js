import { DataTypes } from "sequelize";
import sequelize from "../../config/database.js";

const Group = sequelize.define(
  "Group",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: { notEmpty: { msg: "Group name is required" } },
    },
    description: { type: DataTypes.TEXT },
    branch_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    academic_year_id: {
      type: DataTypes.UUID,
      allowNull: true, // Optional
    },
    is_active: { type: DataTypes.BOOLEAN, defaultValue: true },
    created_by: { type: DataTypes.UUID, allowNull: false },
  },
  {
    tableName: "groups",
    timestamps: true,
    underscored: true,
    paranoid: true, // Soft delete enabled
  },
);

// Associations
Group.associate = (models) => {
  Group.belongsTo(models.Branch, { foreignKey: "branch_id", as: "branch" });
  Group.belongsTo(models.AcademicYear, {
    foreignKey: "academic_year_id",
    as: "academic_year",
  });
  Group.belongsTo(models.User, { foreignKey: "created_by", as: "creator" });
};

export default Group;
