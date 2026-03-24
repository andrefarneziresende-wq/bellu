import { prisma } from '../../config/prisma.js';
import { env } from '../../config/env.js';
import jwt from 'jsonwebtoken';
import http2 from 'http2';

// ============================================================
// APNs Direct (iOS) + FCM (Android future)
// ============================================================

// ── APNs JWT token cache ─────────────────────────────────────

let apnsJwt: { token: string; issuedAt: number } | null = null;

function getApnsJwt(): string {
  const now = Math.floor(Date.now() / 1000);
  // APNs tokens are valid for 1 hour, refresh at 50 minutes
  if (apnsJwt && now - apnsJwt.issuedAt < 50 * 60) {
    return apnsJwt.token;
  }

  const privateKey = env.APNS_KEY_P8.replace(/\\n/g, '\n');
  const token = jwt.sign({}, privateKey, {
    algorithm: 'ES256',
    keyid: env.APNS_KEY_ID,
    issuer: env.APNS_TEAM_ID,
    expiresIn: '1h',
  });

  apnsJwt = { token, issuedAt: now };
  return token;
}

// ── APNs send ────────────────────────────────────────────────

interface PushResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

/**
 * Send a push notification directly to APNs (iOS).
 * Uses HTTP/2 + JWT authentication with .p8 key.
 */
function sendApnsMessage(
  deviceToken: string,
  title: string,
  body: string,
  data?: Record<string, string>,
): Promise<PushResult> {
  return new Promise((resolve) => {
    const isProduction = env.NODE_ENV === 'production';
    const host = isProduction
      ? 'api.push.apple.com'
      : 'api.sandbox.push.apple.com';

    let client: http2.ClientHttp2Session;
    try {
      client = http2.connect(`https://${host}`);
    } catch (err) {
      resolve({ success: false, error: `Connection failed: ${err}` });
      return;
    }

    client.on('error', (err) => {
      resolve({ success: false, error: `Connection error: ${err.message}` });
    });

    const payload = JSON.stringify({
      aps: {
        alert: { title, body },
        sound: 'default',
        badge: 1,
      },
      ...data,
    });

    const jwt = getApnsJwt();

    const req = client.request({
      ':method': 'POST',
      ':path': `/3/device/${deviceToken}`,
      'authorization': `bearer ${jwt}`,
      'apns-topic': env.APNS_BUNDLE_ID,
      'apns-push-type': 'alert',
      'apns-priority': '10',
      ':scheme': 'https',
    });

    // 10 second timeout
    req.setTimeout(10000, () => {
      req.close();
      client.close();
      resolve({ success: false, error: 'APNs request timeout' });
    });

    let responseHeaders: http2.IncomingHttpHeaders;
    let responseData = '';

    req.on('response', (h) => {
      responseHeaders = h;
    });

    req.on('data', (chunk: Buffer) => {
      responseData += chunk.toString();
    });

    req.on('end', () => {
      client.close();
      const status = Number(responseHeaders?.[':status']);

      if (status === 200) {
        const apnsId = responseHeaders?.['apns-id'] as string;
        console.log(`[APNs] Success: ${apnsId}`);
        resolve({ success: true, messageId: apnsId });
      } else {
        console.error(`[APNs] Error ${status}: ${responseData}`);
        resolve({ success: false, error: `HTTP ${status}: ${responseData}` });
      }
    });

    req.on('error', (err) => {
      client.close();
      resolve({ success: false, error: `Request error: ${err.message}` });
    });

    req.write(payload);
    req.end();
  });
}

// ── FCM send (for Android future) ───────────────────────────

// Lazy import google-auth-library only when needed for Android
let _googleAuth: import('google-auth-library').GoogleAuth | null = null;

async function sendFcmMessage(
  token: string,
  title: string,
  body: string,
  data?: Record<string, string>,
): Promise<PushResult> {
  const projectId = env.FCM_PROJECT_ID;
  if (!projectId || !env.FCM_CLIENT_EMAIL || !env.FCM_PRIVATE_KEY) {
    return { success: false, error: 'FCM credentials not configured' };
  }

  try {
    if (!_googleAuth) {
      const { GoogleAuth } = await import('google-auth-library');
      _googleAuth = new GoogleAuth({
        credentials: {
          client_email: env.FCM_CLIENT_EMAIL,
          private_key: env.FCM_PRIVATE_KEY.replace(/\\n/g, '\n'),
        },
        scopes: ['https://www.googleapis.com/auth/firebase.messaging'],
      });
    }

    const client = await _googleAuth.getClient();
    const url = `https://fcm.googleapis.com/v1/projects/${projectId}/messages:send`;

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
            notification: { channelId: 'default', sound: 'default' },
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
    return { success: false, error: `HTTP ${status}: ${errBody}` };
  }
}

// ── Route to correct provider based on platform ─────────────

async function sendPushMessage(
  token: string,
  platform: string,
  title: string,
  body: string,
  data?: Record<string, string>,
): Promise<PushResult> {
  if (platform === 'ios') {
    // Extract APNs device token from FCM token if needed
    // FCM tokens from @react-native-firebase look like: "xxxx:APAyyy"
    // We need the raw APNs device token for direct APNs delivery
    // The mobile app should send the APNs token directly
    return sendApnsMessage(token, title, body, data);
  }
  // Android: use FCM
  return sendFcmMessage(token, title, body, data);
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
 * Routes iOS to APNs direct, Android to FCM.
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

  // Check if APNs or FCM is configured
  const apnsConfigured = env.APNS_KEY_ID && env.APNS_TEAM_ID && env.APNS_KEY_P8;
  const fcmConfigured = env.FCM_PROJECT_ID && env.FCM_CLIENT_EMAIL && env.FCM_PRIVATE_KEY;

  if (!apnsConfigured && !fcmConfigured) {
    savePushLog({
      userId,
      title: payload.title,
      type: payload.type,
      status: 'not_configured',
      error: 'Push credentials not configured on server',
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

  const errors: string[] = [];
  let sentCount = 0;

  for (const t of tokens) {
    const result = await sendPushMessage(
      t.token,
      t.platform,
      payload.title,
      payload.body,
      { type: payload.type, ...payload.data },
    );

    if (result.success) {
      sentCount++;
    } else {
      const tokenPrefix = t.token.substring(0, 20);
      errors.push(`[${tokenPrefix}…] ${result.error}`);

      // Deactivate invalid tokens
      if (
        result.error?.includes('BadDeviceToken') ||
        result.error?.includes('Unregistered') ||
        result.error?.includes('UNREGISTERED') ||
        result.error?.includes('NOT_FOUND') ||
        result.error?.includes('not a valid FCM registration token')
      ) {
        prisma.pushToken.updateMany({
          where: { token: t.token },
          data: { active: false },
        }).catch(() => {});
      }
    }
  }

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
 */
export async function broadcastPush(payload: PushNotificationPayload, countryId?: string) {
  const where: Record<string, unknown> = { active: true };
  if (countryId) where.countryId = countryId;

  const users = await prisma.user.findMany({
    where,
    select: { id: true },
  });

  console.log(`[Push] Broadcasting to ${users.length} users`);

  if (users.length === 0) {
    return { userCount: 0 };
  }

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
 */
export async function sendPushToProClients(
  professionalId: string,
  payload: PushNotificationPayload,
) {
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
