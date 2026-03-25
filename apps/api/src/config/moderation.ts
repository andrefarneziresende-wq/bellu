import Anthropic from '@anthropic-ai/sdk';
import { env } from './env.js';

let client: Anthropic | null = null;

function getClient(): Anthropic | null {
  if (!env.ANTHROPIC_API_KEY) return null;
  if (!client) {
    client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });
  }
  return client;
}

/**
 * Check if an image contains inappropriate content (NSFW, violence, etc).
 * Returns { safe: true } if OK, or { safe: false, reason: string } if blocked.
 * If the API key is not configured, images are allowed by default.
 */
export async function moderateImage(
  imageBuffer: Buffer,
  mediaType: string,
): Promise<{ safe: boolean; reason?: string }> {
  const anthropic = getClient();
  if (!anthropic) {
    // No API key configured — skip moderation
    return { safe: true };
  }

  try {
    const base64 = imageBuffer.toString('base64');
    const validType = mediaType as 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp';

    const response = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 100,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: { type: 'base64', media_type: validType, data: base64 },
            },
            {
              type: 'text',
              text: 'Classify this image. Reply with ONLY one word: SAFE or UNSAFE. An image is UNSAFE if it contains nudity, sexual content, explicit violence, gore, or hate symbols. Everything else is SAFE.',
            },
          ],
        },
      ],
    });

    const text = response.content[0]?.type === 'text'
      ? response.content[0].text.trim().toUpperCase()
      : 'SAFE';

    if (text.includes('UNSAFE')) {
      console.log('[Moderation] Image blocked');
      return { safe: false, reason: 'Conteúdo impróprio detectado' };
    }

    return { safe: true };
  } catch (err) {
    console.error('[Moderation] Error:', err);
    // On error, allow the image (don't block users due to API issues)
    return { safe: true };
  }
}
