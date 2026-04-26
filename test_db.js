import { Sequelize } from "sequelize";
import dotenv from "dotenv";
dotenv.config({ path: ".env" });
const sequelize = new Sequelize(process.env.DATABASE_URL, { logging: false, dialect: "postgres" });
sequelize.query(`SELECT id FROM "users" WHERE role='STUDENT' LIMIT 1`).then(console.log).catch(console.error).finally(()=>process.exit(0));
