import { DataTypes } from "sequelize";
import sequelize from "../../config/database.js";

const LeaveRequest = sequelize.define(
  "LeaveRequest",
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
    student_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: "users", key: "id" },
      onDelete: "CASCADE",
    },
    start_date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    end_date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    reason: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM("PENDING", "APPROVED", "REJECTED"),
      defaultValue: "PENDING",
      allowNull: false,
    },
    approved_by: {
      type: DataTypes.UUID,
      allowNull: true,
      references: { model: "users", key: "id" },
    },
  },
  {
    tableName: "leave_requests",
    timestamps: true,
    underscored: true,
    paranoid: false,
    indexes: [
      { fields: ["student_id"] },
      { fields: ["branch_id"] },
      { fields: ["status"] },
    ],
  }
);

LeaveRequest.associate = (models) => {
  LeaveRequest.belongsTo(models.User, {
    foreignKey: "student_id",
    as: "student",
  });
  LeaveRequest.belongsTo(models.Branch, {
    foreignKey: "branch_id",
    as: "branch",
  });
  LeaveRequest.belongsTo(models.User, {
    foreignKey: "approved_by",
    as: "approver",
  });
};

export default LeaveRequest;
