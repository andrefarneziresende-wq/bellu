import { prisma } from '../../config/prisma.js';
import { NotFoundError } from '../../shared/errors.js';

export async function getAll(countryId?: string) {
  return prisma.platformConfig.findMany({
    where: {
      ...(countryId ? { countryId } : {}),
    },
    include: {
      country: true,
    },
  });
}

export async function get(key: string, countryId?: string) {
  const config = await prisma.platformConfig.findFirst({
    where: {
      key,
      countryId: countryId ?? null,
    },
    include: {
      country: true,
    },
  });

  if (!config) {
    throw new NotFoundError('Platform config');
  }

  return config;
}

export async function set(key: string, value: string, countryId?: string) {
  return prisma.platformConfig.upsert({
    where: {
      key_countryId: {
        key,
        countryId: countryId ?? '',
      },
    },
    create: {
      key,
      value,
      countryId: countryId ?? null,
    },
    update: {
      value,
    },
    include: {
      country: true,
    },
  });
}

export async function remove(key: string, countryId?: string) {
  const config = await prisma.platformConfig.findFirst({
    where: {
      key,
      countryId: countryId ?? null,
    },
  });

  if (!config) {
    throw new NotFoundError('Platform config');
  }

  await prisma.platformConfig.delete({ where: { id: config.id } });
}
