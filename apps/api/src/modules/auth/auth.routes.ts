import type { FastifyInstance } from 'fastify';
import { registerHandler, loginHandler, refreshHandler } from './auth.controller.js';

export async function authRoutes(app: FastifyInstance) {
  app.post('/register', registerHandler);
  app.post('/login', loginHandler);
  app.post('/refresh', refreshHandler);
}
