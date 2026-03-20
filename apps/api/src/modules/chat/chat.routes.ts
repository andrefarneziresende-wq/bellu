import type { FastifyInstance } from 'fastify';
import { authenticate } from '../../shared/auth-middleware.js';
import {
  listHandler,
  sendHandler,
  markReadHandler,
  unreadCountHandler,
} from './chat.controller.js';

export async function chatRoutes(app: FastifyInstance) {
  app.get<{ Params: { bookingId: string }; Querystring: { page?: string; perPage?: string } }>('/booking/:bookingId', { preHandler: [authenticate] }, listHandler);
  app.post('/', { preHandler: [authenticate] }, sendHandler);
  app.patch<{ Params: { bookingId: string } }>('/booking/:bookingId/read', { preHandler: [authenticate] }, markReadHandler);
  app.get('/unread-count', { preHandler: [authenticate] }, unreadCountHandler);
}
