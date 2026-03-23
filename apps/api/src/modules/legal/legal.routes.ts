import type { FastifyInstance } from 'fastify';
import { authenticate } from '../../shared/auth-middleware.js';
import {
  getActiveByTypeHandler,
  listActiveHandler,
  listAllHandler,
  createHandler,
  updateHandler,
  deleteHandler,
} from './legal.controller.js';

export async function legalRoutes(app: FastifyInstance) {
  // Public endpoints
  app.get('/', listActiveHandler);
  app.get<{ Params: { type: string }; Querystring: { locale?: string } }>('/:type', getActiveByTypeHandler);

  // Admin endpoints (require authentication)
  app.get<{ Querystring: { page?: string; perPage?: string } }>('/admin/all', { preHandler: [authenticate] }, listAllHandler);
  app.post('/admin', { preHandler: [authenticate] }, createHandler);
  app.patch<{ Params: { id: string } }>('/admin/:id', { preHandler: [authenticate] }, updateHandler);
  app.delete<{ Params: { id: string } }>('/admin/:id', { preHandler: [authenticate] }, deleteHandler);
}
