'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('fee_vouchers', 'paid_amount', {
      type: Sequelize.DECIMAL(10, 2),
      defaultValue: 0,
      allowNull: false
    });
    await queryInterface.addColumn('fee_vouchers', 'payment_history', {
      type: Sequelize.JSONB,
      defaultValue: [],
      allowNull: false
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('fee_vouchers', 'paid_amount');
    await queryInterface.removeColumn('fee_vouchers', 'payment_history');
  }
};
