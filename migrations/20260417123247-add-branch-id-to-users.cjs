"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn("users", "branch_id", {
      type: Sequelize.UUID,
      allowNull: true,
      references: { model: "branches", key: "id" },
      onDelete: "SET NULL",
    });
    await queryInterface.addIndex("users", ["branch_id"]);
  },
  down: async (queryInterface) => {
    await queryInterface.removeColumn("users", "branch_id");
  },
};
