import type { FastifyRequest, FastifyReply } from 'fastify';
import { setWorkingHoursSchema } from '@beauty/shared-validators';
import { prisma } from '../../config/prisma.js';
import { NotFoundError } from '../../shared/errors.js';
import * as workingHoursService from './working-hours.service.js';

export async function getHandler(
  request: FastifyRequest<{ Querystring: { professionalId: string } }>,
  reply: FastifyReply,
) {
  const { professionalId } = request.query;
  const hours = await workingHoursService.getByProfessional(professionalId);

  return reply.status(200).send({
    success: true,
    data: hours,
  });
}

export async function setHandler(request: FastifyRequest, reply: FastifyReply) {
  const hours = setWorkingHoursSchema.parse(request.body);

  const professional = await prisma.professional.findUnique({
    where: { userId: request.user.userId },
  });

  if (!professional) {
    throw new NotFoundError('Professional profile');
  }

  const result = await workingHoursService.setHours(
    professional.id,
    request.user.userId,
    hours,
  );

  return reply.status(200).send({
    success: true,
    data: result,
  });
}

export async function slotsHandler(
  request: FastifyRequest<{ Querystring: { professionalId: string; date: string } }>,
  reply: FastifyReply,
) {
  const { professionalId, date } = request.query;
  const slots = await workingHoursService.getAvailableSlots(professionalId, date);

  return reply.status(200).send({
    success: true,
    data: slots,
  });
}
