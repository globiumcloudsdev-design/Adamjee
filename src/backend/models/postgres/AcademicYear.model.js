// backend/src/models/AcademicYear.model.js
import { DataTypes, Op } from "sequelize";
import sequelize from "../../config/database.js";

const AcademicYear = sequelize.define(
  "AcademicYear",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    start_date: { type: DataTypes.DATEONLY, allowNull: false },
    end_date: { type: DataTypes.DATEONLY, allowNull: false },
    is_current: { type: DataTypes.BOOLEAN, defaultValue: true },
    branch_id: { type: DataTypes.UUID, allowNull: true },
    created_by: { type: DataTypes.UUID, allowNull: false },
  },
  {
    tableName: "academic_years",
    timestamps: true,
    underscored: true,
    paranoid: true,
    indexes: [
      {
        unique: true,
        fields: ["name", "branch_id"],
        name: "academic_years_name_branch_id_unique",
      },
    ],
  },
);

// Hook: Ek time pe ek hi active rakhne ka logic
AcademicYear.beforeSave(async (academicYear, options) => {
  if (academicYear.is_current) {
    await AcademicYear.update(
      { is_current: false },
      {
        where: {
          branch_id: academicYear.branch_id,
          id: { [Op.ne]: academicYear.id },
        },
        transaction: options.transaction,
      },
    );
  }
});

// ==================== Associations ====================
AcademicYear.associate = (models) => {
  AcademicYear.belongsTo(models.Branch, {
    foreignKey: "branch_id",
    as: "branch",
  });
  AcademicYear.belongsTo(models.User, {
    foreignKey: "created_by",
    as: "creator",
  });
};

export default AcademicYear;
