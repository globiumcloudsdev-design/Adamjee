"use client";

import { useEffect } from "react";
import { requestForToken, onForegroundMessage } from "@/lib/firebase";
import apiClient from "@/lib/api-client";
import { toast } from "sonner";

export default function NotificationHandler() {
  useEffect(() => {
    let unsubscribe = null;

    const setupNotifications = async () => {
      try {
        // 1. Request permission and get FCM token
        const token = await requestForToken();
        
        if (token) {
          console.log("FCM Token obtained, registering with backend...");
          
          // 2. Register token with backend
          try {
            await apiClient.post("/api/users/push-token", { token });
            console.log("✅ FCM token registered with backend");
          } catch (regError) {
            console.error("Failed to register FCM token with backend:", regError);
          }
        } else {
          console.warn("No FCM token obtained — notifications may not work. Check browser permissions.");
        }
      } catch (error) {
        console.error("Failed to setup notifications:", error);
      }

      // 3. Listen for ALL foreground messages (persistent listener)
      unsubscribe = onForegroundMessage((payload) => {
        console.log("📬 Foreground FCM message received:", payload);
        
        if (payload?.notification) {
          toast.success(payload.notification.title, {
            description: payload.notification.body,
            duration: 6000,
          });
        } else if (payload?.data?.title) {
          // Some FCM messages only have data payload (no notification key)
          toast.success(payload.data.title, {
            description: payload.data.body || payload.data.message || "",
            duration: 6000,
          });
        }
      });
    };

    setupNotifications();

    // Cleanup: unsubscribe from FCM listener on unmount
    return () => {
      if (unsubscribe && typeof unsubscribe === "function") {
        unsubscribe();
      }
    };
  }, []);

  return null; // This component doesn't render anything
}
