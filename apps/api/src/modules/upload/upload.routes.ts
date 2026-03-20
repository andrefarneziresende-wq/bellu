import type { FastifyInstance } from 'fastify';
import { authenticate } from '../../shared/auth-middleware.js';
import { uploadHandler, deleteHandler } from './upload.controller.js';

export async function uploadRoutes(app: FastifyInstance) {
  app.post('/', { preHandler: [authenticate] }, uploadHandler);
  app.delete('/', { preHandler: [authenticate] }, deleteHandler);
}
