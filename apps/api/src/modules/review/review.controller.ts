import type { FastifyRequest, FastifyReply } from 'fastify';
import { createReviewSchema, paginationSchema } from '@beauty/shared-validators';
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
