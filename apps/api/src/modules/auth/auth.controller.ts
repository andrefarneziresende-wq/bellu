import type { FastifyRequest, FastifyReply } from 'fastify';
import { registerSchema, loginSchema, refreshTokenSchema } from '@beauty/shared-validators';
import * as authService from './auth.service.js';

export async function registerHandler(request: FastifyRequest, reply: FastifyReply) {
  const body = registerSchema.parse(request.body);
  const result = await authService.register(body, request.server);

  return reply.status(201).send({
    success: true,
    data: result,
  });
}

export async function loginHandler(request: FastifyRequest, reply: FastifyReply) {
  const body = loginSchema.parse(request.body);
  const result = await authService.login(body, request.server);

  return reply.status(200).send({
    success: true,
    data: result,
  });
}

export async function refreshHandler(request: FastifyRequest, reply: FastifyReply) {
  const body = refreshTokenSchema.parse(request.body);
  const result = await authService.refreshToken(body.refreshToken, request.server);

  return reply.status(200).send({
    success: true,
    data: result,
  });
}
