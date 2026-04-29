import { DataTypes } from "sequelize";
import sequelize from "../../config/database.js";

const FeeVoucher = sequelize.define(
  "FeeVoucher",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    voucher_no: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    student_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    branch_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    academic_year_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    class_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    section_id: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    amount_due: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    fine_amount: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0,
    },
    due_date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    paid_date: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    paid_amount: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0,
    },
    payment_history: {
      type: DataTypes.JSONB,
      defaultValue: [],
    },
    status: {
      type: DataTypes.ENUM("UNPAID", "PAID", "PARTIAL", "OVERDUE"),
      defaultValue: "UNPAID",
    },
    fee_type: {
      type: DataTypes.ENUM("Monthly", "LumpSum", "Installment"),
      allowNull: false,
    },
    installment_no: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    total_installments: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    month: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    payable_after_due_date: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
    },
    remarks: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    created_by: {
      type: DataTypes.UUID,
      allowNull: false,
    },
  },
  {
    tableName: "fee_vouchers",
    timestamps: true,
    underscored: true,
    paranoid: true,
  }
);

FeeVoucher.associate = (models) => {
  FeeVoucher.belongsTo(models.User, { foreignKey: "student_id", as: "student" });
  FeeVoucher.belongsTo(models.Branch, { foreignKey: "branch_id", as: "branch" });
  FeeVoucher.belongsTo(models.AcademicYear, { foreignKey: "academic_year_id", as: "academic_year" });
  FeeVoucher.belongsTo(models.Class, { foreignKey: "class_id", as: "class" });
  FeeVoucher.belongsTo(models.Section, { foreignKey: "section_id", as: "section" });
};

export default FeeVoucher;
