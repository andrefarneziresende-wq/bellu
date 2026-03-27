import type { FastifyInstance } from 'fastify';
import { authenticate } from '../../shared/auth-middleware.js';
import {
  listHandler,
  listActiveHandler,
  getByIdHandler,
  createHandler,
  updateHandler,
  deleteHandler,
} from './promotion.controller.js';

export async function promotionRoutes(app: FastifyInstance) {
  app.get<{ Querystring: { professionalId?: string } }>('/', { preHandler: [authenticate] }, listHandler);
  app.get<{ Querystring: { professionalId?: string } }>('/active', listActiveHandler);
  app.get<{ Params: { id: string } }>('/:id', { preHandler: [authenticate] }, getByIdHandler);

  app.post('/', { preHandler: [authenticate] }, createHandler);
  app.patch<{ Params: { id: string } }>('/:id', { preHandler: [authenticate] }, updateHandler);
  app.delete<{ Params: { id: string } }>('/:id', { preHandler: [authenticate] }, deleteHandler);
}
