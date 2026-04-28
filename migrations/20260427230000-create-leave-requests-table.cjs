"use strict";

module.exports = {
    up: async (queryInterface, Sequelize) => {
        await queryInterface.createTable("leave_requests", {
            id: {
                type: Sequelize.UUID,
                defaultValue: Sequelize.UUIDV4,
                primaryKey: true,
            },
            branch_id: {
                type: Sequelize.UUID,
                allowNull: false,
                references: { model: "branches", key: "id" },
                onDelete: "CASCADE",
            },
            student_id: {
                type: Sequelize.UUID,
                allowNull: false,
                references: { model: "users", key: "id" },
                onDelete: "CASCADE",
            },
            start_date: {
                type: Sequelize.DATEONLY,
                allowNull: false,
            },
            end_date: {
                type: Sequelize.DATEONLY,
                allowNull: false,
            },
            reason: {
                type: Sequelize.TEXT,
                allowNull: true,
            },
            status: {
                type: Sequelize.ENUM("PENDING", "APPROVED", "REJECTED"),
                defaultValue: "PENDING",
                allowNull: false,
            },
            approved_by: {
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
        });

        await queryInterface.addIndex("leave_requests", ["student_id"]);
        await queryInterface.addIndex("leave_requests", ["branch_id"]);
        await queryInterface.addIndex("leave_requests", ["status"]);
    },

    down: async (queryInterface) => {
        await queryInterface.dropTable("leave_requests");
        await queryInterface.sequelize.query(
            'DROP TYPE IF EXISTS "enum_leave_requests_status";'
        );
    },
};
