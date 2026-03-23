import type { FastifyInstance } from 'fastify';
import { authenticate } from '../../shared/auth-middleware.js';
import {
  createHandler,
  listByProfessionalHandler,
  listMyReviewsHandler,
  getByBookingHandler,
  respondHandler,
} from './review.controller.js';

export async function reviewRoutes(app: FastifyInstance) {
  // Auto-detect professional from JWT (must be before /:param routes)
  app.get('/', { preHandler: [authenticate] }, listMyReviewsHandler);

  app.get<{ Params: { professionalId: string }; Querystring: { page?: string; perPage?: string } }>('/professional/:professionalId', listByProfessionalHandler);

  app.get<{ Params: { bookingId: string } }>('/booking/:bookingId', { preHandler: [authenticate] }, getByBookingHandler);
  app.post('/', { preHandler: [authenticate] }, createHandler);
  app.patch<{ Params: { id: string } }>('/:id/respond', { preHandler: [authenticate] }, respondHandler);
}
