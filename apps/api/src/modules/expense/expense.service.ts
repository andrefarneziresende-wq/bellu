import { Prisma } from '@prisma/client';
import { prisma } from '../../config/prisma.js';
import { NotFoundError, ForbiddenError } from '../../shared/errors.js';

interface CreateExpenseData {
  professionalId: string;
  description: string;
  amount: number;
  currency: string;
  category: string;
  date: Date;
  recurring: boolean;
}

interface UpdateExpenseData {
  description?: string;
  amount?: number;
  currency?: string;
  category?: string;
  date?: Date;
  recurring?: boolean;
}

interface ListFilters {
  startDate?: Date;
  endDate?: Date;
  category?: string;
}

export async function listByProfessional(professionalId: string, filters: ListFilters) {
  const where: Prisma.ExpenseWhereInput = { professionalId };

  if (filters.category) {
    where.category = filters.category;
  }

  if (filters.startDate || filters.endDate) {
    where.date = {};
    if (filters.startDate) {
      where.date.gte = filters.startDate;
    }
    if (filters.endDate) {
      where.date.lte = filters.endDate;
    }
  }

  return prisma.expense.findMany({
    where,
    orderBy: { date: 'desc' },
  });
}

export async function create(data: CreateExpenseData) {
  const professional = await prisma.professional.findUnique({
    where: { id: data.professionalId },
  });

  if (!professional) {
    throw new NotFoundError('Professional');
  }

  return prisma.expense.create({
    data: {
      professionalId: data.professionalId,
      description: data.description,
      amount: data.amount,
      currency: data.currency,
      category: data.category,
      date: data.date,
      recurring: data.recurring,
    },
  });
}

export async function update(id: string, professionalId: string, data: UpdateExpenseData) {
  const expense = await prisma.expense.findUnique({
    where: { id },
  });

  if (!expense) {
    throw new NotFoundError('Expense');
  }

  if (expense.professionalId !== professionalId) {
    throw new ForbiddenError('You do not own this expense');
  }

  return prisma.expense.update({
    where: { id },
    data,
  });
}

export async function remove(id: string, professionalId: string) {
  const expense = await prisma.expense.findUnique({
    where: { id },
  });

  if (!expense) {
    throw new NotFoundError('Expense');
  }

  if (expense.professionalId !== professionalId) {
    throw new ForbiddenError('You do not own this expense');
  }

  await prisma.expense.delete({ where: { id } });
}

export async function getSummary(professionalId: string, startDate: Date, endDate: Date) {
  const expenses = await prisma.expense.groupBy({
    by: ['category'],
    where: {
      professionalId,
      date: {
        gte: startDate,
        lte: endDate,
      },
    },
    _sum: {
      amount: true,
    },
  });

  return expenses.map((e) => ({
    category: e.category,
    total: e._sum.amount,
  }));
}
