import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { authenticate } from '../../shared/auth-middleware.js';
import { resolveProContext } from './pro-auth.service.js';

export async function proAuthRoutes(app: FastifyInstance) {
  /**
   * GET /api/pro/me — Returns the pro context for the logged-in user
   * Used by pro-dashboard and mobile-pro to determine role and permissions
   */
  app.get('/me', { preHandler: [authenticate] }, async (request: FastifyRequest, reply: FastifyReply) => {
    const context = await resolveProContext(request.user.userId);
    return reply.send({ success: true, data: context });
  });
}
