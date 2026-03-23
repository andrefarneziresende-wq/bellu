import type { FastifyInstance } from 'fastify';
import { authenticate } from '../../shared/auth-middleware.js';
import {
  listHandler,
  getByIdHandler,
  createHandler,
  updateHandler,
  deleteHandler,
  linkAccountHandler,
} from './member.controller.js';

export async function memberRoutes(app: FastifyInstance) {
  // Public routes
  app.get<{ Querystring: { professionalId: string } }>('/', listHandler);
  app.get<{ Params: { id: string } }>('/:id', getByIdHandler);

  // Authenticated routes
  app.post('/', { preHandler: [authenticate] }, createHandler);
  app.put<{ Params: { id: string } }>('/:id', { preHandler: [authenticate] }, updateHandler);
  app.patch<{ Params: { id: string } }>('/:id', { preHandler: [authenticate] }, updateHandler);
  app.delete<{ Params: { id: string } }>('/:id', { preHandler: [authenticate] }, deleteHandler);

  // Link a user account to a staff member (creates login for the staff)
  app.post<{ Params: { id: string } }>('/:id/link-account', { preHandler: [authenticate] }, linkAccountHandler);
}
