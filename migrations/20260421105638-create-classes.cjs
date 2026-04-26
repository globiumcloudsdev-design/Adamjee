// migrations/20260421-create-classes.js
'use strict';
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('classes', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
      name: { type: Sequelize.STRING, allowNull: false },
      group_id: { 
        type: Sequelize.UUID, 
        allowNull: false, 
        references: { model: 'groups', key: 'id' },
        onDelete: 'CASCADE' 
      },
      branch_id: { type: Sequelize.UUID, allowNull: false, references: { model: 'branches', key: 'id' } },
      academic_year_id: { 
        type: Sequelize.UUID, 
        allowNull: true, // Optional as requested
        references: { model: 'academic_years', key: 'id' } 
      },
      is_active: { type: Sequelize.BOOLEAN, defaultValue: true },
      created_by: { type: Sequelize.UUID, allowNull: false },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false },
      deleted_at: { type: Sequelize.DATE }
    });
  },
  down: async (queryInterface) => { await queryInterface.dropTable('classes'); }
};