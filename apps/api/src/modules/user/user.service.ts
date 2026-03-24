import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { prisma } from '../../config/prisma.js';
import { NotFoundError, AppError } from '../../shared/errors.js';

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

export async function listUsers(professionalId?: string) {
  if (professionalId) {
    // Return only clients who have bookings with this professional
    const bookings = await prisma.booking.findMany({
      where: { professionalId },
      select: { userId: true },
      distinct: ['userId'],
    });
    const clientIds = bookings.map((b) => b.userId).filter(Boolean) as string[];

    if (clientIds.length === 0) return [];

    return prisma.user.findMany({
      where: { id: { in: clientIds }, active: true },
      select: userSelect,
      orderBy: { createdAt: 'desc' },
    });
  }

  // Fallback: return all non-professional users
  const professionals = await prisma.professional.findMany({
    select: { userId: true },
  });
  const proUserIds = professionals.map((p) => p.userId);

  return prisma.user.findMany({
    where: {
      active: true,
      ...(proUserIds.length > 0 ? { id: { notIn: proUserIds } } : {}),
    },
    select: userSelect,
    orderBy: { createdAt: 'desc' },
  });
}

export async function createUser(data: {
  name: string;
  phone?: string;
  email?: string;
  role?: string;
}) {
  // Generate a random password hash for walk-in clients
  const randomPassword = crypto.randomBytes(32).toString('hex');
  const passwordHash = await bcrypt.hash(randomPassword, 10);

  // Fetch the first available country as default
  const defaultCountry = await prisma.country.findFirst();
  if (!defaultCountry) {
    throw new Error('No country found in database');
  }

  // Normalize empty strings to null for unique constraint fields
  const phone = data.phone?.trim() || null;
  const email = data.email?.trim() || null;

  // Check for duplicates before creating
  if (email) {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      throw new AppError(409, 'Email already registered', 'DUPLICATE_EMAIL');
    }
  }
  if (phone) {
    const existing = await prisma.user.findUnique({ where: { phone } });
    if (existing) {
      throw new AppError(409, 'Phone already registered', 'DUPLICATE_PHONE');
    }
  }

  const user = await prisma.user.create({
    data: {
      name: data.name,
      phone,
      email,
      passwordHash,
      countryId: defaultCountry.id,
    },
    select: userSelect,
  });

  return user;
}
