'use strict';

const { DataTypes } = require('sequelize');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // 1. Create ENUM types
    await queryInterface.sequelize.query(`
      CREATE TYPE "enum_users_role" AS ENUM ('SUPER_ADMIN', 'BRANCH_ADMIN', 'TEACHER', 'STUDENT', 'STAFF');
    `);
    await queryInterface.sequelize.query(`
      CREATE TYPE "enum_users_staff_sub_type" AS ENUM ('Accountant', 'Clerk', 'Librarian', 'Peon', 'Security', 'Other');
    `);

    // 2. Create users table
    await queryInterface.createTable('users', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      role: {
        type: Sequelize.ENUM('SUPER_ADMIN', 'BRANCH_ADMIN', 'TEACHER', 'STUDENT', 'STAFF'),
        allowNull: false,
        defaultValue: 'STUDENT',
      },
      staff_sub_type: {
        type: Sequelize.ENUM('Accountant', 'Clerk', 'Librarian', 'Peon', 'Security', 'Other'),
        allowNull: true,
      },
      first_name: {
        type: Sequelize.STRING(100),
        allowNull: false,
      },
      last_name: {
        type: Sequelize.STRING(100),
        allowNull: false,
      },
      email: {
        type: Sequelize.STRING,
        allowNull: true,
        unique: true,
      },
      phone: {
        type: Sequelize.STRING(20),
        allowNull: false,
        unique: true,
      },
      registration_no: {
        type: Sequelize.STRING(50),
        allowNull: true,
        unique: true,
      },
      password_hash: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      plain_password: {
        type: Sequelize.STRING,
        allowNull: true,
        comment: '⚠️ Dev only',
      },
      permissions: {
        type: Sequelize.JSONB,
        defaultValue: [],
      },
      details: {
        type: Sequelize.JSONB,
        defaultValue: {},
      },
      avatar_url: {
        type: Sequelize.STRING,
      },
      qr_code_url: {
        type: Sequelize.STRING,
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
      },
      last_login_at: {
        type: Sequelize.DATE,
      },
      created_by: {
        type: Sequelize.UUID,
      },
      updated_by: {
        type: Sequelize.UUID,
      },
      documents: {
        type: Sequelize.JSONB,
        defaultValue: [],
      },
      password_reset_token: {
        type: Sequelize.STRING,
      },
      password_reset_expires: {
        type: Sequelize.DATE,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
      },
      deleted_at: {
        type: Sequelize.DATE,
      },
    });

    // 3. Add indexes
    await queryInterface.addIndex('users', ['role']);
    await queryInterface.addIndex('users', ['email']);
    await queryInterface.addIndex('users', ['phone']);
    await queryInterface.addIndex('users', ['registration_no']);
    await queryInterface.addIndex('users', ['deleted_at']);
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable('users');
    // Drop ENUM types
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_users_role";');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_users_staff_sub_type";');
  },
};