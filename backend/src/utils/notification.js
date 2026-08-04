const User = require('../models/User');

/**
 * Send push notification to a single Expo push token
 * @param {string} pushToken 
 * @param {string} title 
 * @param {string} body 
 * @param {object} data 
 */
const sendPushNotification = async (pushToken, title, body, data = {}) => {
  if (!pushToken || !pushToken.startsWith('ExponentPushToken')) {
    console.log('[Push Notif] Invalid or missing Expo push token. Skipping dispatch.');
    return;
  }

  try {
    console.log(`[Push Notif] Sending notification to token: ${pushToken}`);
    const response = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Accept-encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to: pushToken,
        sound: 'default',
        title,
        body,
        data,
      }),
    });
    
    const result = await response.json();
    console.log('[Push Notif] Expo Push response:', JSON.stringify(result));
  } catch (error) {
    console.error('[Push Notif] Error posting push notification to Expo:', error);
  }
};

/**
 * Send push notification to a user by their MongoDB User ID
 * @param {string} userId 
 * @param {string} title 
 * @param {string} body 
 * @param {object} data 
 */
const sendNotificationToUser = async (userId, title, body, data = {}) => {
  try {
    if (!userId) return;
    const user = await User.findById(userId);
    if (!user) {
      console.log(`[Push Notif] User with ID ${userId} not found.`);
      return;
    }
    
    if (!user.pushToken) {
      console.log(`[Push Notif] No push token registered for user: ${user.firstName} ${user.lastName} (${userId})`);
      return;
    }

    await sendPushNotification(user.pushToken, title, body, data);
  } catch (error) {
    console.error(`[Push Notif] Error sending notification to user ${userId}:`, error);
  }
};

module.exports = {
  sendPushNotification,
  sendNotificationToUser
};
