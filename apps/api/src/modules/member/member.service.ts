import bcrypt from 'bcryptjs';
import { prisma } from '../../config/prisma.js';
import { NotFoundError, ForbiddenError, BadRequestError } from '../../shared/errors.js';

interface CreateMemberData {
  professionalId: string;
  name: string;
  email?: string;
  phone?: string;
  avatar?: string;
  role: string;
  roleId?: string;
  specialties?: string;
  commissionPercent?: number;
}

interface UpdateMemberData {
  name?: string;
  email?: string;
  phone?: string;
  avatar?: string;
  role?: string;
  roleId?: string | null;
  specialties?: string;
  commissionPercent?: number;
  active?: boolean;
}

export async function listByProfessional(professionalId: string) {
  return prisma.professionalMember.findMany({
    where: { professionalId },
    include: { staffRole: { select: { id: true, name: true, permissions: true } } },
    orderBy: { createdAt: 'desc' },
  });
}

export async function getById(id: string) {
  const member = await prisma.professionalMember.findUnique({
    where: { id },
  });

  if (!member) {
    throw new NotFoundError('Member');
  }

  return member;
}

export async function create(data: CreateMemberData) {
  const professional = await prisma.professional.findUnique({
    where: { id: data.professionalId },
  });

  if (!professional) {
    throw new NotFoundError('Professional');
  }

  return prisma.professionalMember.create({
    data: {
      professionalId: data.professionalId,
      name: data.name,
      email: data.email,
      phone: data.phone,
      avatar: data.avatar,
      role: data.role,
      roleId: data.roleId,
      specialties: data.specialties,
      commissionPercent: data.commissionPercent,
    },
    include: { staffRole: { select: { id: true, name: true, permissions: true } } },
  });
}

export async function update(id: string, professionalId: string, data: UpdateMemberData) {
  const member = await prisma.professionalMember.findUnique({
    where: { id },
  });

  if (!member) {
    throw new NotFoundError('Member');
  }

  if (member.professionalId !== professionalId) {
    throw new ForbiddenError('You do not own this member');
  }

  return prisma.professionalMember.update({
    where: { id },
    data,
  });
}

export async function remove(id: string, professionalId: string) {
  const member = await prisma.professionalMember.findUnique({
    where: { id },
  });

  if (!member) {
    throw new NotFoundError('Member');
  }

  if (member.professionalId !== professionalId) {
    throw new ForbiddenError('You do not own this member');
  }

  await prisma.professionalMember.delete({ where: { id } });
}

/**
 * Link a user account to a staff member.
 * If user with email exists, link it. Otherwise, create a new user with a temp password.
 */
export async function linkUserAccount(
  memberId: string,
  professionalId: string,
  email: string,
  tempPassword: string,
) {
  const member = await prisma.professionalMember.findUnique({ where: { id: memberId } });
  if (!member) throw new NotFoundError('Member');
  if (member.professionalId !== professionalId) throw new ForbiddenError('You do not own this member');
  if (member.userId) throw new BadRequestError('Member already has a linked user account');

  // Find or create user
  let user = await prisma.user.findUnique({ where: { email } });

  if (!user) {
    // Get the professional's country
    const professional = await prisma.professional.findUnique({
      where: { id: professionalId },
      select: { countryId: true },
    });
    const hash = await bcrypt.hash(tempPassword, 10);
    user = await prisma.user.create({
      data: {
        name: member.name,
        email,
        passwordHash: hash,
        countryId: professional!.countryId,
        locale: 'pt-BR',
      },
    });
  }

  // Check user isn't already linked to another member
  const existingLink = await prisma.professionalMember.findUnique({ where: { userId: user.id } });
  if (existingLink) throw new BadRequestError('This user is already linked to another staff profile');

  return prisma.professionalMember.update({
    where: { id: memberId },
    data: { userId: user.id, email },
    include: { staffRole: { select: { id: true, name: true, permissions: true } } },
  });
}
