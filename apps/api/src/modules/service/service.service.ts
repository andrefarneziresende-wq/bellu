import { prisma } from '../../config/prisma.js';
import { NotFoundError, ForbiddenError } from '../../shared/errors.js';

interface CreateServiceInput {
  serviceTemplateId?: string;
  categoryId: string;
  name: string;
  description?: string;
  price: number;
  currency: string;
  durationMinutes: number;
}

interface UpdateServiceInput {
  categoryId?: string;
  name?: string;
  description?: string;
  price?: number;
  durationMinutes?: number;
  active?: boolean;
}

export async function createService(professionalId: string, data: CreateServiceInput) {
  const professional = await prisma.professional.findUnique({
    where: { id: professionalId },
  });

  if (!professional) {
    throw new NotFoundError('Professional');
  }

  // If serviceTemplateId provided, get name/category from template
  let name = data.name;
  let categoryId = data.categoryId;
  let serviceTemplateId = data.serviceTemplateId;

  if (serviceTemplateId) {
    const template = await prisma.serviceTemplate.findUnique({
      where: { id: serviceTemplateId },
    });
    if (template) {
      name = template.name;
      categoryId = template.categoryId;
    }
  }

  const service = await prisma.service.create({
    data: {
      professionalId,
      categoryId,
      serviceTemplateId: serviceTemplateId || null,
      name,
      description: data.description,
      price: data.price,
      currency: data.currency,
      durationMinutes: data.durationMinutes,
    },
    include: {
      category: true,
      serviceTemplate: true,
    },
  });

  return service;
}

export async function getServicesByProfessional(professionalId: string) {
  const professional = await prisma.professional.findUnique({
    where: { id: professionalId },
  });

  if (!professional) {
    throw new NotFoundError('Professional');
  }

  const services = await prisma.service.findMany({
    where: { professionalId, active: true },
    include: {
      category: true,
      serviceTemplate: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  return services;
}

export async function updateService(id: string, professionalId: string, data: UpdateServiceInput) {
  const service = await prisma.service.findUnique({
    where: { id },
  });

  if (!service) {
    throw new NotFoundError('Service');
  }

  if (service.professionalId !== professionalId) {
    throw new ForbiddenError('You do not own this service');
  }

  const updated = await prisma.service.update({
    where: { id },
    data,
    include: {
      category: true,
      serviceTemplate: true,
    },
  });

  return updated;
}

export async function deleteService(id: string, professionalId: string) {
  const service = await prisma.service.findUnique({
    where: { id },
  });

  if (!service) {
    throw new NotFoundError('Service');
  }

  if (service.professionalId !== professionalId) {
    throw new ForbiddenError('You do not own this service');
  }

  await prisma.service.delete({ where: { id } });
}
