import type { FastifyInstance } from 'fastify';
import { authenticate } from '../../shared/auth-middleware.js';
import {
  createHandler,
  listByProfessionalHandler,
  updateHandler,
  deleteHandler,
} from './service.controller.js';

export async function serviceRoutes(app: FastifyInstance) {
  app.get<{ Params: { professionalId: string } }>('/professional/:professionalId', listByProfessionalHandler);

  app.post('/', { preHandler: [authenticate] }, createHandler);
  app.patch<{ Params: { id: string } }>('/:id', { preHandler: [authenticate] }, updateHandler);
  app.delete<{ Params: { id: string } }>('/:id', { preHandler: [authenticate] }, deleteHandler);
}
