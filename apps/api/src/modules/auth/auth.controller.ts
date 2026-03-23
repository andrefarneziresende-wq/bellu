import type { FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { registerSchema, loginSchema, refreshTokenSchema } from '@beauty/shared-validators';
import * as authService from './auth.service.js';

const forgotPasswordSchema = z.object({
  email: z.string().email(),
});

const resetPasswordSchema = z.object({
  email: z.string().email(),
  code: z.string().length(6),
  newPassword: z.string().min(6),
});

const googleSignInSchema = z.object({
  idToken: z.string().min(1),
  countryId: z.string().min(1),
  locale: z.string().min(1),
});

const appleSignInSchema = z.object({
  identityToken: z.string().min(1),
  fullName: z
    .object({
      givenName: z.string().optional(),
      familyName: z.string().optional(),
    })
    .optional(),
  email: z.string().email().optional(),
  countryId: z.string().min(1),
  locale: z.string().min(1),
});

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

export async function forgotPasswordHandler(request: FastifyRequest, reply: FastifyReply) {
  const body = forgotPasswordSchema.parse(request.body);
  const result = await authService.forgotPassword(body.email);

  return reply.status(200).send({
    success: true,
    data: result,
  });
}

export async function resetPasswordHandler(request: FastifyRequest, reply: FastifyReply) {
  const body = resetPasswordSchema.parse(request.body);
  const result = await authService.resetPassword(body.email, body.code, body.newPassword);

  return reply.status(200).send({
    success: true,
    data: result,
  });
}

export async function googleSignInHandler(request: FastifyRequest, reply: FastifyReply) {
  const body = googleSignInSchema.parse(request.body);
  const result = await authService.googleSignIn(body, request.server);

  return reply.status(200).send({
    success: true,
    data: result,
  });
}

export async function appleSignInHandler(request: FastifyRequest, reply: FastifyReply) {
  const body = appleSignInSchema.parse(request.body);
  const result = await authService.appleSignIn(body, request.server);

  return reply.status(200).send({
    success: true,
    data: result,
  });
}
