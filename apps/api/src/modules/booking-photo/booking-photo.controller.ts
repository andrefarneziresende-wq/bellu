import type { FastifyRequest, FastifyReply } from 'fastify';
import { uploadFile } from '../../config/r2.js';
import * as bookingPhotoService from './booking-photo.service.js';

/**
 * POST /api/booking-photos/:bookingId
 * Upload a photo to a completed booking.
 * Accepts multipart file + description field.
 */
export async function uploadHandler(
  request: FastifyRequest<{ Params: { bookingId: string } }>,
  reply: FastifyReply,
) {
  const { bookingId } = request.params;
  const data = await request.file();

  if (!data) {
    return reply.status(400).send({ success: false, message: 'No file provided' });
  }

  // Get description from fields
  const descriptionField = (request.body as any)?.description;
  const description = typeof descriptionField === 'object' && descriptionField?.value
    ? descriptionField.value
    : typeof descriptionField === 'string' ? descriptionField : undefined;

  // Upload to R2 in a secure folder
  const buffer = await data.toBuffer();
  const { url } = await uploadFile(buffer, data.filename, data.mimetype, 'booking-photos');

  // Save to database with access control
  const photo = await bookingPhotoService.addPhoto(
    bookingId,
    request.user.userId,
    url,
    description,
  );

  return reply.status(201).send({ success: true, data: photo });
}

/**
 * POST /api/booking-photos/:bookingId/url
 * Add a photo by URL (for already uploaded images).
 */
export async function addByUrlHandler(
  request: FastifyRequest<{ Params: { bookingId: string } }>,
  reply: FastifyReply,
) {
  const { bookingId } = request.params;
  const { imageUrl, description } = request.body as {
    imageUrl: string;
    description?: string;
  };

  const photo = await bookingPhotoService.addPhoto(
    bookingId,
    request.user.userId,
    imageUrl,
    description,
  );

  return reply.status(201).send({ success: true, data: photo });
}

/**
 * GET /api/booking-photos/:bookingId
 * List photos for a booking (only participants can view).
 */
export async function listHandler(
  request: FastifyRequest<{ Params: { bookingId: string } }>,
  reply: FastifyReply,
) {
  const photos = await bookingPhotoService.listByBooking(
    request.params.bookingId,
    request.user.userId,
  );

  return reply.status(200).send({ success: true, data: photos });
}

/**
 * GET /api/booking-photos/package/:clientPackageId
 * List all photos across a client package (evolution timeline).
 */
export async function listByPackageHandler(
  request: FastifyRequest<{ Params: { clientPackageId: string } }>,
  reply: FastifyReply,
) {
  const photos = await bookingPhotoService.listByClientPackage(
    request.params.clientPackageId,
    request.user.userId,
  );

  return reply.status(200).send({ success: true, data: photos });
}

/**
 * DELETE /api/booking-photos/:photoId
 * Delete a photo (only uploader or professional owner).
 */
export async function deleteHandler(
  request: FastifyRequest<{ Params: { photoId: string } }>,
  reply: FastifyReply,
) {
  await bookingPhotoService.deletePhoto(
    request.params.photoId,
    request.user.userId,
  );

  return reply.status(200).send({ success: true, data: null });
}
