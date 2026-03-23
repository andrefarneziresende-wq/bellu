import { prisma } from '../../config/prisma.js';
import { NotFoundError, ForbiddenError } from '../../shared/errors.js';

// All available permissions in the system
export const ALL_PERMISSIONS = [
  'agenda.view',
  'agenda.create',
  'agenda.edit',
  'agenda.cancel',
  'clients.view',
  'clients.create',
  'clients.edit',
  'services.view',
  'services.create',
  'services.edit',
  'services.delete',
  'finances.view',
  'finances.create',
  'finances.edit',
  'team.view',
  'team.create',
  'team.edit',
  'team.delete',
  'roles.view',
  'roles.manage',
  'portfolio.view',
  'portfolio.create',
  'portfolio.delete',
  'reviews.view',
  'reviews.respond',
  'promotions.view',
  'promotions.create',
  'promotions.edit',
  'promotions.delete',
  'settings.view',
  'settings.edit',
] as const;

export type Permission = (typeof ALL_PERMISSIONS)[number];

// Permission groups for UI display
export const PERMISSION_GROUPS = [
  { key: 'agenda', label: 'Agenda', permissions: ['agenda.view', 'agenda.create', 'agenda.edit', 'agenda.cancel'] },
  { key: 'clients', label: 'Clientes', permissions: ['clients.view', 'clients.create', 'clients.edit'] },
  { key: 'services', label: 'Serviços', permissions: ['services.view', 'services.create', 'services.edit', 'services.delete'] },
  { key: 'finances', label: 'Financeiro', permissions: ['finances.view', 'finances.create', 'finances.edit'] },
  { key: 'team', label: 'Equipe', permissions: ['team.view', 'team.create', 'team.edit', 'team.delete'] },
  { key: 'roles', label: 'Cargos', permissions: ['roles.view', 'roles.manage'] },
  { key: 'portfolio', label: 'Portfólio', permissions: ['portfolio.view', 'portfolio.create', 'portfolio.delete'] },
  { key: 'reviews', label: 'Avaliações', permissions: ['reviews.view', 'reviews.respond'] },
  { key: 'promotions', label: 'Promoções', permissions: ['promotions.view', 'promotions.create', 'promotions.edit', 'promotions.delete'] },
  { key: 'settings', label: 'Configurações', permissions: ['settings.view', 'settings.edit'] },
];

// Default roles created when a professional signs up
const DEFAULT_ROLES = [
  {
    name: 'Proprietário',
    description: 'Acesso total ao sistema',
    permissions: ALL_PERMISSIONS as unknown as string[],
    isDefault: true,
  },
  {
    name: 'Gerente',
    description: 'Gerencia equipe, agenda e financeiro',
    permissions: [
      'agenda.view', 'agenda.create', 'agenda.edit', 'agenda.cancel',
      'clients.view', 'clients.create', 'clients.edit',
      'services.view', 'services.create', 'services.edit',
      'finances.view', 'finances.create',
      'team.view', 'team.create', 'team.edit',
      'roles.view',
      'portfolio.view', 'portfolio.create',
      'reviews.view', 'reviews.respond',
      'promotions.view', 'promotions.create', 'promotions.edit',
      'settings.view',
    ],
    isDefault: true,
  },
  {
    name: 'Funcionário',
    description: 'Acesso básico para atendimento',
    permissions: [
      'agenda.view', 'agenda.create', 'agenda.edit',
      'clients.view',
      'services.view',
      'portfolio.view',
      'reviews.view',
    ],
    isDefault: true,
  },
  {
    name: 'Recepcionista',
    description: 'Gerencia agenda e clientes',
    permissions: [
      'agenda.view', 'agenda.create', 'agenda.edit', 'agenda.cancel',
      'clients.view', 'clients.create', 'clients.edit',
      'services.view',
      'finances.view',
    ],
    isDefault: true,
  },
];

export async function ensureDefaultRoles(professionalId: string) {
  const existing = await prisma.staffRole.findMany({ where: { professionalId } });
  const existingNames = existing.map(r => r.name);

  const missing = DEFAULT_ROLES.filter(r => !existingNames.includes(r.name));
  if (missing.length === 0) return existing;

  for (const role of missing) {
    const created = await prisma.staffRole.create({
      data: {
        professionalId,
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

export async function listByProfessional(professionalId: string) {
  // Ensure default roles exist
  await ensureDefaultRoles(professionalId);

  return prisma.staffRole.findMany({
    where: { professionalId },
    include: { _count: { select: { members: true } } },
    orderBy: { createdAt: 'asc' },
  });
}

export async function getById(id: string) {
  const role = await prisma.staffRole.findUnique({
    where: { id },
    include: { members: { select: { id: true, name: true, active: true } } },
  });
  if (!role) throw new NotFoundError('Role');
  return role;
}

export async function create(professionalId: string, data: { name: string; description?: string; permissions: string[] }) {
  return prisma.staffRole.create({
    data: {
      professionalId,
      name: data.name,
      description: data.description,
      permissions: JSON.stringify(data.permissions),
      isDefault: false,
    },
  });
}

export async function update(id: string, professionalId: string, data: { name?: string; description?: string; permissions?: string[] }) {
  const role = await prisma.staffRole.findUnique({ where: { id } });
  if (!role) throw new NotFoundError('Role');
  if (role.professionalId !== professionalId) throw new ForbiddenError('Not your role');

  return prisma.staffRole.update({
    where: { id },
    data: {
      ...(data.name !== undefined && { name: data.name }),
      ...(data.description !== undefined && { description: data.description }),
      ...(data.permissions !== undefined && { permissions: JSON.stringify(data.permissions) }),
    },
  });
}

export async function remove(id: string, professionalId: string) {
  const role = await prisma.staffRole.findUnique({ where: { id } });
  if (!role) throw new NotFoundError('Role');
  if (role.professionalId !== professionalId) throw new ForbiddenError('Not your role');
  if (role.isDefault) throw new ForbiddenError('Cannot delete default roles');

  // Unlink members from this role before deleting
  await prisma.professionalMember.updateMany({
    where: { roleId: id },
    data: { roleId: null },
  });

  await prisma.staffRole.delete({ where: { id } });
}
