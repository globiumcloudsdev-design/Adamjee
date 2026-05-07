import { readFileSync } from "fs";
import { join } from "path";

const serviceAccountPath = join(process.cwd(), "adamjee-c9013-firebase-adminsdk-fbsvc-b3ab780cd1.json");

let admin = null;

try {
  const { default: firebaseAdmin } = await import("firebase-admin");
  admin = firebaseAdmin;
  
  if (!admin.apps.length) {
    const serviceAccount = JSON.parse(readFileSync(serviceAccountPath, "utf8"));
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
    console.log("✅ Firebase Admin initialized successfully");
  } else {
    // App already initialized (e.g. after hot reload) — keep admin as the module reference
    // DO NOT do: admin = admin.app() — that returns an App instance, not the module,
    // which breaks admin.messaging() calls in NotificationService.
    console.log("✅ Firebase Admin already initialized, reusing existing app");
  }
} catch (error) {
  console.error("⚠️ Firebase Admin could not be loaded:", error.message);
}

export default admin;
