import type { FastifyRequest, FastifyReply } from 'fastify';
import * as adminRoleService from './admin-role.service.js';

export async function listHandler(_request: FastifyRequest, reply: FastifyReply) {
  const roles = await adminRoleService.listAdminRoles();
  return reply.status(200).send({ success: true, data: roles });
}

export async function getByIdHandler(
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply,
) {
  const role = await adminRoleService.getAdminRoleById(request.params.id);
  return reply.status(200).send({ success: true, data: role });
}

export async function permissionsHandler(_request: FastifyRequest, reply: FastifyReply) {
  return reply.status(200).send({
    success: true,
    data: {
      all: adminRoleService.ADMIN_PERMISSIONS,
      groups: adminRoleService.ADMIN_PERMISSION_GROUPS,
    },
  });
}

export async function createHandler(request: FastifyRequest, reply: FastifyReply) {
  const body = request.body as { name: string; description?: string; permissions: string[] };
  const role = await adminRoleService.createAdminRole(body);
  return reply.status(201).send({ success: true, data: role });
}

export async function updateHandler(
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply,
) {
  const body = request.body as { name?: string; description?: string; permissions?: string[] };
  const role = await adminRoleService.updateAdminRole(request.params.id, body);
  return reply.status(200).send({ success: true, data: role });
}

export async function deleteHandler(
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply,
) {
  await adminRoleService.removeAdminRole(request.params.id);
  return reply.status(200).send({ success: true, data: null });
}
