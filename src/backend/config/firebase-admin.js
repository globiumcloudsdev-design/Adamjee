import { readFileSync } from "fs";
import { join } from "path";

let admin = null;

try {
  const { default: firebaseAdmin } = await import("firebase-admin");
  admin = firebaseAdmin;
  
  if (!admin.apps.length) {
    // Check if we should use individual env variables (better for production)
    const serviceAccount = {
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    };

    if (serviceAccount.projectId && serviceAccount.clientEmail && serviceAccount.privateKey) {
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
      console.log("✅ Firebase Admin initialized with environment variables");
    } else {
      // Fallback to JSON file for local dev if file exists
      try {
        const { readFileSync } = await import("fs");
        const { join } = await import("path");
        const serviceAccountPath = join(process.cwd(), "adamjee-c9013-firebase-adminsdk-fbsvc-b3ab780cd1.json");
        const fileContent = JSON.parse(readFileSync(serviceAccountPath, "utf8"));
        admin.initializeApp({
          credential: admin.credential.cert(fileContent),
        });
        console.log("✅ Firebase Admin initialized with service account file");
      } catch (fileError) {
        console.error("⚠️ Firebase Admin: No credentials found in ENV or JSON file");
      }
    }
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
