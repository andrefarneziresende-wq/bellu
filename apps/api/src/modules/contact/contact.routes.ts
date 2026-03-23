import type { FastifyInstance } from 'fastify';
import { authenticate } from '../../shared/auth-middleware.js';
import {
  createHandler,
  listHandler,
  resolveHandler,
} from './contact.controller.js';

export async function contactRoutes(app: FastifyInstance) {
  // Public route
  app.post('/', createHandler);

  // Admin routes (auth required)
  app.get<{ Querystring: { resolved?: string } }>('/', { preHandler: [authenticate] }, listHandler);
  app.patch<{ Params: { id: string } }>('/:id/resolve', { preHandler: [authenticate] }, resolveHandler);
}
