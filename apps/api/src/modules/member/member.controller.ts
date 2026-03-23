import type { FastifyRequest, FastifyReply } from 'fastify';
import { createMemberSchema, updateMemberSchema } from '@beauty/shared-validators';
import { prisma } from '../../config/prisma.js';
import { NotFoundError } from '../../shared/errors.js';
import * as memberService from './member.service.js';

export async function listHandler(
  request: FastifyRequest<{ Querystring: { professionalId: string } }>,
  reply: FastifyReply,
) {
  const { professionalId } = request.query;
  const members = await memberService.listByProfessional(professionalId);

  return reply.status(200).send({ success: true, data: members });
}

export async function getByIdHandler(
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply,
) {
  const member = await memberService.getById(request.params.id);

  return reply.status(200).send({ success: true, data: member });
}

export async function createHandler(request: FastifyRequest, reply: FastifyReply) {
  const professional = await prisma.professional.findUnique({
    where: { userId: request.user.userId },
  });

  if (!professional) {
    throw new NotFoundError('Professional profile');
  }

  const body = createMemberSchema.parse(request.body);

  const member = await memberService.create({
    professionalId: professional.id,
    ...body,
  });

  return reply.status(201).send({ success: true, data: member });
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

  const body = updateMemberSchema.parse(request.body);

  const member = await memberService.update(id, professional.id, body);

  return reply.status(200).send({ success: true, data: member });
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

  await memberService.remove(id, professional.id);

  return reply.status(200).send({ success: true, data: null });
}

export async function linkAccountHandler(
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply,
) {
  const { id } = request.params;
  const { email, tempPassword } = request.body as { email: string; tempPassword: string };

  const professional = await prisma.professional.findUnique({
    where: { userId: request.user.userId },
  });

  if (!professional) {
    throw new NotFoundError('Professional profile');
  }

  const member = await memberService.linkUserAccount(id, professional.id, email, tempPassword);

  return reply.status(200).send({ success: true, data: member });
}
