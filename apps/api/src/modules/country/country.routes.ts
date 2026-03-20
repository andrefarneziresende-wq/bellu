import type { FastifyInstance } from 'fastify';
import { listHandler, getByIdHandler, getByCodeHandler } from './country.controller.js';

export async function countryRoutes(app: FastifyInstance) {
  app.get('/', listHandler);
  app.get<{ Params: { id: string } }>('/:id', getByIdHandler);
  app.get<{ Params: { code: string } }>('/code/:code', getByCodeHandler);
}
