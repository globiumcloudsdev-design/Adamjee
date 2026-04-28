"use strict";

module.exports = {
    up: async (queryInterface, Sequelize) => {
        await queryInterface.createTable("attendances", {
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
            date: {
                type: Sequelize.DATEONLY,
                allowNull: false,
            },
            status: {
                type: Sequelize.ENUM("PRESENT", "ABSENT", "LATE", "LEAVE", "HOLIDAY"),
                defaultValue: "PRESENT",
                allowNull: false,
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
        });

        await queryInterface.addIndex("attendances", ["student_id"]);
        await queryInterface.addIndex("attendances", ["branch_id"]);
        await queryInterface.addIndex("attendances", ["date"]);
        await queryInterface.addIndex("attendances", ["status"]);
        await queryInterface.addIndex("attendances", ["branch_id", "date"]);
        await queryInterface.addIndex("attendances", ["student_id", "date"], {
            unique: true,
            name: "attendances_student_date_unique",
        });
    },

    down: async (queryInterface) => {
        await queryInterface.dropTable("attendances");
        await queryInterface.sequelize.query(
            'DROP TYPE IF EXISTS "enum_attendances_status";'
        );
    },
};
