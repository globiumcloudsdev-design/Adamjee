"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.query(
      "ALTER TYPE \"enum_notifications_type\" ADD VALUE IF NOT EXISTS 'announcement';",
    );
  },

  down: async (queryInterface, Sequelize) => {
    // Removing a value from an existing PostgreSQL enum is not supported directly.
    // This migration is effectively irreversible without recreating the enum type.
  },
};
