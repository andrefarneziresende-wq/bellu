import type { FastifyInstance } from 'fastify';
import { authenticate } from '../../shared/auth-middleware.js';
import {
  uploadHandler,
  addByUrlHandler,
  listHandler,
  listByPackageHandler,
  deleteHandler,
} from './booking-photo.controller.js';

export async function bookingPhotoRoutes(app: FastifyInstance) {
  // All routes require authentication
  app.addHook('preHandler', authenticate);

  // Evolution timeline for a client package
  app.get<{ Params: { clientPackageId: string } }>(
    '/package/:clientPackageId',
    listByPackageHandler,
  );

  // Photos for a specific booking
  app.get<{ Params: { bookingId: string } }>('/:bookingId', listHandler);

  // Upload photo (multipart file)
  app.post<{ Params: { bookingId: string } }>('/:bookingId', uploadHandler);

  // Add photo by URL
  app.post<{ Params: { bookingId: string } }>('/:bookingId/url', addByUrlHandler);

  // Delete a photo
  app.delete<{ Params: { photoId: string } }>('/photo/:photoId', deleteHandler);
}
