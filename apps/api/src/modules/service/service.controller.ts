import type { FastifyRequest, FastifyReply } from 'fastify';
import { createServiceSchema, updateServiceSchema } from '@beauty/shared-validators';
import { prisma } from '../../config/prisma.js';
import { NotFoundError } from '../../shared/errors.js';
import * as serviceService from './service.service.js';

export async function listServiceTemplatesHandler(request: FastifyRequest, reply: FastifyReply) {
  const templates = await prisma.serviceTemplate.findMany({
    where: { active: true },
    orderBy: [{ order: 'asc' }, { name: 'asc' }],
    include: {
      category: { include: { translations: true } },
    },
  });

  return reply.status(200).send({ success: true, data: templates });
}

export async function createHandler(request: FastifyRequest, reply: FastifyReply) {
  const body = createServiceSchema.parse(request.body);

  const professional = await prisma.professional.findUnique({
    where: { userId: request.user.userId },
  });

  if (!professional) {
    throw new NotFoundError('Professional profile');
  }

  const service = await serviceService.createService(professional.id, body);

  return reply.status(201).send({
    success: true,
    data: service,
  });
}

export async function listMyServicesHandler(request: FastifyRequest, reply: FastifyReply) {
  const professional = await prisma.professional.findUnique({
    where: { userId: request.user.userId },
  });

  if (!professional) {
    throw new NotFoundError('Professional profile');
  }

  const services = await serviceService.getServicesByProfessional(professional.id);

  return reply.status(200).send({
    success: true,
    data: services,
  });
}

export async function listByProfessionalHandler(
  request: FastifyRequest<{ Params: { professionalId: string } }>,
  reply: FastifyReply,
) {
  const { professionalId } = request.params;
  const services = await serviceService.getServicesByProfessional(professionalId);

  return reply.status(200).send({
    success: true,
    data: services,
  });
}

export async function updateHandler(
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply,
) {
  const body = updateServiceSchema.parse(request.body);
  const { id } = request.params;

  const professional = await prisma.professional.findUnique({
    where: { userId: request.user.userId },
  });

  if (!professional) {
    throw new NotFoundError('Professional profile');
  }

  const service = await serviceService.updateService(id, professional.id, body);

  return reply.status(200).send({
    success: true,
    data: service,
  });
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

  await serviceService.deleteService(id, professional.id);

  return reply.status(200).send({
    success: true,
    data: null,
  });
}
