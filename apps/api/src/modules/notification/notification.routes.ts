import type { FastifyInstance } from 'fastify';
import { authenticate } from '../../shared/auth-middleware.js';
import { sendBookingReminders, sendBookingNotification } from './reminder.service.js';
import { processScheduledNotification } from './scheduler.js';
import {
  registerPushToken,
  unregisterPushToken,
  sendPushToUser,
  broadcastPush,
  sendPushToProClients,
} from './push.service.js';
import { prisma } from '../../config/prisma.js';
import { requireProContext } from '../../shared/pro-middleware.js';

export async function notificationRoutes(app: FastifyInstance) {
  // ============================================================
  // Push Token Management
  // ============================================================

  // Register push token (called on app login/startup)
  app.post<{ Body: { token: string; platform: string } }>(
    '/push-token',
    { preHandler: [authenticate] },
    async (request, reply) => {
      const { token, platform } = request.body as { token: string; platform: string };
      if (!token) return reply.status(400).send({ success: false, message: 'Token is required' });
      const result = await registerPushToken(request.user.userId, token, platform || 'ios');
      return reply.status(200).send({ success: true, data: result });
    },
  );

  // Unregister push token (called on logout)
  app.delete<{ Body: { token: string } }>(
    '/push-token',
    { preHandler: [authenticate] },
    async (request, reply) => {
      const { token } = request.body as { token: string };
      if (!token) return reply.status(400).send({ success: false, message: 'Token is required' });
      await unregisterPushToken(request.user.userId, token);
      return reply.status(200).send({ success: true, data: null });
    },
  );

  // ============================================================
  // In-App Notifications
  // ============================================================

  // List user's notifications
  app.get<{ Querystring: { page?: string; unreadOnly?: string } }>(
    '/my',
    { preHandler: [authenticate] },
    async (request, reply) => {
      const page = parseInt(request.query.page || '1', 10);
      const perPage = 30;
      const unreadOnly = request.query.unreadOnly === 'true';

      const where: Record<string, unknown> = { userId: request.user.userId };
      if (unreadOnly) where.read = false;

      const [notifications, total, unreadCount] = await Promise.all([
        prisma.notification.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          skip: (page - 1) * perPage,
          take: perPage,
        }),
        prisma.notification.count({ where }),
        prisma.notification.count({
          where: { userId: request.user.userId, read: false },
        }),
      ]);

      return reply.status(200).send({
        success: true,
        data: notifications,
        pagination: { total, page, perPage, totalPages: Math.ceil(total / perPage) },
        unreadCount,
      });
    },
  );

  // Mark notification as read
  app.patch<{ Params: { id: string } }>(
    '/:id/read',
    { preHandler: [authenticate] },
    async (request, reply) => {
      await prisma.notification.updateMany({
        where: { id: request.params.id, userId: request.user.userId },
        data: { read: true },
      });
      return reply.status(200).send({ success: true, data: null });
    },
  );

  // Mark all as read
  app.patch(
    '/read-all',
    { preHandler: [authenticate] },
    async (request, reply) => {
      await prisma.notification.updateMany({
        where: { userId: request.user.userId, read: false },
        data: { read: true },
      });
      return reply.status(200).send({ success: true, data: null });
    },
  );

  // Get unread count
  app.get(
    '/unread-count',
    { preHandler: [authenticate] },
    async (request, reply) => {
      const count = await prisma.notification.count({
        where: { userId: request.user.userId, read: false },
      });
      return reply.status(200).send({ success: true, data: { count } });
    },
  );

  // ============================================================
  // Admin — Broadcast Notifications
  // ============================================================

  // Admin: Send broadcast notification to all clients
  app.post<{ Body: { title: string; body: string; countryId?: string } }>(
    '/admin/broadcast',
    { preHandler: [authenticate] },
    async (request, reply) => {
      const { title, body, countryId } = request.body as { title: string; body: string; countryId?: string };
      if (!title || !body) {
        return reply.status(400).send({ success: false, message: 'Title and body are required' });
      }

      const result = await broadcastPush(
        { title, body, type: 'admin_broadcast' },
        countryId,
      );

      return reply.status(200).send({ success: true, data: result });
    },
  );

  // ============================================================
  // Professional — Send Notifications to Clients
  // ============================================================

  // Pro: Send notification to all their clients
  app.post<{ Body: { title: string; body: string } }>(
    '/pro/broadcast',
    { preHandler: [authenticate, requireProContext] },
    async (request, reply) => {
      const { title, body } = request.body as { title: string; body: string };
      if (!title || !body) {
        return reply.status(400).send({ success: false, message: 'Title and body are required' });
      }

      const result = await sendPushToProClients(
        request.proContext!.professionalId,
        { title, body, type: 'pro_message', data: { professionalId: request.proContext!.professionalId } },
      );

      return reply.status(200).send({ success: true, data: result });
    },
  );

  // Pro: Send notification to a specific client
  app.post<{ Params: { userId: string }; Body: { title: string; body: string } }>(
    '/pro/send/:userId',
    { preHandler: [authenticate, requireProContext] },
    async (request, reply) => {
      const { title, body } = request.body as { title: string; body: string };
      const { userId } = request.params;

      if (!title || !body) {
        return reply.status(400).send({ success: false, message: 'Title and body are required' });
      }

      await sendPushToUser(userId, {
        title,
        body,
        type: 'pro_message',
        data: { professionalId: request.proContext!.professionalId },
      });

      return reply.status(200).send({ success: true, data: null });
    },
  );

  // ============================================================
  // Admin — Scheduled Notifications
  // ============================================================

  // Create scheduled notification
  app.post<{
    Body: { title: string; body: string; target?: string; countryId?: string; sendInDays?: number };
  }>(
    '/admin/schedule',
    { preHandler: [authenticate] },
    async (request, reply) => {
      const { title, body, target, countryId, sendInDays } = request.body as {
        title: string;
        body: string;
        target?: string;
        countryId?: string;
        sendInDays?: number;
      };

      if (!title || !body) {
        return reply.status(400).send({ success: false, message: 'Title and body are required' });
      }

      const scheduledAt = new Date();
      if (sendInDays && sendInDays > 0) {
        scheduledAt.setDate(scheduledAt.getDate() + sendInDays);
        scheduledAt.setHours(10, 0, 0, 0); // Send at 10:00 AM
      }

      const notification = await prisma.scheduledNotification.create({
        data: {
          title,
          body,
          target: target || 'client',
          countryId: countryId || null,
          scheduledAt,
          status: sendInDays && sendInDays > 0 ? 'pending' : 'pending',
        },
      });

      // If sendInDays is 0 or not set, send immediately
      if (!sendInDays || sendInDays <= 0) {
        await processScheduledNotification(notification.id);
      }

      return reply.status(200).send({ success: true, data: notification });
    },
  );

  // List scheduled notifications
  app.get(
    '/admin/scheduled',
    { preHandler: [authenticate] },
    async (_request, reply) => {
      const notifications = await prisma.scheduledNotification.findMany({
        orderBy: { createdAt: 'desc' },
        take: 50,
      });
      return reply.status(200).send({ success: true, data: notifications });
    },
  );

  // Cancel scheduled notification
  app.delete<{ Params: { id: string } }>(
    '/admin/scheduled/:id',
    { preHandler: [authenticate] },
    async (request, reply) => {
      await prisma.scheduledNotification.update({
        where: { id: request.params.id },
        data: { status: 'cancelled' },
      });
      return reply.status(200).send({ success: true, data: null });
    },
  );

  // ============================================================
  // Legacy — Email/SMS Reminders
  // ============================================================

  // Trigger booking reminders manually (admin/cron use)
  app.post('/reminders/send', { preHandler: [authenticate] }, async (_request, reply) => {
    const summary = await sendBookingReminders();
    return reply.status(200).send({ success: true, data: summary });
  });

  // Send notification for a specific booking
  app.post<{ Params: { bookingId: string }; Body: { type: string } }>(
    '/booking/:bookingId',
    { preHandler: [authenticate] },
    async (request, reply) => {
      const { bookingId } = request.params;
      const { type } = request.body as { type: 'confirmation' | 'reminder' | 'cancellation' };
      await sendBookingNotification(bookingId, type);
      return reply.status(200).send({ success: true, data: null });
    },
  );

  // Check notification configuration status
  app.get('/status', { preHandler: [authenticate] }, async (_request, reply) => {
    const { env } = await import('../../config/env.js');
    return reply.status(200).send({
      success: true,
      data: {
        email: !!env.RESEND_API_KEY,
        sms: !!(env.TWILIO_ACCOUNT_SID && env.TWILIO_AUTH_TOKEN),
        whatsapp: !!(env.TWILIO_ACCOUNT_SID && env.TWILIO_WHATSAPP_NUMBER),
        push: !!(env.FCM_PROJECT_ID && env.FCM_CLIENT_EMAIL && env.FCM_PRIVATE_KEY),
      },
    });
  });
}
