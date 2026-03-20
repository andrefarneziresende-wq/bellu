import { prisma } from '../../config/prisma.js';

export async function toggleFavorite(userId: string, professionalId: string) {
  const existing = await prisma.favorite.findUnique({
    where: {
      userId_professionalId: { userId, professionalId },
    },
  });

  if (existing) {
    await prisma.favorite.delete({ where: { id: existing.id } });
    return { favorited: false };
  }

  await prisma.favorite.create({
    data: { userId, professionalId },
  });

  return { favorited: true };
}

export async function listByUser(userId: string, page = 1, perPage = 20) {
  const [favorites, total] = await Promise.all([
    prisma.favorite.findMany({
      where: { userId },
      include: {
        professional: {
          select: {
            id: true,
            businessName: true,
            avatarPhoto: true,
            rating: true,
            totalReviews: true,
            services: {
              select: {
                category: {
                  select: {
                    id: true,
                    slug: true,
                    translations: true,
                  },
                },
              },
              take: 1,
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * perPage,
      take: perPage,
    }),
    prisma.favorite.count({ where: { userId } }),
  ]);

  return {
    favorites,
    pagination: {
      total,
      page,
      perPage,
      totalPages: Math.ceil(total / perPage),
    },
  };
}

export async function isFavorited(userId: string, professionalId: string): Promise<boolean> {
  const favorite = await prisma.favorite.findUnique({
    where: {
      userId_professionalId: { userId, professionalId },
    },
  });

  return !!favorite;
}

export async function countByProfessional(professionalId: string): Promise<number> {
  return prisma.favorite.count({ where: { professionalId } });
}
