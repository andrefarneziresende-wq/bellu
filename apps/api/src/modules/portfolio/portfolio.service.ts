import { prisma } from '../../config/prisma.js';
import { NotFoundError, ForbiddenError } from '../../shared/errors.js';

interface CreatePortfolioItemInput {
  serviceId?: string;
  beforePhoto?: string;
  afterPhoto: string;
  description?: string;
}

export async function getByProfessional(
  professionalId: string,
  page = 1,
  perPage = 20,
) {
  const [items, total] = await Promise.all([
    prisma.portfolioItem.findMany({
      where: { professionalId },
      include: {
        service: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * perPage,
      take: perPage,
    }),
    prisma.portfolioItem.count({ where: { professionalId } }),
  ]);

  return {
    items,
    pagination: {
      total,
      page,
      perPage,
      totalPages: Math.ceil(total / perPage),
    },
  };
}

export async function getById(id: string) {
  const item = await prisma.portfolioItem.findUnique({
    where: { id },
    include: {
      service: { select: { id: true, name: true } },
      professional: { select: { id: true, businessName: true, avatarPhoto: true } },
    },
  });

  if (!item) {
    throw new NotFoundError('Portfolio item');
  }

  return item;
}

export async function create(
  professionalId: string,
  userId: string,
  data: CreatePortfolioItemInput,
) {
  const professional = await prisma.professional.findUnique({
    where: { id: professionalId },
  });

  if (!professional) {
    throw new NotFoundError('Professional');
  }

  if (professional.userId !== userId) {
    throw new ForbiddenError('You do not own this professional profile');
  }

  const item = await prisma.portfolioItem.create({
    data: {
      professionalId,
      serviceId: data.serviceId,
      beforePhoto: data.beforePhoto,
      afterPhoto: data.afterPhoto,
      description: data.description,
    },
    include: {
      service: { select: { id: true, name: true } },
    },
  });

  return item;
}

export async function deleteItem(id: string, userId: string) {
  const item = await prisma.portfolioItem.findUnique({
    where: { id },
    include: {
      professional: { select: { userId: true } },
    },
  });

  if (!item) {
    throw new NotFoundError('Portfolio item');
  }

  if (item.professional.userId !== userId) {
    throw new ForbiddenError('You do not own this portfolio item');
  }

  await prisma.portfolioItem.delete({ where: { id } });
}
