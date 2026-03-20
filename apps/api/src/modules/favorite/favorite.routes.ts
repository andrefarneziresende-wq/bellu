import type { FastifyInstance } from 'fastify';
import { authenticate } from '../../shared/auth-middleware.js';
import {
  toggleHandler,
  listHandler,
  checkHandler,
} from './favorite.controller.js';

export async function favoriteRoutes(app: FastifyInstance) {
  app.post<{ Body: { professionalId: string } }>('/', { preHandler: [authenticate] }, toggleHandler);
  app.get<{ Querystring: { page?: string; perPage?: string } }>('/', { preHandler: [authenticate] }, listHandler);
  app.get<{ Params: { professionalId: string } }>('/:professionalId/check', { preHandler: [authenticate] }, checkHandler);
}
