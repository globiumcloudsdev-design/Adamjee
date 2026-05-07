import { DataTypes } from "sequelize";
import sequelize from "../../config/database.js";

const Notification = sequelize.define(
  "Notification",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    branch_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: { model: "branches", key: "id" },
      onDelete: "CASCADE",
      comment: "NULL = all branches, else specific branch",
    },
    title: {
      type: DataTypes.STRING(200),
      allowNull: false,
    },
    message: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    type: {
      type: DataTypes.ENUM(
        "fee_due",
        "attendance",
        "exam",
        "result",
        "event",
        "general",
        "alert",
        "reminder",
        "announcement",
      ),
      allowNull: false,
      defaultValue: "general",
    },
    sent_by: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: "users", key: "id" },
      comment: "User who sent this notification",
    },
    // recipients array: [{ userId: "uuid", isRead: boolean, readAt: "timestamp" }]
    recipients: {
      type: DataTypes.JSONB,
      defaultValue: [],
      comment: "Array of objects: { userId, isRead, readAt }",
    },
    status: {
      type: DataTypes.ENUM("draft", "sent", "failed", "cancelled"),
      defaultValue: "sent",
    },
    sent_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    tableName: "notifications",
    timestamps: true,
    underscored: true,
    paranoid: false,
    indexes: [
      { fields: ["branch_id"] },
      { fields: ["sent_by"] },
      { fields: ["status"] },
      { fields: ["sent_at"] },
      // GIN index on recipients JSONB for faster querying (e.g., find notifications where a specific user has isRead=false)
      {
        fields: ["recipients"],
        using: "gin",
      },
    ],
  },
);

// Instance method: mark a specific user as read
Notification.prototype.markAsRead = async function (userId) {
  const recipients = this.recipients || [];
  const index = recipients.findIndex((r) => r.userId === userId);
  if (index !== -1 && !recipients[index].isRead) {
    recipients[index].isRead = true;
    recipients[index].readAt = new Date();
    await this.update({ recipients });
  }
  return this;
};

// Instance method: check if a user has read this notification
Notification.prototype.isReadByUser = function (userId) {
  const recipients = this.recipients || [];
  const record = recipients.find((r) => r.userId === userId);
  return record ? record.isRead : false;
};

// Class method: get unread notifications for a user
Notification.getUnreadForUser = async function (userId, branchId = null) {
  const where = {
    status: "sent",
  };
  if (branchId) where.branch_id = branchId;
  const notifications = await this.findAll({ where });
  // Filter those where user is in recipients and isRead false
  return notifications.filter((n) => {
    const recipient = n.recipients?.find((r) => r.userId === userId);
    return recipient && !recipient.isRead;
  });
};

Notification.associate = (models) => {
  Notification.belongsTo(models.Branch, {
    foreignKey: "branch_id",
    as: "branch",
  });
  Notification.belongsTo(models.User, { foreignKey: "sent_by", as: "sender" });
};

// Temporary patch: Ensure 'announcement' value exists in the database ENUM type.
// This runs when the model is loaded by the application.
sequelize
  .query("ALTER TYPE \"enum_notifications_type\" ADD VALUE IF NOT EXISTS 'announcement';")
  .catch((err) => {
    // Ignore errors if the value already exists or if there are permission issues
    // logger.debug("Notification model enum update skipped: " + err.message);
  });

export default Notification;
