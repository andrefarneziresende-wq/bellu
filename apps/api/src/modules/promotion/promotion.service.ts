import { prisma } from '../../config/prisma.js';
import { NotFoundError, ForbiddenError } from '../../shared/errors.js';

interface CreatePromotionData {
  professionalId: string;
  name: string;
  discountType: string;
  discountValue: number;
  startDate: Date;
  endDate: Date;
  serviceIds?: string[];
}

interface UpdatePromotionData {
  name?: string;
  discountType?: string;
  discountValue?: number;
  startDate?: Date;
  endDate?: Date;
  active?: boolean;
  serviceIds?: string[];
}

export async function listByProfessional(professionalId: string) {
  return prisma.promotion.findMany({
    where: { professionalId },
    include: {
      services: {
        include: { service: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  });
}

export async function listActive(professionalId?: string) {
  const now = new Date();

  return prisma.promotion.findMany({
    where: {
      active: true,
      startDate: { lte: now },
      endDate: { gte: now },
      ...(professionalId ? { professionalId } : {}),
    },
    include: {
      services: {
        include: { service: true },
      },
      professional: {
        include: {
          user: { select: { name: true, avatar: true } },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });
}

export async function create(data: CreatePromotionData) {
  const professional = await prisma.professional.findUnique({
    where: { id: data.professionalId },
  });

  if (!professional) {
    throw new NotFoundError('Professional');
  }

  return prisma.promotion.create({
    data: {
      professionalId: data.professionalId,
      name: data.name,
      discountType: data.discountType,
      discountValue: data.discountValue,
      startDate: data.startDate,
      endDate: data.endDate,
      ...(data.serviceIds?.length ? {
        services: {
          create: data.serviceIds.map((serviceId) => ({
            serviceId,
          })),
        },
      } : {}),
    },
    include: {
      services: {
        include: { service: true },
      },
    },
  });
}

export async function update(id: string, professionalId: string, data: UpdatePromotionData) {
  const promotion = await prisma.promotion.findUnique({
    where: { id },
  });

  if (!promotion) {
    throw new NotFoundError('Promotion');
  }

  if (promotion.professionalId !== professionalId) {
    throw new ForbiddenError('You do not own this promotion');
  }

  const { serviceIds, ...updateData } = data;

  return prisma.$transaction(async (tx) => {
    if (serviceIds !== undefined) {
      await tx.promotionService.deleteMany({
        where: { promotionId: id },
      });

      if (serviceIds.length > 0) {
        await tx.promotionService.createMany({
          data: serviceIds.map((serviceId) => ({
            promotionId: id,
            serviceId,
          })),
        });
      }
    }

    return tx.promotion.update({
      where: { id },
      data: updateData,
      include: {
        services: {
          include: { service: true },
        },
      },
    });
  });
}

export async function remove(id: string, professionalId: string) {
  const promotion = await prisma.promotion.findUnique({
    where: { id },
  });

  if (!promotion) {
    throw new NotFoundError('Promotion');
  }

  if (promotion.professionalId !== professionalId) {
    throw new ForbiddenError('You do not own this promotion');
  }

  await prisma.promotion.delete({ where: { id } });
}
