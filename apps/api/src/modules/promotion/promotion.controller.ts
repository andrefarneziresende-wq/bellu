import type { FastifyRequest, FastifyReply } from 'fastify';
import { createPromotionSchema, updatePromotionSchema } from '@beauty/shared-validators';
import { prisma } from '../../config/prisma.js';
import { NotFoundError } from '../../shared/errors.js';
import * as promotionService from './promotion.service.js';

export async function listHandler(
  request: FastifyRequest<{ Querystring: { professionalId?: string } }>,
  reply: FastifyReply,
) {
  let { professionalId } = request.query;

  if (!professionalId) {
    const professional = await prisma.professional.findUnique({
      where: { userId: request.user.userId },
    });
    if (!professional) throw new NotFoundError('Professional profile');
    professionalId = professional.id;
  }

  const promotions = await promotionService.listByProfessional(professionalId);

  return reply.status(200).send({ success: true, data: promotions });
}

export async function getByIdHandler(
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply,
) {
  const { id } = request.params;
  const promotion = await prisma.promotion.findUnique({
    where: { id },
    include: { services: { include: { service: true } } },
  });
  if (!promotion) throw new NotFoundError('Promotion');
  return reply.status(200).send({ success: true, data: promotion });
}

export async function listActiveHandler(
  request: FastifyRequest<{ Querystring: { professionalId?: string } }>,
  reply: FastifyReply,
) {
  const { professionalId } = request.query;
  const promotions = await promotionService.listActive(professionalId);

  return reply.status(200).send({ success: true, data: promotions });
}

export async function createHandler(request: FastifyRequest, reply: FastifyReply) {
  const professional = await prisma.professional.findUnique({
    where: { userId: request.user.userId },
  });

  if (!professional) {
    throw new NotFoundError('Professional profile');
  }

  const body = createPromotionSchema.parse(request.body);

  const promotion = await promotionService.create({
    professionalId: professional.id,
    name: body.name,
    discountType: body.discountType,
    discountValue: body.discountValue,
    startDate: new Date(body.startDate),
    endDate: new Date(body.endDate),
    serviceIds: body.serviceIds,
  });

  return reply.status(201).send({ success: true, data: promotion });
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

  const body = updatePromotionSchema.parse(request.body);

  const data = {
    ...body,
    startDate: body.startDate ? new Date(body.startDate) : undefined,
    endDate: body.endDate ? new Date(body.endDate) : undefined,
  };

  const promotion = await promotionService.update(id, professional.id, data);

  return reply.status(200).send({ success: true, data: promotion });
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

  await promotionService.remove(id, professional.id);

  return reply.status(200).send({ success: true, data: null });
}
