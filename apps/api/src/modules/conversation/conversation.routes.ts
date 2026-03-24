import type { FastifyInstance } from 'fastify';
import { authenticate } from '../../shared/auth-middleware.js';
import * as service from './conversation.service.js';

export async function conversationRoutes(app: FastifyInstance) {
  // Create or get conversation with a professional
  app.post<{ Body: { professionalId: string } }>(
    '/',
    { preHandler: [authenticate] },
    async (request, reply) => {
      const { professionalId } = request.body as { professionalId: string };
      if (!professionalId) {
        return reply.status(400).send({ success: false, message: 'professionalId is required' });
      }
      const conversation = await service.getOrCreateConversation(
        request.user.userId,
        professionalId,
      );
      return reply.status(200).send({ success: true, data: conversation });
    },
  );

  // List user's conversations
  app.get(
    '/',
    { preHandler: [authenticate] },
    async (request, reply) => {
      const conversations = await service.listConversations(request.user.userId);
      return reply.status(200).send({ success: true, data: conversations });
    },
  );

  // Get messages in a conversation
  app.get<{ Params: { id: string }; Querystring: { page?: string } }>(
    '/:id/messages',
    { preHandler: [authenticate] },
    async (request, reply) => {
      const page = parseInt(request.query.page || '1', 10);
      const result = await service.getMessages(request.params.id, request.user.userId, page);
      return reply.status(200).send({ success: true, data: result });
    },
  );

  // Send a message (text or image)
  app.post<{ Params: { id: string }; Body: { message?: string; imageUrl?: string } }>(
    '/:id/messages',
    { preHandler: [authenticate] },
    async (request, reply) => {
      const { message, imageUrl } = request.body as { message?: string; imageUrl?: string };
      const result = await service.sendMessage(
        request.params.id,
        request.user.userId,
        message,
        imageUrl,
      );
      return reply.status(201).send({ success: true, data: result });
    },
  );

  // Mark messages as read
  app.patch<{ Params: { id: string } }>(
    '/:id/read',
    { preHandler: [authenticate] },
    async (request, reply) => {
      const result = await service.markAsRead(request.params.id, request.user.userId);
      return reply.status(200).send({ success: true, data: result });
    },
  );

  // Get unread count across all conversations
  app.get(
    '/unread-count',
    { preHandler: [authenticate] },
    async (request, reply) => {
      const result = await service.getUnreadCount(request.user.userId);
      return reply.status(200).send({ success: true, data: result });
    },
  );
}
