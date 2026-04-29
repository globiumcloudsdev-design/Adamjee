import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, "../../../.env.local") });

import sequelize from "../config/database.js";
import "../models/postgres/index.js";

async function sync() {
  try {
    console.log("Starting database sync...");
    await sequelize.sync({ alter: true });
    console.log("Database synchronized successfully!");
    process.exit(0);
  } catch (err) {
    console.error("Database sync failed:", err);
    process.exit(1);
  }
}

sync();
