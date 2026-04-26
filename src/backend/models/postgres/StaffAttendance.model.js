import { DataTypes } from "sequelize";
import sequelize from "../../config/database.js";

const StaffAttendance = sequelize.define(
    "StaffAttendance",
    {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        branch_id: {
            type: DataTypes.UUID,
            allowNull: true,
            references: { model: "branches", key: "id" },
            onDelete: "SET NULL",
        },
        staff_id: {
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
            type: DataTypes.ENUM(
                "PRESENT",
                "ABSENT",
                "LATE",
                "LEAVE",
                "HOLIDAY",
                "WEEKEND",
                "HALF_DAY"
            ),
            defaultValue: "PRESENT",
            allowNull: false,
        },
        check_in: {
            type: DataTypes.DATE,
            allowNull: true,
        },
        check_out: {
            type: DataTypes.DATE,
            allowNull: true,
        },
        late_minutes: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
        },
        early_exit_minutes: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
        },
        overtime_minutes: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
        },
        leave_type_id: {
            type: DataTypes.UUID,
            allowNull: true,
        },
        leave_request_id: {
            type: DataTypes.UUID,
            allowNull: true,
        },
        remarks: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        marked_by: {
            type: DataTypes.UUID,
            allowNull: false,
            references: { model: "users", key: "id" },
        },
        updated_by: {
            type: DataTypes.UUID,
            allowNull: true,
            references: { model: "users", key: "id" },
        },
    },
    {
        tableName: "staff_attendances",
        timestamps: true,
        underscored: true,
        indexes: [
            { fields: ["staff_id"] },
            { fields: ["branch_id"] },
            { fields: ["date"] },
            { fields: ["status"] },
            { fields: ["branch_id", "date"] },
            { unique: true, fields: ["staff_id", "date"] }, // Prevent duplicate attendance for same staff on same day
        ],
    }
);

StaffAttendance.associate = (models) => {
    StaffAttendance.belongsTo(models.User, { foreignKey: "staff_id", as: "staff" });
    StaffAttendance.belongsTo(models.User, { foreignKey: "marked_by", as: "marker" });
    StaffAttendance.belongsTo(models.User, { foreignKey: "updated_by", as: "updater" });
    StaffAttendance.belongsTo(models.Branch, { foreignKey: "branch_id", as: "branch" });
};

export default StaffAttendance;
