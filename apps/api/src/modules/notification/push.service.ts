import { prisma } from '../../config/prisma.js';
import { env } from '../../config/env.js';

// ============================================================
// Firebase Cloud Messaging — Push Notification Service
// ============================================================

interface FCMMessage {
  token: string;
  notification: { title: string; body: string };
  data?: Record<string, string>;
  apns?: { payload: { aps: { sound: string; badge?: number } } };
  android?: { priority: string; notification: { sound: string; channelId: string } };
}

let cachedAccessToken: { token: string; expiresAt: number } | null = null;

/**
 * Get OAuth2 access token for FCM v1 API using service account credentials.
 * Uses a simple JWT → token exchange (no heavy SDK needed).
 */
async function getFCMAccessToken(): Promise<string> {
  if (cachedAccessToken && Date.now() < cachedAccessToken.expiresAt - 60_000) {
    return cachedAccessToken.token;
  }

  const now = Math.floor(Date.now() / 1000);
  const header = Buffer.from(JSON.stringify({ alg: 'RS256', typ: 'JWT' })).toString('base64url');
  const payload = Buffer.from(JSON.stringify({
    iss: env.FCM_CLIENT_EMAIL,
    scope: 'https://www.googleapis.com/auth/firebase.messaging',
    aud: 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: now + 3600,
  })).toString('base64url');

  // Import crypto for signing
  const crypto = await import('crypto');
  const privateKey = env.FCM_PRIVATE_KEY.replace(/\\n/g, '\n');
  const sign = crypto.createSign('RSA-SHA256');
  sign.update(`${header}.${payload}`);
  const signature = sign.sign(privateKey, 'base64url');

  const jwt = `${header}.${payload}.${signature}`;

  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`,
  });

  if (!response.ok) {
    const err = await response.text();
    console.error('[FCM] Failed to get access token:', err);
    throw new Error('Failed to get FCM access token');
  }

  const data = await response.json() as { access_token: string; expires_in: number };
  cachedAccessToken = {
    token: data.access_token,
    expiresAt: Date.now() + data.expires_in * 1000,
  };

  return data.access_token;
}

/**
 * Send push notification via FCM v1 HTTP API.
 */
async function sendFCMMessage(message: FCMMessage): Promise<boolean> {
  if (!env.FCM_PROJECT_ID || !env.FCM_CLIENT_EMAIL || !env.FCM_PRIVATE_KEY) {
    console.log('[FCM] Not configured, skipping push notification');
    return false;
  }

  try {
    const accessToken = await getFCMAccessToken();

    const response = await fetch(
      `https://fcm.googleapis.com/v1/projects/${env.FCM_PROJECT_ID}/messages:send`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message }),
      },
    );

    if (!response.ok) {
      const err = await response.text();
      console.error('[FCM] Send failed:', err);

      // If token is invalid, deactivate it
      if (err.includes('UNREGISTERED') || err.includes('INVALID_ARGUMENT')) {
        await prisma.pushToken.updateMany({
          where: { token: message.token },
          data: { active: false },
        });
      }
      return false;
    }

    return true;
  } catch (err) {
    console.error('[FCM] Error sending push:', err);
    return false;
  }
}

// ============================================================
// Public API
// ============================================================

export interface PushNotificationPayload {
  title: string;
  body: string;
  type: string;
  data?: Record<string, string>;
}

/**
 * Register a push token for a user.
 */
export async function registerPushToken(userId: string, token: string, platform: string) {
  return prisma.pushToken.upsert({
    where: { userId_token: { userId, token } },
    create: { userId, token, platform, active: true },
    update: { active: true, platform },
  });
}

/**
 * Remove a push token (on logout).
 */
export async function unregisterPushToken(userId: string, token: string) {
  await prisma.pushToken.updateMany({
    where: { userId, token },
    data: { active: false },
  });
}

/**
 * Send push notification to a specific user (all their devices).
 * Also creates an in-app notification record.
 */
export async function sendPushToUser(userId: string, payload: PushNotificationPayload) {
  // Save in-app notification
  await prisma.notification.create({
    data: {
      userId,
      title: payload.title,
      body: payload.body,
      type: payload.type,
      data: payload.data ? JSON.stringify(payload.data) : null,
    },
  });

  // Get active push tokens for user
  const tokens = await prisma.pushToken.findMany({
    where: { userId, active: true },
  });

  if (tokens.length === 0) return;

  const results = await Promise.allSettled(
    tokens.map((t) =>
      sendFCMMessage({
        token: t.token,
        notification: { title: payload.title, body: payload.body },
        data: { type: payload.type, ...payload.data },
        apns: { payload: { aps: { sound: 'default' } } },
        android: { priority: 'high', notification: { sound: 'default', channelId: 'default' } },
      }),
    ),
  );

  const sent = results.filter((r) => r.status === 'fulfilled' && r.value).length;
  console.log(`[Push] Sent ${sent}/${tokens.length} notifications to user ${userId}`);
}

/**
 * Send push notification to multiple users.
 */
export async function sendPushToUsers(userIds: string[], payload: PushNotificationPayload) {
  await Promise.allSettled(
    userIds.map((userId) => sendPushToUser(userId, payload)),
  );
}

/**
 * Broadcast push notification to ALL users with active tokens.
 * Used by admin for announcements.
 */
export async function broadcastPush(payload: PushNotificationPayload, countryId?: string) {
  // Get all users with active push tokens
  const where: Record<string, unknown> = { active: true, pushTokens: { some: { active: true } } };
  if (countryId) where.countryId = countryId;

  const users = await prisma.user.findMany({
    where,
    select: { id: true },
  });

  console.log(`[Push] Broadcasting to ${users.length} users`);

  // Send in batches of 50
  const batchSize = 50;
  for (let i = 0; i < users.length; i += batchSize) {
    const batch = users.slice(i, i + batchSize);
    await Promise.allSettled(
      batch.map((u) => sendPushToUser(u.id, payload)),
    );
  }

  return { userCount: users.length };
}

/**
 * Send push to all clients of a specific professional.
 * Used by pro to notify their clients about promotions, etc.
 */
export async function sendPushToProClients(
  professionalId: string,
  payload: PushNotificationPayload,
) {
  // Find all users who have booked with this professional
  const bookings = await prisma.booking.findMany({
    where: { professionalId, userId: { not: null } },
    select: { userId: true },
    distinct: ['userId'],
  });

  const userIds = bookings.map((b) => b.userId).filter(Boolean) as string[];
  console.log(`[Push] Sending pro notification to ${userIds.length} clients`);

  await sendPushToUsers(userIds, payload);
  return { clientCount: userIds.length };
}
