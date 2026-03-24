import { sendBookingReminders } from './reminder.service.js';
import { sendPushReminder } from './push-triggers.js';
import { sendPushToUser, broadcastPush } from './push.service.js';
import { prisma } from '../../config/prisma.js';

let intervalId: ReturnType<typeof setInterval> | null = null;

/**
 * Starts a simple interval-based scheduler that sends booking reminders
 * and processes scheduled notifications.
 * Runs every hour and checks if it's the right time to send.
 */
export function startReminderScheduler() {
  if (intervalId) return;

  console.log('[Scheduler] Reminder + notification scheduler started (checks every hour)');

  // Check every hour
  intervalId = setInterval(async () => {
    const hour = new Date().getHours();

    // Send booking reminders at 18:00 (6 PM)
    if (hour === 18) {
      console.log('[Scheduler] Running daily booking reminders...');
      try {
        await sendBookingReminders();
        await sendPushReminders();
      } catch (err) {
        console.error('[Scheduler] Error running reminders:', err);
      }
    }

    // Process scheduled notifications every hour
    try {
      await processAllScheduledNotifications();
    } catch (err) {
      console.error('[Scheduler] Error processing scheduled notifications:', err);
    }
  }, 60 * 60 * 1000); // 1 hour

  // Also run scheduled notifications check on startup (after 30s delay)
  setTimeout(() => {
    processAllScheduledNotifications().catch(() => {});
  }, 30_000);
}

async function sendPushReminders() {
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
      professional: { select: { businessName: true, address: true } },
    },
  });

  console.log(`[Scheduler] Sending push reminders for ${bookings.length} bookings`);

  for (const booking of bookings) {
    await sendPushReminder(booking).catch(() => {});
  }
}

// ============================================================
// Scheduled Notifications Processing
// ============================================================

/**
 * Process a single scheduled notification by ID.
 * Replaces {{name}} tag with each user's actual name.
 */
export async function processScheduledNotification(id: string) {
  const notification = await prisma.scheduledNotification.findUnique({
    where: { id },
  });

  if (!notification || notification.status !== 'pending') return;

  // Determine target users
  const where: Record<string, unknown> = { active: true };

  if (notification.target === 'client') {
    // Users without a professional profile
    where.professional = null;
  } else if (notification.target === 'professional') {
    // Users with a professional profile
    where.professional = { isNot: null };
  }
  // 'all' = no additional filter

  if (notification.countryId) {
    where.countryId = notification.countryId;
  }

  const users = await prisma.user.findMany({
    where,
    select: { id: true, name: true },
  });

  console.log(`[Scheduler] Sending scheduled notification "${notification.title}" to ${users.length} users (target: ${notification.target})`);

  // Send in batches of 50
  const batchSize = 50;
  for (let i = 0; i < users.length; i += batchSize) {
    const batch = users.slice(i, i + batchSize);
    await Promise.allSettled(
      batch.map((user) => {
        // Replace {{name}} tag with user's name
        const personalizedBody = notification.body.replace(
          /\{\{name\}\}/gi,
          user.name || '',
        );
        return sendPushToUser(user.id, {
          title: notification.title,
          body: personalizedBody,
          type: 'admin_broadcast',
        });
      }),
    );
  }

  // Mark as sent
  await prisma.scheduledNotification.update({
    where: { id },
    data: { status: 'sent', sentAt: new Date() },
  });

  console.log(`[Scheduler] Scheduled notification "${notification.title}" sent to ${users.length} users`);
}

/**
 * Find and process all pending scheduled notifications that are due.
 */
async function processAllScheduledNotifications() {
  const due = await prisma.scheduledNotification.findMany({
    where: {
      status: 'pending',
      scheduledAt: { lte: new Date() },
    },
  });

  if (due.length === 0) return;

  console.log(`[Scheduler] Found ${due.length} scheduled notification(s) to process`);

  for (const notification of due) {
    await processScheduledNotification(notification.id);
  }
}

export function stopReminderScheduler() {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
    console.log('[Scheduler] Scheduler stopped');
  }
}
