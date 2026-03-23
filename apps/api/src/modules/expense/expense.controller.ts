import type { FastifyRequest, FastifyReply } from 'fastify';
import { createExpenseSchema, updateExpenseSchema } from '@beauty/shared-validators';
import { prisma } from '../../config/prisma.js';
import { NotFoundError, BadRequestError } from '../../shared/errors.js';
import * as expenseService from './expense.service.js';

export async function listHandler(
  request: FastifyRequest<{
    Querystring: { professionalId?: string; startDate?: string; endDate?: string; category?: string };
  }>,
  reply: FastifyReply,
) {
  let { professionalId } = request.query;
  const { startDate, endDate, category } = request.query;

  if (!professionalId) {
    const professional = await prisma.professional.findUnique({
      where: { userId: request.user.userId },
    });
    if (!professional) throw new NotFoundError('Professional profile');
    professionalId = professional.id;
  }

  const expenses = await expenseService.listByProfessional(professionalId, {
    startDate: startDate ? new Date(startDate) : undefined,
    endDate: endDate ? new Date(endDate) : undefined,
    category,
  });

  return reply.status(200).send({ success: true, data: expenses });
}

export async function summaryHandler(
  request: FastifyRequest<{
    Querystring: { professionalId: string; startDate: string; endDate: string };
  }>,
  reply: FastifyReply,
) {
  const { professionalId, startDate, endDate } = request.query;

  if (!professionalId || !startDate || !endDate) {
    throw new BadRequestError('professionalId, startDate, and endDate are required');
  }

  const summary = await expenseService.getSummary(
    professionalId,
    new Date(startDate),
    new Date(endDate),
  );

  return reply.status(200).send({ success: true, data: summary });
}

export async function createHandler(request: FastifyRequest, reply: FastifyReply) {
  const professional = await prisma.professional.findUnique({
    where: { userId: request.user.userId },
  });

  if (!professional) {
    throw new NotFoundError('Professional profile');
  }

  const body = createExpenseSchema.parse(request.body);

  const expense = await expenseService.create({
    professionalId: professional.id,
    description: body.description,
    amount: body.amount,
    currency: body.currency,
    category: body.category,
    date: new Date(body.date),
    recurring: body.recurring,
  });

  return reply.status(201).send({ success: true, data: expense });
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

  const body = updateExpenseSchema.parse(request.body);

  const data = {
    ...body,
    date: body.date ? new Date(body.date) : undefined,
  };

  const expense = await expenseService.update(id, professional.id, data);

  return reply.status(200).send({ success: true, data: expense });
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

  await expenseService.remove(id, professional.id);

  return reply.status(200).send({ success: true, data: null });
}
