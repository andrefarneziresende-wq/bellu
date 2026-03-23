import type { FastifyRequest, FastifyReply } from 'fastify';
import { createReviewSchema, paginationSchema } from '@beauty/shared-validators';
import { prisma } from '../../config/prisma.js';
import { NotFoundError } from '../../shared/errors.js';
import * as reviewService from './review.service.js';

export async function createHandler(request: FastifyRequest, reply: FastifyReply) {
  const body = createReviewSchema.parse(request.body);
  const review = await reviewService.createReview(request.user.userId, body);

  return reply.status(201).send({
    success: true,
    data: review,
  });
}

export async function listByProfessionalHandler(
  request: FastifyRequest<{ Params: { professionalId: string }; Querystring: { page?: string; perPage?: string } }>,
  reply: FastifyReply,
) {
  const { professionalId } = request.params;
  const { page, perPage } = paginationSchema.parse(request.query);

  const result = await reviewService.getReviewsByProfessional(professionalId, page, perPage);

  return reply.status(200).send({
    success: true,
    data: result,
  });
}

export async function listMyReviewsHandler(request: FastifyRequest, reply: FastifyReply) {
  const professional = await prisma.professional.findUnique({
    where: { userId: request.user.userId },
  });

  if (!professional) {
    throw new NotFoundError('Professional profile');
  }

  const { page, perPage } = paginationSchema.parse(request.query);
  const result = await reviewService.getReviewsByProfessional(professional.id, page, perPage);

  return reply.status(200).send({
    success: true,
    data: result,
  });
}

export async function respondHandler(
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply,
) {
  const { id } = request.params;
  const { responseText } = request.body as { responseText: string };

  if (!responseText || !responseText.trim()) {
    return reply.status(400).send({ success: false, message: 'responseText is required' });
  }

  const professional = await prisma.professional.findUnique({
    where: { userId: request.user.userId },
  });

  if (!professional) {
    throw new NotFoundError('Professional profile');
  }

  const review = await prisma.review.findUnique({ where: { id } });

  if (!review) {
    throw new NotFoundError('Review');
  }

  if (review.professionalId !== professional.id) {
    return reply.status(403).send({ success: false, message: 'You do not own this review' });
  }

  const updated = await prisma.review.update({
    where: { id },
    data: {
      responseText: responseText.trim(),
      respondedAt: new Date(),
    },
    include: {
      user: { select: { id: true, name: true, avatar: true } },
    },
  });

  return reply.status(200).send({
    success: true,
    data: updated,
  });
}

export async function getByBookingHandler(
  request: FastifyRequest<{ Params: { bookingId: string } }>,
  reply: FastifyReply,
) {
  const { bookingId } = request.params;
  const review = await reviewService.getReviewByBooking(bookingId);

  return reply.status(200).send({
    success: true,
    data: review,
  });
}
