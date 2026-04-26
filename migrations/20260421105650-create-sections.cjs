// migrations/20260421-create-sections.js
'use strict';
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('sections', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
      name: { type: Sequelize.STRING, allowNull: false },
      class_id: { 
        type: Sequelize.UUID, 
        allowNull: false, 
        references: { model: 'classes', key: 'id' },
        onDelete: 'CASCADE' 
      },
      capacity: { type: Sequelize.INTEGER, defaultValue: 40 },
      is_active: { type: Sequelize.BOOLEAN, defaultValue: true },
      created_by: { type: Sequelize.UUID, allowNull: false },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false },
      deleted_at: { type: Sequelize.DATE }
    });
  },
  down: async (queryInterface) => { await queryInterface.dropTable('sections'); }
};