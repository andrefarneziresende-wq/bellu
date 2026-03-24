import { prisma } from '../../config/prisma.js';
import { env } from '../../config/env.js';
import { GoogleAuth } from 'google-auth-library';

// ============================================================
// Firebase Cloud Messaging (FCM v1) — Direct Integration
// ============================================================

function getGoogleAuth(): GoogleAuth {
  const privateKey = env.FCM_PRIVATE_KEY.replace(/\\n/g, '\n');
  return new GoogleAuth({
    credentials: {
      client_email: env.FCM_CLIENT_EMAIL,
      private_key: privateKey,
    },
    scopes: ['https://www.googleapis.com/auth/firebase.messaging'],
  });
}

interface FCMResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

/**
 * Send a single push notification via FCM v1 API.
 * Uses google-auth-library's authorized HTTP client to avoid fetch header issues.
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
    const auth = getGoogleAuth();
    const client = await auth.getClient();
    const url = `https://fcm.googleapis.com/v1/projects/${projectId}/messages:send`;
    console.log(`[FCM] Sending via google-auth client, token_prefix=${token.substring(0, 20)}`);

    const res = await client.request({
      url,
      method: 'POST',
      data: {
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
      },
    });

    const result = res.data as { name: string };
    console.log(`[FCM] Success: ${result.name}`);
    return { success: true, messageId: result.name };
  } catch (err: unknown) {
    const error = err as { response?: { status?: number; data?: unknown }; message?: string };
    const status = error.response?.status;
    const errBody = error.response?.data
      ? JSON.stringify(error.response.data)
      : error.message || String(err);
    console.error(`[FCM] Error ${status}:`, errBody);
    return {
      success: false,
      error: `HTTP ${status}: ${errBody}`,
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
