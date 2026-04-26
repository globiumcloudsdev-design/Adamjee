import { DataTypes } from "sequelize";
import sequelize from "../../config/database.js";

const Branch = sequelize.define(
  "Branch",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },

    // Basic Info
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: {
        notEmpty: { msg: "Branch name is required" },
      },
    },
    code: {
      type: DataTypes.STRING(20),
      allowNull: false,
      unique: true,
      uppercase: true,
      validate: {
        notEmpty: { msg: "Branch code is required" },
      },
    },

    // Address as JSONB object (street, city, state, zipCode, country)
    address: {
      type: DataTypes.JSONB,
      defaultValue: {},
      comment: "{ street, city, state, zipCode, country }",
      validate: {
        isValidAddress(value) {
          if (value && typeof value !== "object")
            throw new Error("Address must be an object");
        },
      },
    },

    // Contact as JSONB object (phone, email)
    contact: {
      type: DataTypes.JSONB,
      defaultValue: {},
      comment: "{ phone, email }",
    },

    // Geo location (for maps)
    location: {
      type: DataTypes.JSONB,
      defaultValue: {},
      comment: "{ latitude, longitude, address }",
    },

    // Bank accounts array
    // field: 'bankAccounts' overrides underscored:true — DB column is camelCase (from migration)
    bankAccounts: {
      type: DataTypes.JSONB,
      defaultValue: [],
      field: 'bankAccounts',
      comment: "[{ accountTitle, serviceName, accountNo, iban, isDefault }]",
    },

    // Reference to admin user (Branch Admin)
    admin_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: { model: "users", key: "id" },
      onDelete: "SET NULL",
      comment: "FK to users.id – Branch Admin assigned to this branch",
    },

    // Status (active/inactive) – using boolean for consistency with User model
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },

    // Branch settings (any custom settings)
    settings: {
      type: DataTypes.JSONB,
      defaultValue: {},
      comment: "Timings, fee structure, holidays, etc.",
    },

    // Audit fields
    created_by: {
      type: DataTypes.UUID,
      allowNull: true,
      comment: "User ID who created this branch (usually SUPER_ADMIN)",
    },
    updated_by: {
      type: DataTypes.UUID,
      allowNull: true,
      comment: "User ID who last updated this branch",
    },
  },
  {
    tableName: "branches",
    timestamps: true,
    underscored: true,
    paranoid: true, // soft delete (deleted_at)
    indexes: [
      { fields: ["code"] },
      { fields: ["is_active"] },
      { fields: ["admin_id"] },
    ],
  },
);

// ==================== Associations ====================
Branch.associate = (models) => {
  // Branch belongs to an admin (User)
  Branch.belongsTo(models.User, { foreignKey: "admin_id", as: "admin" });
  // Branch has many users (students, teachers, staff)
  Branch.hasMany(models.User, { foreignKey: "branch_id", as: "users" });
  // Creator and updater
  Branch.belongsTo(models.User, { foreignKey: "created_by", as: "creator" });
  Branch.belongsTo(models.User, { foreignKey: "updated_by", as: "updater" });
  Branch.hasMany(models.AcademicYear, {
    foreignKey: "branch_id",
    as: "academic_years",
  });
  Branch.hasMany(models.Expense, {
    foreignKey: "branch_id",
    as: "expenses",
  });
};

// ==================== Instance Methods ====================
Branch.prototype.addBankAccount = function (accountData) {
  const accounts = this.bankAccounts || [];
  // If this is the first account or isDefault true, set others to false
  if (accountData.isDefault || accounts.length === 0) {
    accounts.forEach((acc) => (acc.isDefault = false));
    accountData.isDefault = true;
  }
  accounts.push(accountData);
  return this.update({ bankAccounts: accounts });
};

Branch.prototype.setDefaultBankAccount = function (accountIndex) {
  const accounts = this.bankAccounts || [];
  if (!accounts[accountIndex]) return false;
  accounts.forEach((acc, idx) => (acc.isDefault = idx === accountIndex));
  return this.update({ bankAccounts: accounts });
};

export default Branch;
