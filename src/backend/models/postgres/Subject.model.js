import { DataTypes } from "sequelize";
import sequelize from "../../config/database.js";

const Subject = sequelize.define(
  "Subject",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    name: { type: DataTypes.STRING, allowNull: false },
    subject_code: { type: DataTypes.STRING },
    class_id: { type: DataTypes.UUID, allowNull: false },
    branch_id: { type: DataTypes.UUID, allowNull: false },
    materials: {
      type: DataTypes.JSONB,
      defaultValue: [],
      comment: "Array of objects: { title, url, public_id, type }",
    },
    is_active: { type: DataTypes.BOOLEAN, defaultValue: true },
    created_by: { type: DataTypes.UUID, allowNull: false },
  },
  {
    tableName: "subjects",
    timestamps: true,
    underscored: true,
    paranoid: true,
  },
);

Subject.associate = (models) => {
  Subject.belongsTo(models.Class, { foreignKey: "class_id", as: "class" });
  Subject.belongsTo(models.Branch, { foreignKey: "branch_id", as: "branch" });
};

export default Subject;
