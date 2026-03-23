import { prisma } from '../../config/prisma.js';
import { NotFoundError, ForbiddenError } from '../../shared/errors.js';

// All available admin permissions
export const ADMIN_PERMISSIONS = [
  'dashboard.view',
  'users.view',
  'users.edit',
  'users.delete',
  'professionals.view',
  'professionals.approve',
  'professionals.edit',
  'professionals.delete',
  'categories.view',
  'categories.create',
  'categories.edit',
  'categories.delete',
  'services.view',
  'services.edit',
  'services.delete',
  'bookings.view',
  'bookings.edit',
  'bookings.cancel',
  'reviews.view',
  'reviews.edit',
  'reviews.delete',
  'promotions.view',
  'promotions.create',
  'promotions.edit',
  'promotions.delete',
  'banners.view',
  'banners.create',
  'banners.edit',
  'banners.delete',
  'finances.view',
  'finances.export',
  'notifications.view',
  'notifications.send',
  'admins.view',
  'admins.create',
  'admins.edit',
  'admins.delete',
  'roles.view',
  'roles.manage',
  'settings.view',
  'settings.edit',
] as const;

export type AdminPermission = (typeof ADMIN_PERMISSIONS)[number];

// Permission groups for UI display
export const ADMIN_PERMISSION_GROUPS = [
  { key: 'dashboard', label: 'Dashboard', permissions: ['dashboard.view'] },
  { key: 'users', label: 'Usuários', permissions: ['users.view', 'users.edit', 'users.delete'] },
  { key: 'professionals', label: 'Profissionais', permissions: ['professionals.view', 'professionals.approve', 'professionals.edit', 'professionals.delete'] },
  { key: 'categories', label: 'Categorias', permissions: ['categories.view', 'categories.create', 'categories.edit', 'categories.delete'] },
  { key: 'services', label: 'Serviços', permissions: ['services.view', 'services.edit', 'services.delete'] },
  { key: 'bookings', label: 'Agendamentos', permissions: ['bookings.view', 'bookings.edit', 'bookings.cancel'] },
  { key: 'reviews', label: 'Avaliações', permissions: ['reviews.view', 'reviews.edit', 'reviews.delete'] },
  { key: 'promotions', label: 'Promoções', permissions: ['promotions.view', 'promotions.create', 'promotions.edit', 'promotions.delete'] },
  { key: 'banners', label: 'Banners', permissions: ['banners.view', 'banners.create', 'banners.edit', 'banners.delete'] },
  { key: 'finances', label: 'Financeiro', permissions: ['finances.view', 'finances.export'] },
  { key: 'notifications', label: 'Notificações', permissions: ['notifications.view', 'notifications.send'] },
  { key: 'admins', label: 'Administradores', permissions: ['admins.view', 'admins.create', 'admins.edit', 'admins.delete'] },
  { key: 'roles', label: 'Cargos', permissions: ['roles.view', 'roles.manage'] },
  { key: 'settings', label: 'Configurações', permissions: ['settings.view', 'settings.edit'] },
];

// Default admin roles
const DEFAULT_ADMIN_ROLES = [
  {
    name: 'Super Admin',
    description: 'Acesso total à plataforma',
    permissions: ADMIN_PERMISSIONS as unknown as string[],
    isDefault: true,
  },
  {
    name: 'Administrador',
    description: 'Gerencia a plataforma sem acesso a configurações avançadas',
    permissions: [
      'dashboard.view',
      'users.view', 'users.edit',
      'professionals.view', 'professionals.approve', 'professionals.edit',
      'categories.view', 'categories.create', 'categories.edit',
      'services.view', 'services.edit',
      'bookings.view', 'bookings.edit', 'bookings.cancel',
      'reviews.view', 'reviews.edit',
      'promotions.view', 'promotions.create', 'promotions.edit',
      'banners.view', 'banners.create', 'banners.edit',
      'finances.view',
      'notifications.view', 'notifications.send',
      'admins.view',
      'roles.view',
    ],
    isDefault: true,
  },
  {
    name: 'Moderador',
    description: 'Modera conteúdo e atendimentos',
    permissions: [
      'dashboard.view',
      'users.view',
      'professionals.view', 'professionals.approve',
      'categories.view',
      'services.view',
      'bookings.view',
      'reviews.view', 'reviews.edit', 'reviews.delete',
      'promotions.view',
      'banners.view',
      'notifications.view',
    ],
    isDefault: true,
  },
];

export async function ensureDefaultAdminRoles() {
  const existing = await prisma.adminStaffRole.findMany();
  const existingNames = existing.map(r => r.name);

  const missing = DEFAULT_ADMIN_ROLES.filter(r => !existingNames.includes(r.name));
  if (missing.length === 0) return existing;

  for (const role of missing) {
    const created = await prisma.adminStaffRole.create({
      data: {
        name: role.name,
        description: role.description,
        permissions: JSON.stringify(role.permissions),
        isDefault: role.isDefault,
      },
    });
    existing.push(created);
  }
  return existing;
}

export async function listAdminRoles() {
  await ensureDefaultAdminRoles();

  return prisma.adminStaffRole.findMany({
    include: { _count: { select: { admins: true } } },
    orderBy: { createdAt: 'asc' },
  });
}

export async function getAdminRoleById(id: string) {
  const role = await prisma.adminStaffRole.findUnique({
    where: { id },
    include: { admins: { select: { id: true, name: true, active: true } } },
  });
  if (!role) throw new NotFoundError('Admin role');
  return role;
}

export async function createAdminRole(data: { name: string; description?: string; permissions: string[] }) {
  return prisma.adminStaffRole.create({
    data: {
      name: data.name,
      description: data.description,
      permissions: JSON.stringify(data.permissions),
      isDefault: false,
    },
  });
}

export async function updateAdminRole(id: string, data: { name?: string; description?: string; permissions?: string[] }) {
  const role = await prisma.adminStaffRole.findUnique({ where: { id } });
  if (!role) throw new NotFoundError('Admin role');

  return prisma.adminStaffRole.update({
    where: { id },
    data: {
      ...(data.name !== undefined && { name: data.name }),
      ...(data.description !== undefined && { description: data.description }),
      ...(data.permissions !== undefined && { permissions: JSON.stringify(data.permissions) }),
    },
  });
}

export async function removeAdminRole(id: string) {
  const role = await prisma.adminStaffRole.findUnique({ where: { id } });
  if (!role) throw new NotFoundError('Admin role');
  if (role.isDefault) throw new ForbiddenError('Cannot delete default roles');

  // Unlink admins from this role before deleting
  await prisma.adminUser.updateMany({
    where: { roleId: id },
    data: { roleId: null },
  });

  await prisma.adminStaffRole.delete({ where: { id } });
}
