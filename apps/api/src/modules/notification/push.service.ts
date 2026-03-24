import { prisma } from '../../config/prisma.js';

// ============================================================
// Expo Push Notification Service
// ============================================================

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';

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

interface ExpoPushMessage {
  to: string;
  title: string;
  body: string;
  data?: Record<string, string>;
  sound?: 'default' | null;
  channelId?: string;
  priority?: 'default' | 'normal' | 'high';
}

interface ExpoPushTicket {
  status: 'ok' | 'error';
  id?: string;
  message?: string;
  details?: { error?: string };
}

/**
 * Send push notifications via Expo Push Service.
 * Handles both iOS (APNs) and Android (FCM) automatically.
 */
async function sendExpoPush(messages: ExpoPushMessage[]): Promise<ExpoPushTicket[]> {
  if (messages.length === 0) return [];

  try {
    const response = await fetch(EXPO_PUSH_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Accept-Encoding': 'gzip, deflate',
      },
      body: JSON.stringify(messages),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('[ExpoPush] API error:', response.status, errText);
      return messages.map(() => ({ status: 'error' as const, message: `HTTP ${response.status}: ${errText}` }));
    }

    const result = await response.json() as { data: ExpoPushTicket[] };
    return result.data || [];
  } catch (err) {
    console.error('[ExpoPush] Network error:', err);
    return messages.map(() => ({
      status: 'error' as const,
      message: err instanceof Error ? err.message : String(err),
    }));
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

  // Build Expo push messages
  const messages: ExpoPushMessage[] = tokens.map((t) => ({
    to: t.token,
    title: payload.title,
    body: payload.body,
    data: { type: payload.type, ...payload.data },
    sound: 'default' as const,
    channelId: 'default',
    priority: 'high' as const,
  }));

  // Send via Expo Push Service
  const tickets = await sendExpoPush(messages);

  const errors: string[] = [];
  let sentCount = 0;

  tickets.forEach((ticket, i) => {
    const tokenPrefix = tokens[i].token.substring(0, 20);
    if (ticket.status === 'ok') {
      sentCount++;
    } else {
      const errDetail = ticket.details?.error || ticket.message || 'unknown';
      errors.push(`[${tokenPrefix}…] ${errDetail}`);

      // Deactivate invalid tokens
      if (ticket.details?.error === 'DeviceNotRegistered') {
        prisma.pushToken.updateMany({
          where: { token: tokens[i].token },
          data: { active: false },
        }).catch(() => {});
      }
    }
  });

  console.log(`[Push] Sent ${sentCount}/${tokens.length} notifications to user ${userId}`);

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

  console.log(`[Push] Broadcasting to ${users.length} users`);

  if (users.length === 0) {
    console.log('[Push] No active users found for broadcast');
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
  console.log(`[Push] Sending pro notification to ${userIds.length} clients`);

  await sendPushToUsers(userIds, payload);
  return { clientCount: userIds.length };
}
