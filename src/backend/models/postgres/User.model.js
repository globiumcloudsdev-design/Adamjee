// backend/src/models/User.model.js
import { DataTypes } from "sequelize";
import sequelize from "../../config/database.js";
import bcrypt from "bcryptjs";
import { v4 as uuidv4 } from "uuid";

const User = sequelize.define(
  "User",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },

    // Role with BRANCH_ADMIN
    role: {
      type: DataTypes.ENUM(
        "SUPER_ADMIN",
        "BRANCH_ADMIN",
        "TEACHER",
        "STUDENT",
        "STAFF",
      ),
      allowNull: false,
      defaultValue: "STUDENT",
      comment: "SUPER_ADMIN = owner, BRANCH_ADMIN = branch manager",
    },

    // Optional sub-type for STAFF
    staff_sub_type: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },

    // Basic info
    first_name: { type: DataTypes.STRING(100), allowNull: true },
    last_name: { type: DataTypes.STRING(100), allowNull: true },
    email: {
      type: DataTypes.STRING,
      allowNull: true,
      unique: true,
      validate: { isEmail: true },
    },
    phone: { type: DataTypes.STRING(20), allowNull: false, unique: true },

    // Student login credential
    registration_no: {
      type: DataTypes.STRING(50),
      unique: true,
      comment: "For STUDENT login",
    },

    // ✅ Branch ID (foreign key to branches table)
    branch_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: { model: "branches", key: "id" },
      onDelete: "SET NULL",
      comment: "FK to branches.id – which branch this user belongs to",
    },

    // Password fields
    password_hash: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    plain_password: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: "⚠️ INSECURE: Dev/testing only",
    },

    // Permissions array
    permissions: {
      type: DataTypes.JSONB,
      defaultValue: [],
    },

    // Polymorphic details
    details: {
      type: DataTypes.JSONB,
      defaultValue: {},
      comment: `{
        student: { class: "10th", roll_no: 24, parent_phone: "..." },
        teacher: { subject: "Math", qualification: "M.Sc" },
        staff: { salary: 25000, joining_date: "2025-01-01" },
        branch_admin: { managed_branch_id: "uuid" }
      }`,
    },

    avatar_url: { type: DataTypes.STRING },
    qr_code_url: { type: DataTypes.STRING },

    is_active: { type: DataTypes.BOOLEAN, defaultValue: true },
    last_login_at: { type: DataTypes.DATE },

    created_by: { type: DataTypes.UUID },
    updated_by: { type: DataTypes.UUID },

    documents: {
      type: DataTypes.JSONB,
      defaultValue: [],
      comment:
        '[{ id: "uuid", type: "id_card", url: "...", uploaded_at: "..." }]',
    },

    password_reset_token: { type: DataTypes.STRING },
    password_reset_expires: { type: DataTypes.DATE },
  },
  {
    tableName: "users",
    timestamps: true,
    underscored: true,
    paranoid: true,
    defaultScope: {
      attributes: {
        exclude: [
          "password_hash",
          "plain_password",
          "password_reset_token",
          "password_reset_expires",
        ],
      },
    },
    scopes: {
      withPassword: { attributes: { include: ["password_hash"] } },
      withPlainPassword: { attributes: { include: ["plain_password"] } },
    },
    indexes: [
      { fields: ["role"] },
      { fields: ["email"] },
      { fields: ["phone"] },
      { fields: ["registration_no"] },
      { fields: ["branch_id"] }, // ✅ index on branch_id
    ],
  },
);

// Hooks: store plain password, then hash
User.beforeCreate(async (user) => {
  if (user.password_hash) {
    if (!user.plain_password) user.plain_password = user.password_hash;
    user.password_hash = await bcrypt.hash(user.password_hash, 10);
  }
});
User.beforeUpdate(async (user) => {
  if (user.changed("password_hash")) {
    if (!user.plain_password && user.password_hash)
      user.plain_password = user.password_hash;
    user.password_hash = await bcrypt.hash(user.password_hash, 10);
  }
});

// Instance method: compare password
User.prototype.comparePassword = async function (plainPassword) {
  return bcrypt.compare(plainPassword, this.password_hash);
};

// Helper: add document
User.prototype.addDocument = function (docType, url, filename) {
  const docs = this.documents || [];
  docs.push({
    id: uuidv4(),
    type: docType,
    url,
    filename,
    uploaded_at: new Date(),
  });
  return this.update({ documents: docs });
};

// Role-based permissions
User.prototype.getPermissions = async function () {
  if (this.role === "SUPER_ADMIN") return ["*"];
  const rolePermissions = {
    BRANCH_ADMIN: [
      "view_branch_reports",
      "manage_branch_staff",
      "view_students",
    ],
    TEACHER: ["view_students", "mark_attendance", "add_marks"],
    STAFF: ["view_reports", "manage_fees"],
    STUDENT: ["view_profile", "view_attendance", "view_marks"],
  };
  return rolePermissions[this.role] || [];
};

// Associations
User.associate = (models) => {
  User.belongsTo(models.Branch, { foreignKey: "branch_id", as: "branch" });
  User.belongsTo(models.User, { foreignKey: "created_by", as: "creator" });
  User.belongsTo(models.User, { foreignKey: "updated_by", as: "updater" });
  // other associations...
};

export default User;
