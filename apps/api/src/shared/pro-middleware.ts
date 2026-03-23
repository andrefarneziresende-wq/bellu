import { FastifyRequest, FastifyReply } from 'fastify';
import { resolveProContext, type ProContext } from '../modules/pro-auth/pro-auth.service.js';
import { ForbiddenError } from './errors.js';

// Extend FastifyRequest to include proContext
declare module 'fastify' {
  interface FastifyRequest {
    proContext?: ProContext;
  }
}

/**
 * Middleware that resolves the pro context and attaches it to the request.
 * Must be used after `authenticate`.
 */
export async function requireProContext(request: FastifyRequest, _reply: FastifyReply) {
  const context = await resolveProContext(request.user.userId);
  request.proContext = context;
}

/**
 * Creates a middleware that checks if the user has the required permission.
 * Must be used after `requireProContext`.
 */
export function requirePermission(...permissions: string[]) {
  return async (request: FastifyRequest, _reply: FastifyReply) => {
    const ctx = request.proContext;
    if (!ctx) {
      throw new ForbiddenError('No professional context');
    }

    // Owner has all permissions
    if (ctx.permissions.includes('*')) return;

    // Check if user has at least one of the required permissions
    const hasAny = permissions.some((p) => ctx.permissions.includes(p));
    if (!hasAny) {
      throw new ForbiddenError(`Missing required permission: ${permissions.join(' or ')}`);
    }
  };
}
