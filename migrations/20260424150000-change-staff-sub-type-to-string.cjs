'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Change staff_sub_type from ENUM to STRING
    await queryInterface.changeColumn('users', 'staff_sub_type', {
      type: Sequelize.STRING(100),
      allowNull: true
    });

    // Make last_name optional
    await queryInterface.changeColumn('users', 'last_name', {
      type: Sequelize.STRING(100),
      allowNull: true
    });

    // Make phone optional
    await queryInterface.changeColumn('users', 'phone', {
      type: Sequelize.STRING(20),
      allowNull: true
    });
  },

  async down(queryInterface, Sequelize) {
    // Revert back to ENUM if needed (not recommended as it's restrictive)
    await queryInterface.changeColumn('users', 'staff_sub_type', {
      type: Sequelize.ENUM('Accountant', 'Clerk', 'Librarian', 'Peon', 'Security', 'Other'),
      allowNull: true
    });
  }
};
