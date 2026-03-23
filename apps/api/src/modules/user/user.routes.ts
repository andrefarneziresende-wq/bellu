import { FastifyInstance } from 'fastify';
import { authenticate } from '../../shared/auth-middleware.js';
import { getMeHandler, updateMeHandler, deleteMeHandler, listUsersHandler, createUserHandler, updateUserByIdHandler, deleteUserByIdHandler } from './user.controller.js';

export async function userRoutes(app: FastifyInstance) {
  app.get('/', { preHandler: [authenticate] }, listUsersHandler);
  app.post('/', { preHandler: [authenticate] }, createUserHandler);
  app.get('/me', { preHandler: [authenticate] }, getMeHandler);
  app.patch('/me', { preHandler: [authenticate] }, updateMeHandler);
  app.delete('/me', { preHandler: [authenticate] }, deleteMeHandler);
  app.patch<{ Params: { id: string } }>('/:id', { preHandler: [authenticate] }, updateUserByIdHandler);
  app.delete<{ Params: { id: string } }>('/:id', { preHandler: [authenticate] }, deleteUserByIdHandler);
}
