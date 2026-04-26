"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // 1. Rename Column
    const tableInfo = await queryInterface.describeTable('academic_years');
    if (tableInfo.is_active && !tableInfo.is_current) {
      await queryInterface.renameColumn('academic_years', 'is_active', 'is_current');
    }

    // 2. Update Constraints
    // Note: This tries to remove the old unique constraint on 'name' if it exists
    // and add a new composite unique constraint on ['name', 'branch_id']
    try {
      await queryInterface.removeConstraint('academic_years', 'academic_years_name_key');
    } catch (e) {
      // Might have a different name or not exist
      console.log("Could not remove academic_years_name_key, skipping...");
    }

    await queryInterface.addIndex('academic_years', ['name', 'branch_id'], {
      unique: true,
      name: 'academic_years_name_branch_id_unique'
    });
  },

  down: async (queryInterface, Sequelize) => {
    // 1. Revert Constraints
    try {
      await queryInterface.removeIndex('academic_years', 'academic_years_name_branch_id_unique');
    } catch (e) {}

    // 2. Revert Column Name
    const tableInfo = await queryInterface.describeTable('academic_years');
    if (tableInfo.is_current && !tableInfo.is_active) {
      await queryInterface.renameColumn('academic_years', 'is_current', 'is_active');
    }
  }
};
