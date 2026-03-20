import { FastifyRequest, FastifyReply } from 'fastify';
import { UnauthorizedError } from './errors.js';

export interface JwtPayload {
  userId: string;
  email: string | null;
  locale: string;
}

declare module '@fastify/jwt' {
  interface FastifyJWT {
    payload: JwtPayload;
    user: JwtPayload;
  }
}

export async function authenticate(request: FastifyRequest, reply: FastifyReply) {
  try {
    await request.jwtVerify();
  } catch {
    throw new UnauthorizedError('Invalid or expired token');
  }
}
