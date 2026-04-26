import { DataTypes, Op } from "sequelize";
import sequelize from "../../config/database.js";

export const POLICY_TYPES = [
  "id_card",
  "payroll",
 
  "weekly_off",
  "holiday",
  "event",
  "shift",
];

const Policy = sequelize.define(
  "Policy",
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
      onDelete: "SET NULL",
    },
    policy_type: {
      type: DataTypes.ENUM(...POLICY_TYPES),
      allowNull: false,
    },
    policy_name: {
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: {
        notEmpty: { msg: "Policy name is required" },
      },
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    config: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: {},
      validate: {
        isObject(value) {
          if (!value || typeof value !== "object" || Array.isArray(value)) {
            throw new Error("Policy config must be a JSON object");
          }
        },
      },
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    version: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
    },
    created_by: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    updated_by: {
      type: DataTypes.UUID,
      allowNull: true,
    },
  },
  {
    tableName: "policies",
    timestamps: true,
    underscored: true,
    paranoid: true,
    indexes: [
      { fields: ["branch_id"] },
      { fields: ["policy_type"] },
      { fields: ["is_active"] },
      { fields: ["branch_id", "policy_type", "is_active"] },
    ],
  }
);

Policy.associate = (models) => {
  Policy.belongsTo(models.Branch, { foreignKey: "branch_id", as: "branch" });
  Policy.belongsTo(models.User, { foreignKey: "created_by", as: "creator" });
  Policy.belongsTo(models.User, { foreignKey: "updated_by", as: "updater" });
};

Policy.beforeSave(async (policy, options) => {
  // If this policy is being set to active, deactivate other policies of the same type and branch
  if (policy.changed("is_active") && policy.is_active) {
    await policy.constructor.update(
      { is_active: false },
      {
        where: {
          id: { [Op.ne]: policy.id },
          branch_id: policy.branch_id || null,
          policy_type: policy.policy_type,
          is_active: true,
        },
        transaction: options.transaction,
        hooks: false, // Prevent recursion if hooks were enabled globally
      }
    );
  }

  if (!policy.isNewRecord && (policy.changed("config") || policy.changed("policy_name") || policy.changed("description") || policy.changed("branch_id") || policy.changed("policy_type"))) {
    policy.version = (policy.version || 1) + 1;
  }
});

export default Policy;
