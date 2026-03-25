import type { FastifyRequest, FastifyReply } from 'fastify';
import { uploadFile, deleteFile } from '../../config/r2.js';
import { moderateImage } from '../../config/moderation.js';

export async function uploadHandler(request: FastifyRequest, reply: FastifyReply) {
  const data = await request.file();
  if (!data) {
    return reply.status(400).send({ success: false, error: 'No file uploaded' });
  }

  const buffer = await data.toBuffer();
  const maxSize = 5 * 1024 * 1024; // 5MB
  if (buffer.length > maxSize) {
    return reply.status(400).send({ success: false, error: 'File too large. Max 5MB.' });
  }

  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
  if (!allowedTypes.includes(data.mimetype)) {
    return reply.status(400).send({ success: false, error: 'Invalid file type. Use JPEG, PNG, WebP or GIF.' });
  }

  // Moderate image content before uploading
  const moderation = await moderateImage(buffer, data.mimetype);
  if (!moderation.safe) {
    return reply.status(422).send({
      success: false,
      error: 'inappropriate_content',
    });
  }

  const folder = (request.query as { folder?: string }).folder || 'uploads';

  try {
    const url = await uploadFile(buffer, data.filename, data.mimetype, folder);
    return reply.status(201).send({ success: true, data: { url } });
  } catch (err) {
    console.error('[Upload] R2 upload failed:', err);
    return reply.status(500).send({
      success: false,
      error: err instanceof Error ? err.message : 'Upload failed — check R2 configuration',
    });
  }
}

export async function deleteHandler(request: FastifyRequest, reply: FastifyReply) {
  const { url } = request.body as { url: string };
  if (!url) {
    return reply.status(400).send({ success: false, error: 'URL is required' });
  }

  try {
    await deleteFile(url);
    return reply.status(200).send({ success: true, data: null });
  } catch (err) {
    console.error('[Upload] R2 delete failed:', err);
    return reply.status(500).send({
      success: false,
      error: err instanceof Error ? err.message : 'Delete failed',
    });
  }
}
