import type { FastifyInstance } from 'fastify';
import { authenticate } from '../../shared/auth-middleware.js';
import {
  listHandler,
  getByIdHandler,
  permissionsHandler,
  createHandler,
  updateHandler,
  deleteHandler,
} from './role.controller.js';

export async function roleRoutes(app: FastifyInstance) {
  // All routes require authentication
  app.addHook('preHandler', authenticate);

  app.get('/', listHandler);
  app.get('/permissions', permissionsHandler);
  app.get<{ Params: { id: string } }>('/:id', getByIdHandler);
  app.post('/', createHandler);
  app.put<{ Params: { id: string } }>('/:id', updateHandler);
  app.delete<{ Params: { id: string } }>('/:id', deleteHandler);
}
