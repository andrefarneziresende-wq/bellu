import { prisma } from '../../config/prisma.js';
import { sendEmail } from './email.service.js';
import { sendSms, sendWhatsApp } from './sms.service.js';
import { bookingReminderEmail, bookingReminderSms } from './templates.js';

/**
 * Sends booking reminders for appointments happening tomorrow.
 * Should be called once daily (e.g. via cron or scheduler).
 */
export async function sendBookingReminders() {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);

  const dayAfter = new Date(tomorrow);
  dayAfter.setDate(dayAfter.getDate() + 1);

  const bookings = await prisma.booking.findMany({
    where: {
      date: { gte: tomorrow, lt: dayAfter },
      status: { in: ['CONFIRMED', 'PENDING'] },
    },
    include: {
      service: true,
      professional: true,
      user: true,
    },
  });

  console.log(`[Reminders] Found ${bookings.length} bookings for tomorrow`);

  let emailsSent = 0;
  let smsSent = 0;
  let whatsappSent = 0;

  for (const booking of bookings) {
    const data = {
      clientName: booking.clientName || booking.user?.name || 'Cliente',
      serviceName: booking.service.name,
      professionalName: booking.professional.businessName,
      date: tomorrow.toLocaleDateString('pt-BR'),
      startTime: booking.startTime,
      address: booking.professional.address,
    };

    // Send email if we have an email address
    const email = booking.user?.email;
    if (email) {
      const template = bookingReminderEmail(data);
      const sent = await sendEmail({ to: email, ...template });
      if (sent) emailsSent++;
    }

    // Send SMS if we have a phone number
    const phone = booking.clientPhone || booking.user?.phone;
    if (phone) {
      const smsText = bookingReminderSms(data);
      // Normalize phone to E.164 (assume Brazil if no prefix)
      const normalizedPhone = phone.startsWith('+') ? phone : `+55${phone.replace(/\D/g, '')}`;

      const smsSentOk = await sendSms({ to: normalizedPhone, body: smsText });
      if (smsSentOk) smsSent++;

      // Also try WhatsApp
      const waSentOk = await sendWhatsApp({ to: normalizedPhone, body: smsText });
      if (waSentOk) whatsappSent++;
    }
  }

  const summary = { total: bookings.length, emailsSent, smsSent, whatsappSent };
  console.log('[Reminders] Summary:', summary);
  return summary;
}

/**
 * Sends notifications for a specific booking (e.g. on confirmation).
 */
export async function sendBookingNotification(
  bookingId: string,
  type: 'confirmation' | 'reminder' | 'cancellation',
) {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: { service: true, professional: true, user: true },
  });

  if (!booking) return;

  const { bookingConfirmationEmail, bookingConfirmationSms } = await import('./templates.js');

  const data = {
    clientName: booking.clientName || booking.user?.name || 'Cliente',
    serviceName: booking.service.name,
    professionalName: booking.professional.businessName,
    date: booking.date.toLocaleDateString('pt-BR'),
    startTime: booking.startTime,
    address: booking.professional.address,
  };

  if (type === 'confirmation') {
    const email = booking.user?.email;
    if (email) {
      const template = bookingConfirmationEmail(data);
      await sendEmail({ to: email, ...template });
    }

    const phone = booking.clientPhone || booking.user?.phone;
    if (phone) {
      const normalizedPhone = phone.startsWith('+') ? phone : `+55${phone.replace(/\D/g, '')}`;
      const text = bookingConfirmationSms(data);
      await sendSms({ to: normalizedPhone, body: text });
      await sendWhatsApp({ to: normalizedPhone, body: text });
    }
  }
}
