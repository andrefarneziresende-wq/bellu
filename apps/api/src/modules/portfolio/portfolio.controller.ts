import type { FastifyRequest, FastifyReply } from 'fastify';
import { createPortfolioItemSchema, paginationSchema } from '@beauty/shared-validators';
import { prisma } from '../../config/prisma.js';
import { NotFoundError } from '../../shared/errors.js';
import * as portfolioService from './portfolio.service.js';

export async function listHandler(
  request: FastifyRequest<{ Querystring: { professionalId: string; page?: string; perPage?: string } }>,
  reply: FastifyReply,
) {
  const { professionalId } = request.query;
  const { page, perPage } = paginationSchema.parse(request.query);

  const result = await portfolioService.getByProfessional(professionalId, page, perPage);

  return reply.status(200).send({
    success: true,
    data: result,
  });
}

export async function getHandler(
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply,
) {
  const { id } = request.params;
  const item = await portfolioService.getById(id);

  return reply.status(200).send({
    success: true,
    data: item,
  });
}

export async function createHandler(request: FastifyRequest, reply: FastifyReply) {
  const body = createPortfolioItemSchema.parse(request.body);

  const professional = await prisma.professional.findUnique({
    where: { userId: request.user.userId },
  });

  if (!professional) {
    throw new NotFoundError('Professional profile');
  }

  const item = await portfolioService.create(
    professional.id,
    request.user.userId,
    body,
  );

  return reply.status(201).send({
    success: true,
    data: item,
  });
}

export async function deleteHandler(
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply,
) {
  const { id } = request.params;
  await portfolioService.deleteItem(id, request.user.userId);

  return reply.status(200).send({
    success: true,
    message: 'Portfolio item deleted',
  });
}
