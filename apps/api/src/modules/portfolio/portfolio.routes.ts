import type { FastifyInstance } from 'fastify';
import { authenticate } from '../../shared/auth-middleware.js';
import {
  listHandler,
  getHandler,
  createHandler,
  deleteHandler,
} from './portfolio.controller.js';

export async function portfolioRoutes(app: FastifyInstance) {
  app.get<{ Querystring: { professionalId: string; page?: string; perPage?: string } }>('/', listHandler);
  app.get<{ Params: { id: string } }>('/:id', getHandler);

  app.post('/', { preHandler: [authenticate] }, createHandler);
  app.delete<{ Params: { id: string } }>('/:id', { preHandler: [authenticate] }, deleteHandler);
}
