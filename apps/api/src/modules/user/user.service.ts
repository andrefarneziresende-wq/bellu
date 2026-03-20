import { prisma } from '../../config/prisma.js';
import { NotFoundError } from '../../shared/errors.js';

const userSelect = {
  id: true,
  name: true,
  email: true,
  phone: true,
  avatar: true,
  latitude: true,
  longitude: true,
  countryId: true,
  locale: true,
  active: true,
  createdAt: true,
  updatedAt: true,
} as const;

export async function getUserById(id: string) {
  const user = await prisma.user.findUnique({
    where: { id },
    select: userSelect,
  });

  if (!user) {
    throw new NotFoundError('User');
  }

  return user;
}

export async function updateUser(id: string, data: {
  name?: string;
  email?: string;
  phone?: string;
  avatar?: string;
  latitude?: number;
  longitude?: number;
  locale?: string;
}) {
  const user = await prisma.user.findUnique({ where: { id } });

  if (!user) {
    throw new NotFoundError('User');
  }

  const updated = await prisma.user.update({
    where: { id },
    data,
    select: userSelect,
  });

  return updated;
}

export async function deleteUser(id: string) {
  const user = await prisma.user.findUnique({ where: { id } });

  if (!user) {
    throw new NotFoundError('User');
  }

  await prisma.user.update({
    where: { id },
    data: { active: false },
  });
}
