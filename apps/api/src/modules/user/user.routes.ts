import { FastifyInstance } from 'fastify';
import { authenticate } from '../../shared/auth-middleware.js';
import { getMeHandler, updateMeHandler, deleteMeHandler } from './user.controller.js';

export async function userRoutes(app: FastifyInstance) {
  app.get('/me', { preHandler: [authenticate] }, getMeHandler);
  app.patch('/me', { preHandler: [authenticate] }, updateMeHandler);
  app.delete('/me', { preHandler: [authenticate] }, deleteMeHandler);
}
