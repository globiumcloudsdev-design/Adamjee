"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const tableInfo = await queryInterface.describeTable("users");
    if (!tableInfo.branch_id) {
      await queryInterface.addColumn("users", "branch_id", {
        type: Sequelize.UUID,
        allowNull: true,
        references: { model: "branches", key: "id" },
        onDelete: "SET NULL",
      });
      await queryInterface.addIndex("users", ["branch_id"]);
    }
  },
  down: async (queryInterface) => {
    const tableInfo = await queryInterface.describeTable("users");
    if (tableInfo.branch_id) {
      await queryInterface.removeColumn("users", "branch_id");
    }
  },
};
