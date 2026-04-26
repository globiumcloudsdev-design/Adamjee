"use strict";

module.exports = {
    up: async (queryInterface, Sequelize) => {
        await queryInterface.createTable("staff_attendances", {
            id: {
                type: Sequelize.UUID,
                defaultValue: Sequelize.UUIDV4,
                primaryKey: true,
            },
            branch_id: {
                type: Sequelize.UUID,
                allowNull: true,
                references: { model: "branches", key: "id" },
                onDelete: "SET NULL",
            },
            staff_id: {
                type: Sequelize.UUID,
                allowNull: false,
                references: { model: "users", key: "id" },
                onDelete: "CASCADE",
            },
            date: {
                type: Sequelize.DATEONLY,
                allowNull: false,
            },
            status: {
                type: Sequelize.ENUM(
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
                type: Sequelize.DATE,
                allowNull: true,
            },
            check_out: {
                type: Sequelize.DATE,
                allowNull: true,
            },
            late_minutes: {
                type: Sequelize.INTEGER,
                defaultValue: 0,
            },
            early_exit_minutes: {
                type: Sequelize.INTEGER,
                defaultValue: 0,
            },
            overtime_minutes: {
                type: Sequelize.INTEGER,
                defaultValue: 0,
            },
            leave_type_id: {
                type: Sequelize.UUID,
                allowNull: true,
            },
            leave_request_id: {
                type: Sequelize.UUID,
                allowNull: true,
            },
            remarks: {
                type: Sequelize.TEXT,
                allowNull: true,
            },
            marked_by: {
                type: Sequelize.UUID,
                allowNull: false,
                references: { model: "users", key: "id" },
                onDelete: "RESTRICT",
            },
            updated_by: {
                type: Sequelize.UUID,
                allowNull: true,
                references: { model: "users", key: "id" },
                onDelete: "SET NULL",
            },
            created_at: {
                type: Sequelize.DATE,
                allowNull: false,
                defaultValue: Sequelize.NOW,
            },
            updated_at: {
                type: Sequelize.DATE,
                allowNull: false,
                defaultValue: Sequelize.NOW,
            },
            deleted_at: {
                type: Sequelize.DATE,
                allowNull: true,
            },
        });

        await queryInterface.addIndex("staff_attendances", ["staff_id"]);
        await queryInterface.addIndex("staff_attendances", ["branch_id"]);
        await queryInterface.addIndex("staff_attendances", ["date"]);
        await queryInterface.addIndex("staff_attendances", ["status"]);
        await queryInterface.addIndex("staff_attendances", ["branch_id", "date"]);
        await queryInterface.addIndex("staff_attendances", ["staff_id", "date"], {
            unique: true,
            name: "staff_attendances_staff_date_unique",
        });
    },

    down: async (queryInterface) => {
        await queryInterface.dropTable("staff_attendances");
        await queryInterface.sequelize.query(
            'DROP TYPE IF EXISTS "enum_staff_attendances_status";'
        );
    },
};
