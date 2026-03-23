import type { FastifyInstance } from 'fastify';
import { authenticate } from '../../shared/auth-middleware.js';
import { sendBookingReminders, sendBookingNotification } from './reminder.service.js';

export async function notificationRoutes(app: FastifyInstance) {
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
      },
    });
  });
}
