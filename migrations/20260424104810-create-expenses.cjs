"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // 1. Create ENUM type for status if it doesn't exist
    await queryInterface.sequelize.query(`
      DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_expenses_status') THEN
          CREATE TYPE "enum_expenses_status" AS ENUM ('pending', 'approved', 'paid', 'rejected');
        END IF;
      END $$;
    `);

    // 2. Create expenses table if it doesn't exist
    const tableExists = await queryInterface.sequelize.query(
      `SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'expenses');`,
      { type: Sequelize.QueryTypes.SELECT }
    );

    if (!tableExists[0].exists) {
      await queryInterface.createTable("expenses", {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      branch_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: "branches",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "SET NULL",
      },
      title: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      amount: {
        type: Sequelize.DECIMAL(15, 2),
        allowNull: false,
      },
      category: {
        type: Sequelize.STRING(100),
        allowNull: false,
      },
      vendor_name: {
        type: Sequelize.STRING(255),
        allowNull: true,
        comment: "Manual vendor name if not using",
      },
      date: {
        type: Sequelize.DATEONLY,
        allowNull: false,
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      rejection_reason: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      status: {
        type: "enum_expenses_status",
        defaultValue: "pending",
      },
    
      expense_number: {
        type: Sequelize.STRING(50),
        allowNull: false,
        unique: true,
        comment: "Auto-generated expense number like EXP-2026-00001",
      },
      created_by: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: "users",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
      },
      approved_by: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: "users",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "SET NULL",
      },
      approved_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      paid_by: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: "users",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "SET NULL",
      },
      paid_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      payment_reference: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
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
    });

      // 3. Add indexes (only on columns that actually exist)
      await queryInterface.addIndex("expenses", ["branch_id"]);
      await queryInterface.addIndex("expenses", ["category"]);
      await queryInterface.addIndex("expenses", ["status"]);
      await queryInterface.addIndex("expenses", ["date"]);
    }
    // Note: indexes on institute_id and vendor_id were omitted because those columns are missing from the model.
    // If you add them later, uncomment the lines below:
    // await queryInterface.addIndex('expenses', ['institute_id']);
    // await queryInterface.addIndex('expenses', ['vendor_id']);
    // await queryInterface.addIndex('expenses', ['institute_id', 'branch_id']);
  },

  down: async (queryInterface, Sequelize) => {
    // Drop the table if it exists
    await queryInterface.dropTable("expenses", { ifExists: true });
    // Drop the ENUM type if it exists
    await queryInterface.sequelize.query(`DROP TYPE IF EXISTS "enum_expenses_status";`);
  },
};
