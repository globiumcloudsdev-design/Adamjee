"use strict";

module.exports = {
    up: async (queryInterface, Sequelize) => {
        await queryInterface.addColumn("attendances", "leave_request_id", {
            type: Sequelize.UUID,
            allowNull: true,
            references: { model: "leave_requests", key: "id" },
            onDelete: "SET NULL",
        });
    },

    down: async (queryInterface) => {
        await queryInterface.removeColumn("attendances", "leave_request_id");
    },
};
