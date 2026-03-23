import { prisma } from '../../config/prisma.js';
import { NotFoundError } from '../../shared/errors.js';

export interface ProContext {
  type: 'owner' | 'staff';
  professionalId: string;
  businessName: string;
  memberId: string | null;
  roleName: string;
  permissions: string[];
}

/**
 * Resolve the pro context for a logged-in user.
 * Checks if user is a professional owner or a staff member.
 */
export async function resolveProContext(userId: string): Promise<ProContext> {
  // 1. Check if user is a professional owner
  const professional = await prisma.professional.findUnique({
    where: { userId },
    select: { id: true, businessName: true },
  });

  if (professional) {
    return {
      type: 'owner',
      professionalId: professional.id,
      businessName: professional.businessName,
      memberId: null,
      roleName: 'owner',
      permissions: ['*'], // Owner has all permissions
    };
  }

  // 2. Check if user is a staff member
  const member = await prisma.professionalMember.findUnique({
    where: { userId },
    include: {
      professional: { select: { id: true, businessName: true } },
      staffRole: { select: { name: true, permissions: true } },
    },
  });

  if (member && member.active) {
    let permissions: string[] = [];
    if (member.staffRole?.permissions) {
      try {
        permissions = JSON.parse(member.staffRole.permissions);
      } catch {
        permissions = [];
      }
    }

    return {
      type: 'staff',
      professionalId: member.professional.id,
      businessName: member.professional.businessName,
      memberId: member.id,
      roleName: member.staffRole?.name || 'staff',
      permissions,
    };
  }

  throw new NotFoundError('No professional or staff profile found for this user');
}

/**
 * Check if a pro context has a specific permission
 */
export function hasPermission(context: ProContext, permission: string): boolean {
  if (context.permissions.includes('*')) return true;
  return context.permissions.includes(permission);
}

/**
 * Check if a pro context has any of the specified permissions
 */
export function hasAnyPermission(context: ProContext, permissions: string[]): boolean {
  if (context.permissions.includes('*')) return true;
  return permissions.some((p) => context.permissions.includes(p));
}
