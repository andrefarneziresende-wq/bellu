import type { FastifyRequest, FastifyReply } from 'fastify';
import { prisma } from '../../config/prisma.js';
import { NotFoundError } from '../../shared/errors.js';
import * as clientPackageService from './client-package.service.js';

/**
 * POST /api/client-packages
 * Purchase a package (optionally with session dates).
 */
export async function purchaseHandler(request: FastifyRequest, reply: FastifyReply) {
  const { servicePackageId, sessions, userId: bodyUserId } = request.body as {
    servicePackageId: string;
    sessions?: Array<{ date: string; startTime: string }>;
    userId?: string;
  };

  // If a userId is provided in the body (professional selling to a client), use it;
  // otherwise use the authenticated user's ID (client buying for themselves).
  const targetUserId = bodyUserId || request.user.userId;

  let result;

  if (sessions && sessions.length > 0) {
    result = await clientPackageService.purchaseWithSessions(
      targetUserId,
      servicePackageId,
      sessions,
    );
  } else {
    result = await clientPackageService.purchase({
      userId: targetUserId,
      servicePackageId,
    });
  }

  return reply.status(201).send({ success: true, data: result });
}

/**
 * GET /api/client-packages/my
 * List my purchased packages (client view).
 */
export async function listMyHandler(
  request: FastifyRequest<{ Querystring: { status?: string } }>,
  reply: FastifyReply,
) {
  const packages = await clientPackageService.listByUser(
    request.user.userId,
    request.query.status,
  );

  return reply.status(200).send({ success: true, data: packages });
}

/**
 * GET /api/client-packages/professional
 * List client packages for my clinic (professional view).
 */
export async function listProfessionalHandler(
  request: FastifyRequest<{ Querystring: { status?: string } }>,
  reply: FastifyReply,
) {
  const professional = await prisma.professional.findUnique({
    where: { userId: request.user.userId },
  });

  if (!professional) throw new NotFoundError('Professional profile');

  const packages = await clientPackageService.listByProfessional(
    professional.id,
    request.query.status,
  );

  return reply.status(200).send({ success: true, data: packages });
}

/**
 * GET /api/client-packages/:id
 * Get package details with all sessions and photos.
 */
export async function getByIdHandler(
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply,
) {
  const pkg = await clientPackageService.getById(request.params.id);

  // Security: only client or professional can view
  const professional = await prisma.professional.findUnique({
    where: { userId: request.user.userId },
  });

  if (pkg.userId !== request.user.userId && pkg.professionalId !== professional?.id) {
    return reply.status(403).send({ success: false, message: 'Access denied' });
  }

  return reply.status(200).send({ success: true, data: pkg });
}
