import type { FastifyRequest, FastifyReply } from 'fastify';
import { createBookingSchema, updateBookingStatusSchema, paginationSchema } from '@beauty/shared-validators';
import { prisma } from '../../config/prisma.js';
import { NotFoundError, ForbiddenError } from '../../shared/errors.js';
import * as bookingService from './booking.service.js';

export async function createHandler(request: FastifyRequest, reply: FastifyReply) {
  const body = createBookingSchema.parse(request.body);
  const booking = await bookingService.createBooking(request.user.userId, body);

  return reply.status(201).send({
    success: true,
    data: booking,
  });
}

export async function getByIdHandler(
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply,
) {
  const { id } = request.params;
  const booking = await bookingService.getBookingById(id);

  // Must be a participant
  const isProfessional = booking.professional.userId === request.user.userId;
  const isConsumer = booking.user.id === request.user.userId;

  if (!isProfessional && !isConsumer) {
    throw new ForbiddenError('You are not a participant of this booking');
  }

  return reply.status(200).send({
    success: true,
    data: booking,
  });
}

export async function listMyBookingsHandler(
  request: FastifyRequest<{ Querystring: { status?: string; page?: string; perPage?: string } }>,
  reply: FastifyReply,
) {
  const query = request.query;
  const { page, perPage } = paginationSchema.parse(query);

  const result = await bookingService.listUserBookings(
    request.user.userId,
    query.status,
    page,
    perPage,
  );

  return reply.status(200).send({
    success: true,
    data: result,
  });
}

export async function listProfessionalBookingsHandler(
  request: FastifyRequest<{ Querystring: { date?: string; status?: string; page?: string; perPage?: string } }>,
  reply: FastifyReply,
) {
  const professional = await prisma.professional.findUnique({
    where: { userId: request.user.userId },
  });

  if (!professional) {
    throw new NotFoundError('Professional profile');
  }

  const query = request.query;
  const { page, perPage } = paginationSchema.parse(query);

  const result = await bookingService.listProfessionalBookings(
    professional.id,
    query.date,
    query.status,
    page,
    perPage,
  );

  return reply.status(200).send({
    success: true,
    data: result,
  });
}

export async function updateStatusHandler(
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply,
) {
  const { id } = request.params;
  const body = updateBookingStatusSchema.parse(request.body);

  const booking = await bookingService.updateBookingStatus(id, request.user.userId, body);

  return reply.status(200).send({
    success: true,
    data: booking,
  });
}

export async function availableSlotsHandler(
  request: FastifyRequest<{ Params: { professionalId: string }; Querystring: { date: string } }>,
  reply: FastifyReply,
) {
  const { professionalId } = request.params;
  const { date } = request.query;

  const slots = await bookingService.getAvailableSlots(professionalId, date);

  return reply.status(200).send({
    success: true,
    data: slots,
  });
}
