"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable("notifications", {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      branch_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: { model: "branches", key: "id" },
        onDelete: "CASCADE",
      },
      title: { type: Sequelize.STRING(200), allowNull: false },
      message: { type: Sequelize.TEXT, allowNull: false },
      type: {
        type: Sequelize.ENUM(
          "fee_due",
          "attendance",
          "exam",
          "result",
          "event",
          "general",
          "alert",
          "reminder",
        ),
        allowNull: false,
        defaultValue: "general",
      },
      sent_by: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: "users", key: "id" },
      },
      recipients: { type: Sequelize.JSONB, defaultValue: [] },
      status: {
        type: Sequelize.ENUM("draft", "sent", "failed", "cancelled"),
        defaultValue: "sent",
      },
      sent_at: { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
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
    await queryInterface.addIndex("notifications", ["branch_id"]);
    await queryInterface.addIndex("notifications", ["sent_by"]);
    await queryInterface.addIndex("notifications", ["status"]);
    await queryInterface.addIndex("notifications", ["sent_at"]);
    await queryInterface.sequelize.query(`
      CREATE INDEX idx_notifications_recipients_gin ON notifications USING gin (recipients);
    `);
  },
  down: async (queryInterface) => {
    await queryInterface.dropTable("notifications");
    await queryInterface.sequelize.query(
      'DROP TYPE IF EXISTS "enum_notifications_type";',
    );
    await queryInterface.sequelize.query(
      'DROP TYPE IF EXISTS "enum_notifications_status";',
    );
  },
};
