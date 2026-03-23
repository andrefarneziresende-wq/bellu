import { FastifyRequest, FastifyReply } from 'fastify';
import { updateUserSchema, createClientSchema } from '@beauty/shared-validators';
import { getUserById, updateUser, deleteUser, listUsers, createUser } from './user.service.js';

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

export async function listUsersHandler(request: FastifyRequest, reply: FastifyReply) {
  try {
    const { prisma } = await import('../../config/prisma.js');
    const professional = await prisma.professional.findFirst({
      where: { userId: request.user.userId },
    });

    const users = await listUsers(professional?.id);
    return reply.send({ success: true, data: users });
  } catch (err) {
    request.log.error(err, 'listUsersHandler error');
    throw err;
  }
}

export async function updateUserByIdHandler(
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply,
) {
  const data = updateUserSchema.parse(request.body);
  const user = await updateUser(request.params.id, data);
  return reply.send({ success: true, data: user });
}

export async function deleteUserByIdHandler(
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply,
) {
  await deleteUser(request.params.id);
  return reply.send({ success: true, data: null });
}

export async function createUserHandler(request: FastifyRequest, reply: FastifyReply) {
  const body = createClientSchema.parse(request.body);

  const user = await createUser({
    name: body.name,
    phone: body.phone,
    email: body.email,
    role: body.role,
  });

  return reply.status(201).send({ success: true, data: user });
}
