import { sendPushToUser } from './push.service.js';

// ============================================================
// Push Notification Triggers
// Called from various services after key events
// ============================================================

/**
 * Notify client when a new booking is created.
 */
export async function onBookingCreated(booking: {
  id: string;
  userId?: string | null;
  date: Date;
  startTime: string;
  service: { name: string };
  professional: { id: string; businessName: string };
}) {
  if (!booking.userId) return;

  const dateStr = booking.date.toLocaleDateString('pt-BR');

  await sendPushToUser(booking.userId, {
    title: 'Agendamento criado',
    body: `${booking.service.name} em ${dateStr} às ${booking.startTime} com ${booking.professional.businessName}`,
    type: 'booking_created',
    data: { bookingId: booking.id, professionalId: booking.professional.id },
  }).catch(console.error);
}

/**
 * Notify client when booking is confirmed by professional.
 */
export async function onBookingConfirmed(booking: {
  id: string;
  userId?: string | null;
  date: Date;
  startTime: string;
  service: { name: string };
  professional: { id: string; businessName: string };
}) {
  if (!booking.userId) return;

  const dateStr = booking.date.toLocaleDateString('pt-BR');

  await sendPushToUser(booking.userId, {
    title: 'Agendamento confirmado!',
    body: `${booking.service.name} em ${dateStr} às ${booking.startTime} foi confirmado por ${booking.professional.businessName}`,
    type: 'booking_confirmed',
    data: { bookingId: booking.id, professionalId: booking.professional.id },
  }).catch(console.error);
}

/**
 * Notify client when booking is cancelled.
 */
export async function onBookingCancelled(booking: {
  id: string;
  userId?: string | null;
  date: Date;
  startTime: string;
  service: { name: string };
  professional: { id: string; businessName: string };
}, cancelledByPro: boolean) {
  if (!booking.userId) return;

  const dateStr = booking.date.toLocaleDateString('pt-BR');

  if (cancelledByPro) {
    // Notify client that pro cancelled
    await sendPushToUser(booking.userId, {
      title: 'Agendamento cancelado',
      body: `${booking.professional.businessName} cancelou o agendamento de ${booking.service.name} em ${dateStr} às ${booking.startTime}`,
      type: 'booking_cancelled',
      data: { bookingId: booking.id },
    }).catch(console.error);
  }

  // Also notify the professional if cancelled by client
  if (!cancelledByPro) {
    const { prisma } = await import('../../config/prisma.js');
    const pro = await prisma.professional.findUnique({
      where: { id: booking.professional.id },
      select: { userId: true },
    });

    if (pro) {
      await sendPushToUser(pro.userId, {
        title: 'Agendamento cancelado pelo cliente',
        body: `O cliente cancelou ${booking.service.name} em ${dateStr} às ${booking.startTime}`,
        type: 'booking_cancelled',
        data: { bookingId: booking.id },
      }).catch(console.error);
    }
  }
}

/**
 * Notify client when booking is completed.
 */
export async function onBookingCompleted(booking: {
  id: string;
  userId?: string | null;
  service: { name: string };
  professional: { id: string; businessName: string };
}) {
  if (!booking.userId) return;

  await sendPushToUser(booking.userId, {
    title: 'Atendimento concluído!',
    body: `${booking.service.name} com ${booking.professional.businessName} foi concluído. Que tal deixar uma avaliação?`,
    type: 'booking_completed',
    data: { bookingId: booking.id, professionalId: booking.professional.id },
  }).catch(console.error);
}

/**
 * Notify professional when they receive a new review.
 */
export async function onReviewReceived(review: {
  id: string;
  rating: number;
  comment?: string | null;
  user: { name: string };
  professional: { id: string; userId: string };
}) {
  const stars = '⭐'.repeat(review.rating);

  await sendPushToUser(review.professional.userId, {
    title: `Nova avaliação: ${stars}`,
    body: review.comment
      ? `${review.user.name}: "${review.comment.substring(0, 100)}"`
      : `${review.user.name} avaliou com ${review.rating} estrelas`,
    type: 'review_received',
    data: { reviewId: review.id, professionalId: review.professional.id },
  }).catch(console.error);
}

/**
 * Notify professional when a new booking request comes in.
 */
export async function onNewBookingForPro(booking: {
  id: string;
  date: Date;
  startTime: string;
  service: { name: string };
  professional: { id: string; userId: string };
  user?: { name: string } | null;
  clientName?: string | null;
}) {
  const clientName = booking.clientName || booking.user?.name || 'Cliente';
  const dateStr = booking.date.toLocaleDateString('pt-BR');

  await sendPushToUser(booking.professional.userId, {
    title: 'Novo agendamento!',
    body: `${clientName} agendou ${booking.service.name} para ${dateStr} às ${booking.startTime}`,
    type: 'booking_created',
    data: { bookingId: booking.id },
  }).catch(console.error);
}

/**
 * Push reminder for tomorrow's bookings (complement to email/SMS).
 */
export async function sendPushReminder(booking: {
  id: string;
  userId?: string | null;
  startTime: string;
  service: { name: string };
  professional: { businessName: string; address: string };
}) {
  if (!booking.userId) return;

  await sendPushToUser(booking.userId, {
    title: 'Lembrete: agendamento amanhã',
    body: `${booking.service.name} às ${booking.startTime} com ${booking.professional.businessName}`,
    type: 'booking_reminder',
    data: { bookingId: booking.id },
  }).catch(console.error);
}
