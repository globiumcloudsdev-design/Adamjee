import { Sequelize, DataTypes, Op } from "sequelize";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, ".env.local") });

const dbUrl = process.env.DATABASE_URL;
if (!dbUrl) {
    console.error("DATABASE_URL not found");
    process.exit(1);
}

const sequelize = new Sequelize(dbUrl, {
    logging: console.log,
    dialect: "postgres",
    dialectOptions: { ssl: { require: true, rejectUnauthorized: false } }
});

async function createTable() {
    try {
        await sequelize.authenticate();

        // Define the model to match the migration
        const Policy = sequelize.define("Policy", {
            id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
            branch_id: { type: DataTypes.UUID, allowNull: true },
            policy_type: {
                type: DataTypes.ENUM("id_card", "payroll", "attendance", "leave", "exam", "fee", "transport", "hostel", "library", "hr", "academic", "it", "security"),
                allowNull: false
            },
            policy_name: { type: DataTypes.STRING(255), allowNull: false },
            description: { type: DataTypes.TEXT, allowNull: true },
            config: { type: DataTypes.JSONB, allowNull: false, defaultValue: {} },
            is_active: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
            version: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 1 },
            created_by: { type: DataTypes.UUID, allowNull: false },
            updated_by: { type: DataTypes.UUID, allowNull: true },
        }, {
            tableName: "policies",
            underscored: true,
            timestamps: true,
            paranoid: true
        });

        await sequelize.sync({ alter: true });
        console.log("✅ Policies table created/synced successfully");

    } catch (error) {
        console.error("❌ Failed to create table:", error);
    } finally {
        await sequelize.close();
        process.exit(0);
    }
}

createTable();
