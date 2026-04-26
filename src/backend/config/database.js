/**
 * Coaching Management System - PostgreSQL Database Config
 * Sequelize ORM with connection pooling, retry logic, soft deletes
 * Supports NeonDB via DATABASE_URL (overrides individual DB config)
 */

import { Sequelize } from "sequelize";
import pg from "pg";
import config from "./index.js";
import logger from "./logger.js";

// Shared Sequelize options (uses config.database.pool + underscored/paranoid)
const sharedOptions = {
  dialect: config.database.dialect || "postgres",
  dialectModule: pg,
  pool: config.database.pool,
  logging: config.isDevelopment ? (msg) => logger.debug(msg) : false,
  define: {
    timestamps: true,
    underscored: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
    deletedAt: "deleted_at",
    paranoid: true, // Soft deletes
  },
};

/**
 * Parse DATABASE_URL manually to handle URL-encoded characters (e.g., %20 in password)
 */
const _parseDbUrl = (rawUrl) => {
  const url = new URL(rawUrl);
  return {
    database: decodeURIComponent(url.pathname.slice(1)),
    username: decodeURIComponent(url.username),
    password: decodeURIComponent(url.password),
    host: url.hostname,
    port: parseInt(url.port, 10) || 5432,
  };
};

/**
 * Create Sequelize instance – prefer DATABASE_URL (NeonDB) else fallback to individual config
 */
const getSequelizeInstance = () => {
  if (process.env.DATABASE_URL) {
    const db = _parseDbUrl(process.env.DATABASE_URL);
    logger.info("🔌 Using DATABASE_URL for NeonDB connection");
    return new Sequelize(db.database, db.username, db.password, {
      ...sharedOptions,
      host: db.host,
      port: db.port,
      dialectOptions: {
        ssl: { require: true, rejectUnauthorized: false },
        keepAlive: true,
        keepAliveInitialDelayMillis: 10000,
      },
    });
  }

  // Fallback to individual config vars (for local development)
  logger.info("🔌 Using individual DB config (no DATABASE_URL)");
  return new Sequelize(
    config.database.name,
    config.database.user,
    config.database.password,
    {
      ...sharedOptions,
      host: config.database.host,
      port: config.database.port,
      dialectOptions: {
        ssl: config.isProduction
          ? { require: true, rejectUnauthorized: false }
          : false,
      },
    },
  );
};

const sequelize = getSequelizeInstance();

/**
 * Test database connection on startup
 */
export const testConnection = async () => {
  try {
    await sequelize.authenticate();
    logger.info("✅ PostgreSQL (NeonDB) connected successfully");
  } catch (error) {
    logger.error("❌ PostgreSQL connection failed:", error);
    throw error;
  }
};

/**
 * Sync database schema – alters existing tables to match models.
 * @param {object} options Sequelize sync options (default: { alter: true, force: false })
 */
export const syncDatabase = async (options = {}) => {
  try {
    const syncOptions = { force: false, alter: true, ...options };
    await sequelize.sync(syncOptions);
    logger.info("✅ Database schema synced");
  } catch (error) {
    logger.error("❌ Database sync failed:", error);
    throw error;
  }
};

/**
 * Optional: Run any custom raw SQL migrations (e.g., fix constraints, indexes)
 */
export const runMigrations = async () => {
  try {
    // Example: Ensure foreign key constraints after schema changes
    // await sequelize.query(`ALTER TABLE users ADD CONSTRAINT ...`);
    logger.info("✅ Custom migrations completed (if any)");
  } catch (error) {
    logger.error("⚠️ Migration warning:", error.message);
  }
};

export { sequelize };
export default sequelize;
