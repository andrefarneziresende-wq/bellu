import { prisma } from '../../config/prisma.js';
import { NotFoundError } from '../../shared/errors.js';

interface CreateBannerInput {
  imageUrl: string;
  targetUrl?: string;
  active: boolean;
  order: number;
  startDate?: string;
  endDate?: string;
  countryId?: string;
}

interface UpdateBannerInput {
  imageUrl?: string;
  targetUrl?: string;
  active?: boolean;
  order?: number;
  startDate?: string | null;
  endDate?: string | null;
  countryId?: string | null;
}

export async function listActive(countryId?: string) {
  const now = new Date();

  const banners = await prisma.banner.findMany({
    where: {
      active: true,
      AND: [
        {
          OR: [
            { startDate: null },
            { startDate: { lte: now } },
          ],
        },
        {
          OR: [
            { endDate: null },
            { endDate: { gte: now } },
          ],
        },
        {
          OR: [
            { countryId: null },
            ...(countryId ? [{ countryId }] : []),
          ],
        },
      ],
    },
    orderBy: { order: 'asc' },
  });

  return banners;
}

export async function listAll(page = 1, perPage = 20) {
  const [banners, total] = await Promise.all([
    prisma.banner.findMany({
      include: {
        country: { select: { id: true, name: true } },
      },
      orderBy: { order: 'asc' },
      skip: (page - 1) * perPage,
      take: perPage,
    }),
    prisma.banner.count(),
  ]);

  return {
    banners,
    pagination: {
      total,
      page,
      perPage,
      totalPages: Math.ceil(total / perPage),
    },
  };
}

export async function getById(id: string) {
  const banner = await prisma.banner.findUnique({
    where: { id },
    include: {
      country: { select: { id: true, name: true } },
    },
  });

  if (!banner) {
    throw new NotFoundError('Banner');
  }

  return banner;
}

export async function create(data: CreateBannerInput) {
  const banner = await prisma.banner.create({
    data: {
      imageUrl: data.imageUrl,
      targetUrl: data.targetUrl,
      active: data.active,
      order: data.order,
      startDate: data.startDate ? new Date(data.startDate) : null,
      endDate: data.endDate ? new Date(data.endDate) : null,
      countryId: data.countryId,
    },
    include: {
      country: { select: { id: true, name: true } },
    },
  });

  return banner;
}

export async function update(id: string, data: UpdateBannerInput) {
  const existing = await prisma.banner.findUnique({ where: { id } });

  if (!existing) {
    throw new NotFoundError('Banner');
  }

  const updateData: Record<string, unknown> = {};

  if (data.imageUrl !== undefined) updateData.imageUrl = data.imageUrl;
  if (data.targetUrl !== undefined) updateData.targetUrl = data.targetUrl;
  if (data.active !== undefined) updateData.active = data.active;
  if (data.order !== undefined) updateData.order = data.order;
  if (data.startDate !== undefined) {
    updateData.startDate = data.startDate ? new Date(data.startDate) : null;
  }
  if (data.endDate !== undefined) {
    updateData.endDate = data.endDate ? new Date(data.endDate) : null;
  }
  if (data.countryId !== undefined) updateData.countryId = data.countryId;

  const banner = await prisma.banner.update({
    where: { id },
    data: updateData,
    include: {
      country: { select: { id: true, name: true } },
    },
  });

  return banner;
}

export async function deleteBanner(id: string) {
  const existing = await prisma.banner.findUnique({ where: { id } });

  if (!existing) {
    throw new NotFoundError('Banner');
  }

  await prisma.banner.delete({ where: { id } });
}
