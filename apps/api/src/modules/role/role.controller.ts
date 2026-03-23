import type { FastifyRequest, FastifyReply } from 'fastify';
import { createRoleSchema, updateRoleSchema } from '@beauty/shared-validators';
import { prisma } from '../../config/prisma.js';
import { NotFoundError } from '../../shared/errors.js';
import * as roleService from './role.service.js';

async function getProfessionalId(request: FastifyRequest) {
  const professional = await prisma.professional.findUnique({
    where: { userId: request.user.userId },
  });
  if (!professional) throw new NotFoundError('Professional profile');
  return professional.id;
}

export async function listHandler(request: FastifyRequest, reply: FastifyReply) {
  const proId = await getProfessionalId(request);
  const roles = await roleService.listByProfessional(proId);
  return reply.status(200).send({ success: true, data: roles });
}

export async function getByIdHandler(
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply,
) {
  const role = await roleService.getById(request.params.id);
  return reply.status(200).send({ success: true, data: role });
}

export async function permissionsHandler(_request: FastifyRequest, reply: FastifyReply) {
  return reply.status(200).send({
    success: true,
    data: {
      all: roleService.ALL_PERMISSIONS,
      groups: roleService.PERMISSION_GROUPS,
    },
  });
}

export async function createHandler(request: FastifyRequest, reply: FastifyReply) {
  const proId = await getProfessionalId(request);
  const body = createRoleSchema.parse(request.body);
  const role = await roleService.create(proId, body);
  return reply.status(201).send({ success: true, data: role });
}

export async function updateHandler(
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply,
) {
  const proId = await getProfessionalId(request);
  const body = updateRoleSchema.parse(request.body);
  const role = await roleService.update(request.params.id, proId, body);
  return reply.status(200).send({ success: true, data: role });
}

export async function deleteHandler(
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply,
) {
  const proId = await getProfessionalId(request);
  await roleService.remove(request.params.id, proId);
  return reply.status(200).send({ success: true, data: null });
}
