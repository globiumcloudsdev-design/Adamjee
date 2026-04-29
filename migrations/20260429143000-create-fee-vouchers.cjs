'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('fee_vouchers', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      voucher_no: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
      },
      student_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      branch_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'branches',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      academic_year_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'academic_years',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      class_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'classes',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      section_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'sections',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      amount_due: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
      },
      fine_amount: {
        type: Sequelize.DECIMAL(10, 2),
        defaultValue: 0,
      },
      due_date: {
        type: Sequelize.DATEONLY,
        allowNull: false,
      },
      paid_date: {
        type: Sequelize.DATEONLY,
        allowNull: true,
      },
      status: {
        type: Sequelize.ENUM("UNPAID", "PAID", "PARTIAL", "OVERDUE"),
        defaultValue: "UNPAID",
      },
      fee_type: {
        type: Sequelize.ENUM("Monthly", "LumpSum", "Installment"),
        allowNull: false,
      },
      installment_no: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      total_installments: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      month: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      payable_after_due_date: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: true,
      },
      remarks: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      created_by: {
        type: Sequelize.UUID,
        allowNull: false,
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE,
      },
      updated_at: {
        allowNull: false,
        type: Sequelize.DATE,
      },
      deleted_at: {
        type: Sequelize.DATE,
      },
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('fee_vouchers');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_fee_vouchers_status";');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_fee_vouchers_fee_type";');
  }
};
