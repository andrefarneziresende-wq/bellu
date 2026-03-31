import { FastifyRequest, FastifyReply } from 'fastify';
import {
  createSessionGroup,
  listSessionGroups,
  getSessionGroupById,
  scheduleSession,
  cancelSessionGroup,
} from './session-group.service.js';

export async function createHandler(
  request: FastifyRequest<{
    Body: {
      serviceId?: string;
      customServiceName?: string;
      clientName?: string;
      clientPhone?: string;
      userId?: string;
      totalSessions: number;
      priceType: 'PER_SESSION' | 'CUSTOM_TOTAL';
      totalPrice?: number;
      sessionPrice?: number;
      currency?: string;
      notes?: string;
      sessions: { date?: string; startTime?: string; notes?: string }[];
    };
  }>,
  reply: FastifyReply,
) {
  const professionalId = request.user.professionalId!;
  const result = await createSessionGroup({
    professionalId,
    ...request.body,
  });
  return reply.status(201).send({ data: result });
}

export async function listHandler(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const professionalId = request.user.professionalId!;
  const data = await listSessionGroups(professionalId);
  return reply.send({ data });
}

export async function getByIdHandler(
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply,
) {
  const professionalId = request.user.professionalId!;
  const data = await getSessionGroupById(request.params.id, professionalId);
  return reply.send({ data });
}

export async function scheduleSessionHandler(
  request: FastifyRequest<{
    Params: { id: string };
    Body: { date: string; startTime: string; notes?: string };
  }>,
  reply: FastifyReply,
) {
  const professionalId = request.user.professionalId!;
  const data = await scheduleSession({
    sessionGroupId: request.params.id,
    professionalId,
    ...request.body,
  });
  return reply.status(201).send({ data });
}

export async function cancelHandler(
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply,
) {
  const professionalId = request.user.professionalId!;
  const data = await cancelSessionGroup(request.params.id, professionalId);
  return reply.send({ data });
}
