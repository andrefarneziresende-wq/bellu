import type { FastifyInstance } from 'fastify';
import { authenticate } from '../../shared/auth-middleware.js';
import {
  listHandler,
  getByIdHandler,
  createHandler,
  updateHandler,
  deleteHandler,
} from './category.controller.js';

export async function categoryRoutes(app: FastifyInstance) {
  app.get<{ Querystring: { locale?: string } }>('/', listHandler);
  app.get<{ Params: { id: string } }>('/:id', getByIdHandler);
  app.post('/', { preHandler: [authenticate] }, createHandler);
  app.patch<{ Params: { id: string } }>('/:id', { preHandler: [authenticate] }, updateHandler);
  app.delete<{ Params: { id: string } }>('/:id', { preHandler: [authenticate] }, deleteHandler);
}
