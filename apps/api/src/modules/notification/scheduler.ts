import { sendBookingReminders } from './reminder.service.js';
import { sendPushReminder } from './push-triggers.js';
import { prisma } from '../../config/prisma.js';

let intervalId: ReturnType<typeof setInterval> | null = null;

/**
 * Starts a simple interval-based scheduler that sends booking reminders.
 * Runs every hour and checks if it's the right time to send (around 18:00 local).
 * In production, replace with a proper cron service (e.g. Railway cron, AWS EventBridge).
 */
export function startReminderScheduler() {
  if (intervalId) return;

  console.log('[Scheduler] Booking reminder scheduler started (checks every hour)');

  // Check every hour
  intervalId = setInterval(async () => {
    const hour = new Date().getHours();

    // Send reminders at 18:00 (6 PM) — gives clients evening notice for next-day appointments
    if (hour === 18) {
      console.log('[Scheduler] Running daily booking reminders...');
      try {
        // Email/SMS reminders
        await sendBookingReminders();

        // Push reminders for tomorrow's bookings
        await sendPushReminders();
      } catch (err) {
        console.error('[Scheduler] Error running reminders:', err);
      }
    }
  }, 60 * 60 * 1000); // 1 hour
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

export function stopReminderScheduler() {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
    console.log('[Scheduler] Reminder scheduler stopped');
  }
}
