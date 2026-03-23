import { prisma } from '../../config/prisma.js';
import { NotFoundError, ForbiddenError } from '../../shared/errors.js';

interface CreateServicePackageData {
  professionalId: string;
  serviceId: string;
  name: string;
  description?: string;
  sessionsTotal: number;
  intervalDays?: number;
  priceTotal: number;
  currency: string;
}

interface UpdateServicePackageData {
  serviceId?: string;
  name?: string;
  description?: string;
  sessionsTotal?: number;
  intervalDays?: number;
  priceTotal?: number;
  currency?: string;
  active?: boolean;
}

export async function listByProfessional(professionalId: string) {
  return prisma.servicePackage.findMany({
    where: { professionalId },
    include: {
      service: true,
    },
    orderBy: { createdAt: 'desc' },
  });
}

export async function create(data: CreateServicePackageData) {
  const professional = await prisma.professional.findUnique({
    where: { id: data.professionalId },
  });

  if (!professional) {
    throw new NotFoundError('Professional');
  }

  return prisma.servicePackage.create({
    data: {
      professionalId: data.professionalId,
      serviceId: data.serviceId,
      name: data.name,
      description: data.description || null,
      sessionsTotal: data.sessionsTotal,
      intervalDays: data.intervalDays || null,
      priceTotal: data.priceTotal,
      currency: data.currency,
    },
    include: {
      service: true,
    },
  });
}

export async function update(id: string, professionalId: string, data: UpdateServicePackageData) {
  const pkg = await prisma.servicePackage.findUnique({
    where: { id },
  });

  if (!pkg) {
    throw new NotFoundError('Service package');
  }

  if (pkg.professionalId !== professionalId) {
    throw new ForbiddenError('You do not own this service package');
  }

  return prisma.servicePackage.update({
    where: { id },
    data,
    include: {
      service: true,
    },
  });
}

export async function remove(id: string, professionalId: string) {
  const pkg = await prisma.servicePackage.findUnique({
    where: { id },
  });

  if (!pkg) {
    throw new NotFoundError('Service package');
  }

  if (pkg.professionalId !== professionalId) {
    throw new ForbiddenError('You do not own this service package');
  }

  await prisma.servicePackage.delete({ where: { id } });
}
