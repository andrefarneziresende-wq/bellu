import type { FastifyRequest, FastifyReply } from 'fastify';
import { createPaymentSchema } from '@beauty/shared-validators';
import * as paymentService from './payment.service.js';

export async function createHandler(request: FastifyRequest, reply: FastifyReply) {
  const body = createPaymentSchema.parse(request.body);

  const result = await paymentService.createPayment(
    body.bookingId,
    request.user.userId,
    body.method,
  );

  return reply.status(201).send({
    success: true,
    data: {
      payment: result.payment,
      clientSecret: result.clientSecret,
    },
  });
}

export async function confirmHandler(
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply,
) {
  const { id } = request.params;
  const body = request.body as { paymentIntentId?: string; token?: string } | undefined;

  const payment = await paymentService.confirmPayment(id, body?.token);

  return reply.status(200).send({
    success: true,
    data: payment,
  });
}

export async function refundHandler(
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply,
) {
  const { id } = request.params;

  const payment = await paymentService.refundPayment(id);

  return reply.status(200).send({
    success: true,
    data: payment,
  });
}

export async function getByBookingHandler(
  request: FastifyRequest<{ Params: { bookingId: string } }>,
  reply: FastifyReply,
) {
  const { bookingId } = request.params;

  const payment = await paymentService.getPaymentByBooking(bookingId);

  return reply.status(200).send({
    success: true,
    data: payment,
  });
}
