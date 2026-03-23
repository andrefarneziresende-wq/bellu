import type { FastifyInstance } from 'fastify';
import { authenticate } from '../../shared/auth-middleware.js';
import {
  listHandler,
  createHandler,
  updateHandler,
  deleteHandler,
} from './service-package.controller.js';

export async function servicePackageRoutes(app: FastifyInstance) {
  // List: works with ?professionalId= or with JWT (auto-detect)
  app.get<{ Querystring: { professionalId?: string } }>('/', { preHandler: [authenticate] }, listHandler);

  // Authenticated routes
  app.post('/', { preHandler: [authenticate] }, createHandler);
  app.put<{ Params: { id: string } }>('/:id', { preHandler: [authenticate] }, updateHandler);
  app.delete<{ Params: { id: string } }>('/:id', { preHandler: [authenticate] }, deleteHandler);
}
