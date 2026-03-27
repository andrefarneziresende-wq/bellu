import type { FastifyInstance } from 'fastify';
import { authenticate } from '../../shared/auth-middleware.js';
import {
  listHandler,
  getByIdHandler,
  summaryHandler,
  createHandler,
  updateHandler,
  deleteHandler,
} from './expense.controller.js';

export async function expenseRoutes(app: FastifyInstance) {
  app.get<{
    Querystring: { professionalId?: string; startDate?: string; endDate?: string; category?: string };
  }>('/', { preHandler: [authenticate] }, listHandler);

  app.get<{
    Querystring: { professionalId?: string; startDate: string; endDate: string };
  }>('/summary', { preHandler: [authenticate] }, summaryHandler);

  app.get<{ Params: { id: string } }>('/:id', { preHandler: [authenticate] }, getByIdHandler);

  app.post('/', { preHandler: [authenticate] }, createHandler);
  app.patch<{ Params: { id: string } }>('/:id', { preHandler: [authenticate] }, updateHandler);
  app.delete<{ Params: { id: string } }>('/:id', { preHandler: [authenticate] }, deleteHandler);
}
