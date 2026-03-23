import type { FastifyInstance } from 'fastify';
import { authenticate } from '../../shared/auth-middleware.js';
import {
  purchaseHandler,
  listMyHandler,
  listProfessionalHandler,
  getByIdHandler,
} from './client-package.controller.js';

export async function clientPackageRoutes(app: FastifyInstance) {
  // All routes require authentication
  app.addHook('preHandler', authenticate);

  app.post('/', purchaseHandler);
  app.get('/my', listMyHandler);
  app.get<{ Querystring: { status?: string } }>('/professional', listProfessionalHandler);
  app.get<{ Params: { id: string } }>('/:id', getByIdHandler);
}
