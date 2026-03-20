import type { FastifyRequest, FastifyReply } from 'fastify';
import { paginationSchema } from '@beauty/shared-validators';
import * as favoriteService from './favorite.service.js';

export async function toggleHandler(
  request: FastifyRequest<{ Body: { professionalId: string } }>,
  reply: FastifyReply,
) {
  const { professionalId } = request.body;
  const result = await favoriteService.toggleFavorite(request.user.userId, professionalId);

  return reply.status(200).send({
    success: true,
    data: result,
  });
}

export async function listHandler(
  request: FastifyRequest<{ Querystring: { page?: string; perPage?: string } }>,
  reply: FastifyReply,
) {
  const { page, perPage } = paginationSchema.parse(request.query);
  const result = await favoriteService.listByUser(request.user.userId, page, perPage);

  return reply.status(200).send({
    success: true,
    data: result,
  });
}

export async function checkHandler(
  request: FastifyRequest<{ Params: { professionalId: string } }>,
  reply: FastifyReply,
) {
  const { professionalId } = request.params;
  const favorited = await favoriteService.isFavorited(request.user.userId, professionalId);

  return reply.status(200).send({
    success: true,
    data: { favorited },
  });
}
