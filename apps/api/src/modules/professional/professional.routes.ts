import type { FastifyInstance } from 'fastify';
import { authenticate } from '../../shared/auth-middleware.js';
import {
  createHandler,
  getByIdHandler,
  getMyProfileHandler,
  updateHandler,
  searchHandler,
  featuredHandler,
} from './professional.controller.js';

export async function professionalRoutes(app: FastifyInstance) {
  // Public routes
  app.get('/search', searchHandler);
  app.get<{ Querystring: { countryId: string; limit?: string } }>('/featured', featuredHandler);

  // Authenticated routes
  app.get('/me', { preHandler: [authenticate] }, getMyProfileHandler);
  app.post('/', { preHandler: [authenticate] }, createHandler);
  app.patch('/me', { preHandler: [authenticate] }, updateHandler);

  // Public route (must be after /search, /featured, /me to avoid param capture)
  app.get<{ Params: { id: string } }>('/:id', getByIdHandler);
}
