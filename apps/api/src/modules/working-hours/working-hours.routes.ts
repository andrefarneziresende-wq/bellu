import type { FastifyInstance } from 'fastify';
import { authenticate } from '../../shared/auth-middleware.js';
import {
  getHandler,
  setHandler,
  slotsHandler,
} from './working-hours.controller.js';

export async function workingHoursRoutes(app: FastifyInstance) {
  app.get<{ Querystring: { professionalId: string } }>('/', getHandler);
  app.get<{ Querystring: { professionalId: string; date: string } }>('/slots', slotsHandler);

  app.put('/', { preHandler: [authenticate] }, setHandler);
}
