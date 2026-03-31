import type { FastifyInstance } from 'fastify';
import { authenticate } from '../../shared/auth-middleware.js';
import {
  createHandler,
  listHandler,
  getByIdHandler,
  scheduleSessionHandler,
  cancelHandler,
} from './session-group.controller.js';

export async function sessionGroupRoutes(app: FastifyInstance) {
  app.post('/', { preHandler: [authenticate] }, createHandler);
  app.get('/', { preHandler: [authenticate] }, listHandler);
  app.get<{ Params: { id: string } }>('/:id', { preHandler: [authenticate] }, getByIdHandler);
  app.post<{ Params: { id: string } }>('/:id/schedule', { preHandler: [authenticate] }, scheduleSessionHandler);
  app.patch<{ Params: { id: string } }>('/:id/cancel', { preHandler: [authenticate] }, cancelHandler);
}
