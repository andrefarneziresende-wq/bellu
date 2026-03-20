import type { FastifyRequest, FastifyReply } from 'fastify';
import { sendMessageSchema, paginationSchema } from '@beauty/shared-validators';
import * as chatService from './chat.service.js';

export async function listHandler(
  request: FastifyRequest<{ Params: { bookingId: string }; Querystring: { page?: string; perPage?: string } }>,
  reply: FastifyReply,
) {
  const { bookingId } = request.params;
  const { page, perPage } = paginationSchema.parse(request.query);

  const result = await chatService.getMessagesByBooking(
    bookingId,
    request.user.userId,
    page,
    perPage,
  );

  return reply.status(200).send({
    success: true,
    data: result,
  });
}

export async function sendHandler(request: FastifyRequest, reply: FastifyReply) {
  const body = sendMessageSchema.parse(request.body);

  const message = await chatService.sendMessage(
    body.bookingId,
    request.user.userId,
    body.receiverId,
    body.message,
  );

  return reply.status(201).send({
    success: true,
    data: message,
  });
}

export async function markReadHandler(
  request: FastifyRequest<{ Params: { bookingId: string } }>,
  reply: FastifyReply,
) {
  const { bookingId } = request.params;
  const result = await chatService.markAsRead(bookingId, request.user.userId);

  return reply.status(200).send({
    success: true,
    data: result,
  });
}

export async function unreadCountHandler(request: FastifyRequest, reply: FastifyReply) {
  const result = await chatService.getUnreadCount(request.user.userId);

  return reply.status(200).send({
    success: true,
    data: result,
  });
}
