import type { FastifyInstance } from 'fastify';
import { authenticate } from '../../shared/auth-middleware.js';
import {
  createHandler,
  getByIdHandler,
  listMyBookingsHandler,
  listProfessionalBookingsHandler,
  updateStatusHandler,
  availableSlotsHandler,
} from './booking.controller.js';

export async function bookingRoutes(app: FastifyInstance) {
  app.get<{ Params: { professionalId: string }; Querystring: { date: string } }>('/available-slots/:professionalId', availableSlotsHandler);

  app.get<{ Querystring: { status?: string; page?: string; perPage?: string } }>('/my', { preHandler: [authenticate] }, listMyBookingsHandler);
  app.get<{ Querystring: { date?: string; status?: string; page?: string; perPage?: string } }>('/professional', { preHandler: [authenticate] }, listProfessionalBookingsHandler);
  app.get<{ Params: { id: string } }>('/:id', { preHandler: [authenticate] }, getByIdHandler);
  app.post('/', { preHandler: [authenticate] }, createHandler);
  app.patch<{ Params: { id: string } }>('/:id/status', { preHandler: [authenticate] }, updateStatusHandler);
}
