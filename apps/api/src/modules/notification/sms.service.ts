import { env } from '../../config/env.js';

interface SendSmsParams {
  to: string; // E.164 format e.g. +5511999001122
  body: string;
}

export async function sendSms({ to, body }: SendSmsParams): Promise<boolean> {
  if (!env.TWILIO_ACCOUNT_SID || !env.TWILIO_AUTH_TOKEN) {
    console.log(`[SMS] Skipped (no Twilio credentials): to=${to}`);
    return false;
  }

  try {
    const url = `https://api.twilio.com/2010-04-01/Accounts/${env.TWILIO_ACCOUNT_SID}/Messages.json`;
    const auth = Buffer.from(`${env.TWILIO_ACCOUNT_SID}:${env.TWILIO_AUTH_TOKEN}`).toString('base64');

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        To: to,
        From: env.TWILIO_PHONE_NUMBER,
        Body: body,
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      console.error(`[SMS] Failed to send to ${to}:`, text);
      return false;
    }

    console.log(`[SMS] Sent to ${to}`);
    return true;
  } catch (err) {
    console.error('[SMS] Error:', err);
    return false;
  }
}

export async function sendWhatsApp({ to, body }: SendSmsParams): Promise<boolean> {
  if (!env.TWILIO_ACCOUNT_SID || !env.TWILIO_AUTH_TOKEN || !env.TWILIO_WHATSAPP_NUMBER) {
    console.log(`[WhatsApp] Skipped (no Twilio WhatsApp credentials): to=${to}`);
    return false;
  }

  try {
    const url = `https://api.twilio.com/2010-04-01/Accounts/${env.TWILIO_ACCOUNT_SID}/Messages.json`;
    const auth = Buffer.from(`${env.TWILIO_ACCOUNT_SID}:${env.TWILIO_AUTH_TOKEN}`).toString('base64');

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        To: `whatsapp:${to}`,
        From: `whatsapp:${env.TWILIO_WHATSAPP_NUMBER}`,
        Body: body,
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      console.error(`[WhatsApp] Failed to send to ${to}:`, text);
      return false;
    }

    console.log(`[WhatsApp] Sent to ${to}`);
    return true;
  } catch (err) {
    console.error('[WhatsApp] Error:', err);
    return false;
  }
}
