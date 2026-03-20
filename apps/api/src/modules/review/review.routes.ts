import type { FastifyInstance } from 'fastify';
import { authenticate } from '../../shared/auth-middleware.js';
import {
  createHandler,
  listByProfessionalHandler,
  getByBookingHandler,
} from './review.controller.js';

export async function reviewRoutes(app: FastifyInstance) {
  app.get<{ Params: { professionalId: string }; Querystring: { page?: string; perPage?: string } }>('/professional/:professionalId', listByProfessionalHandler);

  app.get<{ Params: { bookingId: string } }>('/booking/:bookingId', { preHandler: [authenticate] }, getByBookingHandler);
  app.post('/', { preHandler: [authenticate] }, createHandler);
}
