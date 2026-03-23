import type { FastifyInstance } from 'fastify';
import { authenticate } from '../../shared/auth-middleware.js';
import {
  getAllHandler,
  getHandler,
  setHandler,
  deleteHandler,
} from './platform-config.controller.js';

export async function platformConfigRoutes(app: FastifyInstance) {
  // Public routes
  app.get<{ Querystring: { countryId?: string } }>('/', getAllHandler);
  app.get<{ Params: { key: string }; Querystring: { countryId?: string } }>('/:key', getHandler);

  // Admin routes (auth required)
  app.put<{ Params: { key: string } }>('/:key', { preHandler: [authenticate] }, setHandler);
  app.delete<{ Params: { key: string }; Querystring: { countryId?: string } }>(
    '/:key',
    { preHandler: [authenticate] },
    deleteHandler,
  );
}
