import { Expo } from "expo-server-sdk";
import { Notification, User } from "../models/postgres/index.js";
import logger from "../config/logger.js";
import admin from "../config/firebase-admin.js";

const expo = new Expo();

class NotificationService {
  /**
   * Send notification to specific users
   * @param {Array} userIds - List of user UUIDs
   * @param {Object} data - { title, message, type, branchId, sentBy }
   */
  async sendToUsers(userIds, { title, message, type, branchId, sentBy }) {
    try {
      if (!userIds || userIds.length === 0) return null;

      // 1. Create recipients array for DB
      const recipients = userIds.map((id) => ({
        userId: id,
        isRead: false,
        readAt: null,
      }));

      // 2. Save to PostgreSQL
      const notification = await Notification.create({
        branch_id: branchId || null,
        title,
        message,
        type: type || "general",
        sent_by: sentBy,
        recipients,
        status: "sent",
        sent_at: new Date(),
      });

      // 3. Fetch push tokens for mobile notification
      const usersWithTokens = await User.findAll({
        where: { id: userIds },
        attributes: ["id", "push_token", "fcm_tokens"],
      });

      logger.info(`Found ${usersWithTokens.length} users out of ${userIds.length} recipients`);
      
      const expoTokens = [];
      const directFcmTokens = [];

      usersWithTokens.forEach(u => {
        // Collect all tokens (primary push_token and supplementary fcm_tokens)
        const allTokens = [u.push_token, ...(u.fcm_tokens || [])].filter(Boolean);
        
        if (allTokens.length === 0) {
          logger.debug(`User ${u.id}: no push tokens registered`);
        } else {
          logger.debug(`User ${u.id}: ${allTokens.length} token(s) found`);
        }
        
        allTokens.forEach(token => {
          if (Expo.isExpoPushToken(token)) {
            expoTokens.push(token);
          } else {
            // Assume any other token is a direct FCM token
            directFcmTokens.push(token);
          }
        });
      });

      if (expoTokens.length > 0 || directFcmTokens.length > 0) {
        logger.info(`Sending push notifications to ${expoTokens.length} Expo tokens and ${directFcmTokens.length} FCM tokens`);
        await this._sendPushNotifications(expoTokens, directFcmTokens, title, message, { 
          type, 
          notificationId: notification.id 
        });
      } else {
        logger.warn(`No push tokens found for any of the ${userIds.length} recipients. Users need to grant notification permission in their browser first.`);
      }

      return notification;
    } catch (error) {
      logger.error("NotificationService Error:", error);
      throw error;
    }
  }

  /**
   * Internal helper to send push notifications via Expo or Direct FCM
   */
  async _sendPushNotifications(expoTokens, fcmTokens, title, body, data = {}) {
    // 1. Send via Expo
    if (expoTokens.length > 0) {
      const messages = expoTokens.map(token => ({
        to: token,
        sound: "default",
        title,
        body,
        data,
      }));

      const chunks = expo.chunkPushNotifications(messages);
      for (let chunk of chunks) {
        try {
          const receipts = await expo.sendPushNotificationsAsync(chunk);
          logger.info("Expo notifications sent successfully", receipts);
        } catch (error) {
          logger.error("Expo Push Notification Error:", error);
        }
      }
    }

    // 2. Send via Firebase Admin (Direct FCM)
    if (fcmTokens.length > 0 && admin) {
      try {
        const uniqueTokens = [...new Set(fcmTokens)];
        const message = {
          notification: {
            title,
            body,
          },
          data: {
            ...data,
            notificationId: String(data.notificationId || ""),
          },
          tokens: uniqueTokens,
        };

        logger.info(`Attempting to send FCM message to ${uniqueTokens.length} tokens`);
        const response = await admin.messaging().sendEachForMulticast(message);
        logger.info(`FCM Multicast response: ${response.successCount} success, ${response.failureCount} failure`);
        
        if (response.failureCount > 0) {
          response.responses.forEach((resp, idx) => {
            if (!resp.success) {
              logger.error(`FCM Token ${uniqueTokens[idx]} failed:`, resp.error);
            }
          });
        }
      } catch (error) {
        logger.error("FCM Direct Send Error:", error);
      }
    } else if (fcmTokens.length > 0 && !admin) {
      logger.error("FCM tokens available but Firebase Admin is not initialized.");
    }
  }

  /**
   * Helper: Send to all users in a branch
   */
  async sendToBranch(branchId, payload) {
    const users = await User.findAll({
      where: { branch_id: branchId, is_active: true },
      attributes: ["id"],
    });
    const userIds = users.map((u) => u.id);
    return this.sendToUsers(userIds, { ...payload, branchId });
  }

  /**
   * Helper: Send to specific roles in a branch
   */
  async sendToRoles(branchId, roles, payload) {
    const where = { role: roles, is_active: true };
    if (branchId) where.branch_id = branchId;

    const users = await User.findAll({
      where,
      attributes: ["id"],
    });
    const userIds = users.map((u) => u.id);
    return this.sendToUsers(userIds, { ...payload, branchId });
  }
}

export default new NotificationService();
