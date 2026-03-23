import type { FastifyRequest, FastifyReply } from 'fastify';
import { prisma } from '../../config/prisma.js';
import { NotFoundError } from '../../shared/errors.js';
import * as servicePackageService from './service-package.service.js';

export async function listHandler(
  request: FastifyRequest<{ Querystring: { professionalId?: string } }>,
  reply: FastifyReply,
) {
  let { professionalId } = request.query;

  // If no professionalId provided, try to resolve from JWT
  if (!professionalId && request.user?.userId) {
    const professional = await prisma.professional.findUnique({
      where: { userId: request.user.userId },
    });
    if (professional) professionalId = professional.id;
  }

  if (!professionalId) {
    return reply.status(400).send({ success: false, message: 'professionalId is required' });
  }

  const packages = await servicePackageService.listByProfessional(professionalId);

  return reply.status(200).send({ success: true, data: packages });
}

export async function createHandler(request: FastifyRequest, reply: FastifyReply) {
  const professional = await prisma.professional.findUnique({
    where: { userId: request.user.userId },
  });

  if (!professional) {
    throw new NotFoundError('Professional profile');
  }

  const body = request.body as {
    serviceId: string;
    name: string;
    sessionsTotal: number;
    priceTotal: number;
    currency: string;
  };

  const pkg = await servicePackageService.create({
    professionalId: professional.id,
    ...body,
  });

  return reply.status(201).send({ success: true, data: pkg });
}

export async function updateHandler(
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply,
) {
  const { id } = request.params;

  const professional = await prisma.professional.findUnique({
    where: { userId: request.user.userId },
  });

  if (!professional) {
    throw new NotFoundError('Professional profile');
  }

  const body = request.body as {
    serviceId?: string;
    name?: string;
    sessionsTotal?: number;
    priceTotal?: number;
    currency?: string;
    active?: boolean;
  };

  const pkg = await servicePackageService.update(id, professional.id, body);

  return reply.status(200).send({ success: true, data: pkg });
}

export async function deleteHandler(
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply,
) {
  const { id } = request.params;

  const professional = await prisma.professional.findUnique({
    where: { userId: request.user.userId },
  });

  if (!professional) {
    throw new NotFoundError('Professional profile');
  }

  await servicePackageService.remove(id, professional.id);

  return reply.status(200).send({ success: true, data: null });
}
