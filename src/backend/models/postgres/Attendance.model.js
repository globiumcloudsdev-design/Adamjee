import { DataTypes } from "sequelize";
import sequelize from "../../config/database.js";

const Attendance = sequelize.define(
  "Attendance",
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
    date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM("PRESENT", "ABSENT", "LATE", "LEAVE", "HOLIDAY"),
      defaultValue: "PRESENT",
      allowNull: false,
    },
    remarks: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    marked_by: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: "users", key: "id" },
      onDelete: "RESTRICT",
    },
    leave_request_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: { model: "leave_requests", key: "id" },
      onDelete: "SET NULL",
    },
    updated_by: {
      type: DataTypes.UUID,
      allowNull: true,
      references: { model: "users", key: "id" },
      onDelete: "SET NULL",
    },
  },
  {
    tableName: "attendances",
    timestamps: true,
    underscored: true,
    paranoid: false,
    indexes: [

      { fields: ["student_id"] },
      { fields: ["branch_id"] },
      { fields: ["date"] },
      { fields: ["status"] },
      { fields: ["branch_id", "date"] },
      { unique: true, fields: ["student_id", "date"] }, // Prevent duplicate student attendance on same day
    ],
  }
);

Attendance.associate = (models) => {
  Attendance.belongsTo(models.User, { foreignKey: "student_id", as: "student" });
  Attendance.belongsTo(models.User, { foreignKey: "marked_by", as: "marker" });
  Attendance.belongsTo(models.User, { foreignKey: "updated_by", as: "updater" });
  Attendance.belongsTo(models.Branch, { foreignKey: "branch_id", as: "branch" });
  Attendance.belongsTo(models.LeaveRequest, { foreignKey: "leave_request_id", as: "leave_request" });
};

export default Attendance;
