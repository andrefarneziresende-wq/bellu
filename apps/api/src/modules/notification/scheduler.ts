import { sendBookingReminders } from './reminder.service.js';

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
        await sendBookingReminders();
      } catch (err) {
        console.error('[Scheduler] Error running reminders:', err);
      }
    }
  }, 60 * 60 * 1000); // 1 hour
}

export function stopReminderScheduler() {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
    console.log('[Scheduler] Reminder scheduler stopped');
  }
}
