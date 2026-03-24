import { prisma } from '../../config/prisma.js';
import { env } from '../../config/env.js';

// ============================================================
// Firebase Cloud Messaging (FCM v1) — Direct Integration
// ============================================================

let cachedAccessToken: { token: string; expiresAt: number } | null = null;

/**
 * Generate a Google OAuth2 access token from service account credentials.
 * Uses JWT self-signed token exchange (no external libraries needed).
 */
async function getAccessToken(): Promise<string> {
  // Return cached token if still valid (with 60s buffer)
  if (cachedAccessToken && cachedAccessToken.expiresAt > Date.now() + 60_000) {
    return cachedAccessToken.token;
  }

  const clientEmail = env.FCM_CLIENT_EMAIL;
  const privateKeyPem = env.FCM_PRIVATE_KEY.replace(/\\n/g, '\n');

  if (!clientEmail || !privateKeyPem) {
    throw new Error('FCM credentials not configured (FCM_CLIENT_EMAIL / FCM_PRIVATE_KEY)');
  }

  const now = Math.floor(Date.now() / 1000);
  const header = { alg: 'RS256', typ: 'JWT' };
  const payload = {
    iss: clientEmail,
    scope: 'https://www.googleapis.com/auth/firebase.messaging',
    aud: 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: now + 3600,
  };

  const encode = (obj: Record<string, unknown>) =>
    Buffer.from(JSON.stringify(obj)).toString('base64url');

  const unsignedToken = `${encode(header)}.${encode(payload)}`;

  // Import the private key and sign
  const crypto = await import('node:crypto');
  const sign = crypto.createSign('RSA-SHA256');
  sign.update(unsignedToken);
  const signature = sign.sign(privateKeyPem, 'base64url');

  const jwt = `${unsignedToken}.${signature}`;

  // Exchange JWT for access token
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`,
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Failed to get FCM access token: ${res.status} ${errText}`);
  }

  const data = (await res.json()) as { access_token: string; expires_in: number };
  cachedAccessToken = {
    token: data.access_token,
    expiresAt: Date.now() + data.expires_in * 1000,
  };

  return cachedAccessToken.token;
}

interface FCMResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

/**
 * Send a single push notification via FCM v1 API.
 */
async function sendFCMMessage(
  token: string,
  title: string,
  body: string,
  data?: Record<string, string>,
): Promise<FCMResult> {
  const projectId = env.FCM_PROJECT_ID;
  if (!projectId) {
    return { success: false, error: 'FCM_PROJECT_ID not configured' };
  }

  try {
    const accessToken = await getAccessToken();

    const res = await fetch(
      `https://fcm.googleapis.com/v1/projects/${projectId}/messages:send`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: {
            token,
            notification: { title, body },
            data: data || {},
            android: {
              priority: 'high',
              notification: {
                channelId: 'default',
                sound: 'default',
              },
            },
            apns: {
              payload: {
                aps: {
                  sound: 'default',
                  badge: 1,
                },
              },
            },
          },
        }),
      },
    );

    if (res.ok) {
      const result = (await res.json()) as { name: string };
      return { success: true, messageId: result.name };
    }

    const errBody = await res.text();
    return { success: false, error: `HTTP ${res.status}: ${errBody}` };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

// ── Push log persistence ─────────────────────────────────────

function savePushLog(entry: {
  userId: string;
  title: string;
  type: string;
  status: string;
  error?: string;
  tokenCount: number;
  sentCount: number;
}) {
  // Fire-and-forget — don't block notification delivery
  prisma.pushLog.create({
    data: {
      userId: entry.userId,
      title: entry.title,
      type: entry.type,
      status: entry.status,
      error: entry.error || null,
      tokenCount: entry.tokenCount,
      sentCount: entry.sentCount,
    },
  }).catch((err) => console.error('[PushLog] Failed to save:', err));
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

  // Check if FCM is configured
  if (!env.FCM_PROJECT_ID || !env.FCM_CLIENT_EMAIL || !env.FCM_PRIVATE_KEY) {
    savePushLog({
      userId,
      title: payload.title,
      type: payload.type,
      status: 'not_configured',
      error: 'FCM credentials not configured on server',
      tokenCount: 0,
      sentCount: 0,
    });
    return;
  }

  // Get active push tokens for user
  const tokens = await prisma.pushToken.findMany({
    where: { userId, active: true },
  });

  if (tokens.length === 0) {
    savePushLog({
      userId,
      title: payload.title,
      type: payload.type,
      status: 'no_token',
      error: 'User has no active push tokens',
      tokenCount: 0,
      sentCount: 0,
    });
    return;
  }

  // Send via FCM v1 API to each token
  const errors: string[] = [];
  let sentCount = 0;

  for (const t of tokens) {
    const result = await sendFCMMessage(t.token, payload.title, payload.body, {
      type: payload.type,
      ...payload.data,
    });

    if (result.success) {
      sentCount++;
    } else {
      const tokenPrefix = t.token.substring(0, 20);
      errors.push(`[${tokenPrefix}…] ${result.error}`);

      // Deactivate invalid tokens
      if (
        result.error?.includes('not a valid FCM registration token') ||
        result.error?.includes('UNREGISTERED') ||
        result.error?.includes('NOT_FOUND')
      ) {
        prisma.pushToken.updateMany({
          where: { token: t.token },
          data: { active: false },
        }).catch(() => {});
      }
    }
  }

  console.log(`[Push/FCM] Sent ${sentCount}/${tokens.length} notifications to user ${userId}`);

  savePushLog({
    userId,
    title: payload.title,
    type: payload.type,
    status: sentCount > 0 ? 'sent' : 'failed',
    error: errors.length > 0 ? errors.join('; ') : undefined,
    tokenCount: tokens.length,
    sentCount,
  });
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
 * Broadcast push notification to ALL active users.
 * Creates in-app notifications for everyone and sends push to those with tokens.
 */
export async function broadcastPush(payload: PushNotificationPayload, countryId?: string) {
  // Get ALL active users (not just those with push tokens)
  const where: Record<string, unknown> = { active: true };
  if (countryId) where.countryId = countryId;

  const users = await prisma.user.findMany({
    where,
    select: { id: true },
  });

  console.log(`[Push/FCM] Broadcasting to ${users.length} users`);

  if (users.length === 0) {
    console.log('[Push/FCM] No active users found for broadcast');
    return { userCount: 0 };
  }

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
  console.log(`[Push/FCM] Sending pro notification to ${userIds.length} clients`);

  await sendPushToUsers(userIds, payload);
  return { clientCount: userIds.length };
}
