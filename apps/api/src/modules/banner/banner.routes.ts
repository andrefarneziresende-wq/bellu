import type { FastifyInstance } from 'fastify';
import { authenticate } from '../../shared/auth-middleware.js';
import {
  listActiveHandler,
  listAllHandler,
  createHandler,
  updateHandler,
  deleteHandler,
} from './banner.controller.js';

export async function bannerRoutes(app: FastifyInstance) {
  app.get<{ Querystring: { countryId?: string } }>('/active', listActiveHandler);

  app.get<{ Querystring: { page?: string; perPage?: string } }>('/', { preHandler: [authenticate] }, listAllHandler);
  app.post('/', { preHandler: [authenticate] }, createHandler);
  app.patch<{ Params: { id: string } }>('/:id', { preHandler: [authenticate] }, updateHandler);
  app.delete<{ Params: { id: string } }>('/:id', { preHandler: [authenticate] }, deleteHandler);
}
