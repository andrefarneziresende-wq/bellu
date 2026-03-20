import { FastifyRequest, FastifyReply } from 'fastify';
import { updateUserSchema } from '@beauty/shared-validators';
import { getUserById, updateUser, deleteUser } from './user.service.js';

export async function getMeHandler(request: FastifyRequest, reply: FastifyReply) {
  const user = await getUserById(request.user.userId);
  return reply.send({ success: true, data: user });
}

export async function updateMeHandler(request: FastifyRequest, reply: FastifyReply) {
  const data = updateUserSchema.parse(request.body);
  const user = await updateUser(request.user.userId, data);
  return reply.send({ success: true, data: user });
}

export async function deleteMeHandler(request: FastifyRequest, reply: FastifyReply) {
  await deleteUser(request.user.userId);
  return reply.send({ success: true, data: null });
}
