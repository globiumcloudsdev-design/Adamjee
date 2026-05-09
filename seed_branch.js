import sequelize from "./src/backend/config/database.js";
import { Branch } from "./src/backend/models/postgres/index.js";

async function seedBranch() {
  try {
    await sequelize.authenticate();
    console.log("Connected to DB");

    const newBranch = await Branch.create({
      name: "Campus 12(North Nazimabad Campus)",
      code: "C12-NN",
      address: {
        street: "C-26, Block I, Behind Imam Clinic, 5 Star Chowrangi",
        city: "Karachi",
        state: "Sindh",
        country: "Pakistan",
      },
      contact: {
        phone: "021-36633586 | 0333-2564886",
        whatsapp: "0300-2755421"
      },
      location: {
        latitude: 24.943913346713284,
        longitude: 67.0469414677241,
        address: "C-26, Block I, Behind Imam Clinic, 5 Star Chowrangi, North Nazimabad, Karachi",
        url: "https://goo.gl/maps/bfMWCf633szG18KfA"
      },
      is_active: true
    });

    console.log("Branch successfully created. ID:", newBranch.id);
  } catch (error) {
    console.error("Error seeding branch:", error);
  } finally {
    await sequelize.close();
  }
}

seedBranch();
