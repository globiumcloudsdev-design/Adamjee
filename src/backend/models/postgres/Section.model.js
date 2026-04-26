import { DataTypes } from "sequelize";
import sequelize from "../../config/database.js";

const Section = sequelize.define(
  "Section",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    name: { type: DataTypes.STRING, allowNull: false },
    class_id: { type: DataTypes.UUID, allowNull: false },
    capacity: { type: DataTypes.INTEGER, defaultValue: 40 },
    is_active: { type: DataTypes.BOOLEAN, defaultValue: true },
    created_by: { type: DataTypes.UUID, allowNull: false },
  },
  {
    tableName: "sections",
    timestamps: true,
    underscored: true,
    paranoid: true,
  },
);

Section.associate = (models) => {
  Section.belongsTo(models.Class, { foreignKey: "class_id", as: "class" });
};

export default Section;
