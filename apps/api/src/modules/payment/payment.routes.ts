import type { FastifyInstance } from 'fastify';
import { authenticate } from '../../shared/auth-middleware.js';
import {
  createHandler,
  confirmHandler,
  refundHandler,
  getByBookingHandler,
} from './payment.controller.js';

export async function paymentRoutes(app: FastifyInstance) {
  app.post('/', { preHandler: [authenticate] }, createHandler);
  app.post<{ Params: { id: string } }>('/:id/confirm', { preHandler: [authenticate] }, confirmHandler);
  app.post<{ Params: { id: string } }>('/:id/refund', { preHandler: [authenticate] }, refundHandler);
  app.get<{ Params: { bookingId: string } }>('/booking/:bookingId', { preHandler: [authenticate] }, getByBookingHandler);
}
