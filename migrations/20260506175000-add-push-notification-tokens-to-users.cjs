'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('users', 'push_token', {
      type: Sequelize.STRING,
      allowNull: true,
      comment: 'Primary Expo/FCM push token'
    });
    await queryInterface.addColumn('users', 'fcm_tokens', {
      type: Sequelize.JSONB,
      defaultValue: [],
      comment: 'Array of tokens for multiple devices'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('users', 'push_token');
    await queryInterface.removeColumn('users', 'fcm_tokens');
  }
};
