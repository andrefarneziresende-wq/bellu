import type { FastifyInstance } from 'fastify';
import { authenticate } from '../../shared/auth-middleware.js';
import {
  createHandler,
  listByProfessionalHandler,
  listMyServicesHandler,
  listServiceTemplatesHandler,
  updateHandler,
  deleteHandler,
} from './service.controller.js';

export async function serviceRoutes(app: FastifyInstance) {
  // Public: list service catalog (templates)
  app.get('/templates', listServiceTemplatesHandler);

  // Auto-detect professional from JWT (must be before /:param routes)
  app.get('/', { preHandler: [authenticate] }, listMyServicesHandler);

  app.get<{ Params: { professionalId: string } }>('/professional/:professionalId', listByProfessionalHandler);

  app.post('/', { preHandler: [authenticate] }, createHandler);
  app.patch<{ Params: { id: string } }>('/:id', { preHandler: [authenticate] }, updateHandler);
  app.delete<{ Params: { id: string } }>('/:id', { preHandler: [authenticate] }, deleteHandler);
}
