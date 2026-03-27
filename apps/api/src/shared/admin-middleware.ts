import { FastifyRequest, FastifyReply } from 'fastify';
import { prisma } from '../config/prisma.js';
import { ForbiddenError } from './errors.js';

/**
 * Middleware that verifies the authenticated user is an active admin.
 * Must be used after `authenticate`.
 */
export async function requireAdmin(request: FastifyRequest, _reply: FastifyReply) {
  if (!request.user.email) {
    throw new ForbiddenError('Admin access required');
  }

  const admin = await prisma.adminUser.findFirst({
    where: { email: request.user.email, active: true },
  });

  if (!admin) {
    throw new ForbiddenError('Admin access required');
  }
}
