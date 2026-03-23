import { prisma } from '../../config/prisma.js';
import { NotFoundError } from '../../shared/errors.js';

interface CreateContactData {
  name: string;
  email: string;
  subject: string;
  message: string;
  source?: string;
}

interface ListFilters {
  resolved?: boolean;
}

export async function create(data: CreateContactData) {
  return prisma.contactForm.create({
    data: {
      name: data.name,
      email: data.email,
      subject: data.subject,
      message: data.message,
      source: data.source ?? 'website',
    },
  });
}

export async function list(filters: ListFilters) {
  return prisma.contactForm.findMany({
    where: {
      ...(filters.resolved !== undefined ? { resolved: filters.resolved } : {}),
    },
    orderBy: { createdAt: 'desc' },
  });
}

export async function resolve(id: string) {
  const contact = await prisma.contactForm.findUnique({
    where: { id },
  });

  if (!contact) {
    throw new NotFoundError('Contact form');
  }

  return prisma.contactForm.update({
    where: { id },
    data: { resolved: true },
  });
}
