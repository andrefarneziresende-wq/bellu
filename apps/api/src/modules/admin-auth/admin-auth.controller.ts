import type { FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { prisma } from '../../config/prisma.js';
import * as adminAuthService from './admin-auth.service.js';

const adminLoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const paginationSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  perPage: z.coerce.number().min(1).max(100).default(20),
});

export async function loginHandler(request: FastifyRequest, reply: FastifyReply) {
  const { email, password } = adminLoginSchema.parse(request.body);
  const result = await adminAuthService.adminLogin(email, password, request.server);

  return reply.status(200).send({
    success: true,
    data: result,
  });
}

export async function meHandler(request: FastifyRequest, reply: FastifyReply) {
  const admin = await adminAuthService.getAdminById(request.user.userId);

  return reply.status(200).send({
    success: true,
    data: admin,
  });
}

export async function dashboardHandler(request: FastifyRequest, reply: FastifyReply) {
  const [totalUsers, totalProfessionals, totalBookings, totalReviews, totalPayments] = await Promise.all([
    prisma.user.count(),
    prisma.professional.count(),
    prisma.booking.count(),
    prisma.review.count(),
    prisma.payment.count(),
  ]);

  return reply.status(200).send({
    success: true,
    data: {
      totalUsers,
      totalProfessionals,
      totalBookings,
      totalReviews,
      totalPayments,
    },
  });
}

export async function listUsersHandler(request: FastifyRequest, reply: FastifyReply) {
  const { page, perPage } = paginationSchema.parse(request.query);
  const skip = (page - 1) * perPage;

  // Only show app-registered clients (users without a professional profile)
  const where = {
    professional: null,
  };

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      skip,
      take: perPage,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.user.count({ where }),
  ]);

  return reply.status(200).send({
    success: true,
    data: users,
    meta: { page, perPage, total, totalPages: Math.ceil(total / perPage) },
  });
}

export async function listProfessionalsHandler(request: FastifyRequest, reply: FastifyReply) {
  const { page, perPage } = paginationSchema.parse(request.query);
  const skip = (page - 1) * perPage;

  const [professionals, total] = await Promise.all([
    prisma.professional.findMany({
      skip,
      take: perPage,
      orderBy: { createdAt: 'desc' },
      include: { user: true },
    }),
    prisma.professional.count(),
  ]);

  return reply.status(200).send({
    success: true,
    data: professionals,
    meta: { page, perPage, total, totalPages: Math.ceil(total / perPage) },
  });
}

export async function listBookingsHandler(request: FastifyRequest, reply: FastifyReply) {
  const { page, perPage } = paginationSchema.parse(request.query);
  const skip = (page - 1) * perPage;

  const [bookings, total] = await Promise.all([
    prisma.booking.findMany({
      skip,
      take: perPage,
      orderBy: { createdAt: 'desc' },
      include: {
        user: true,
        professional: true,
        service: true,
      },
    }),
    prisma.booking.count(),
  ]);

  return reply.status(200).send({
    success: true,
    data: bookings,
    meta: { page, perPage, total, totalPages: Math.ceil(total / perPage) },
  });
}

export async function listReviewsHandler(request: FastifyRequest, reply: FastifyReply) {
  const { page, perPage } = paginationSchema.parse(request.query);
  const skip = (page - 1) * perPage;

  const [reviews, total] = await Promise.all([
    prisma.review.findMany({
      skip,
      take: perPage,
      orderBy: { createdAt: 'desc' },
      include: {
        user: true,
        professional: true,
      },
    }),
    prisma.review.count(),
  ]);

  return reply.status(200).send({
    success: true,
    data: reviews,
    meta: { page, perPage, total, totalPages: Math.ceil(total / perPage) },
  });
}

export async function listPaymentsHandler(request: FastifyRequest, reply: FastifyReply) {
  const { page, perPage } = paginationSchema.parse(request.query);
  const skip = (page - 1) * perPage;

  const [payments, total] = await Promise.all([
    prisma.payment.findMany({
      skip,
      take: perPage,
      orderBy: { createdAt: 'desc' },
      include: { booking: true },
    }),
    prisma.payment.count(),
  ]);

  return reply.status(200).send({
    success: true,
    data: payments,
    meta: { page, perPage, total, totalPages: Math.ceil(total / perPage) },
  });
}

export async function toggleUserActiveHandler(
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply,
) {
  const { id } = request.params;
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) return reply.status(404).send({ success: false, error: 'User not found' });

  const updated = await prisma.user.update({
    where: { id },
    data: { active: !user.active },
  });

  return reply.status(200).send({ success: true, data: updated });
}

export async function toggleProfessionalStatusHandler(
  request: FastifyRequest<{ Params: { id: string }; Body: { status: string } }>,
  reply: FastifyReply,
) {
  const { id } = request.params;
  const { status } = request.body as { status: 'PENDING' | 'APPROVED' | 'SUSPENDED' | 'BANNED' };

  const updated = await prisma.professional.update({
    where: { id },
    data: { status, active: status === 'APPROVED' },
    include: { user: true },
  });

  return reply.status(200).send({ success: true, data: updated });
}

export async function listBannersHandler(request: FastifyRequest, reply: FastifyReply) {
  const { page, perPage } = paginationSchema.parse(request.query);
  const skip = (page - 1) * perPage;

  const [banners, total] = await Promise.all([
    prisma.banner.findMany({
      skip,
      take: perPage,
      orderBy: { order: 'asc' },
      include: { country: { select: { id: true, name: true, code: true } } },
    }),
    prisma.banner.count(),
  ]);

  return reply.status(200).send({
    success: true,
    data: banners,
    meta: { page, perPage, total, totalPages: Math.ceil(total / perPage) },
  });
}

export async function deleteReviewHandler(
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply,
) {
  const { id } = request.params;
  const review = await prisma.review.findUnique({ where: { id } });
  if (!review) return reply.status(404).send({ success: false, error: 'Review not found' });

  await prisma.review.delete({ where: { id } });
  return reply.status(200).send({ success: true, data: null });
}

export async function getProfessionalDetailHandler(
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply,
) {
  const { id } = request.params;
  const professional = await prisma.professional.findUnique({
    where: { id },
    include: {
      user: { select: { name: true, email: true, phone: true } },
      services: { select: { id: true, name: true, price: true, currency: true } },
      country: { select: { id: true, name: true, code: true } },
    },
  });
  if (!professional) return reply.status(404).send({ success: false, error: 'Professional not found' });

  return reply.status(200).send({ success: true, data: professional });
}

export async function listPlatformConfigHandler(request: FastifyRequest, reply: FastifyReply) {
  const configs = await prisma.platformConfig.findMany({
    include: { country: { select: { id: true, name: true, code: true } } },
  });
  return reply.status(200).send({ success: true, data: configs });
}

export async function upsertPlatformConfigHandler(request: FastifyRequest, reply: FastifyReply) {
  const body = request.body as { configs: { key: string; value: string; countryId?: string | null }[] };

  const results = [];
  for (const item of body.configs) {
    const existing = await prisma.platformConfig.findFirst({
      where: { key: item.key, countryId: item.countryId ?? null },
    });

    if (existing) {
      const updated = await prisma.platformConfig.update({
        where: { id: existing.id },
        data: { value: item.value },
      });
      results.push(updated);
    } else {
      const created = await prisma.platformConfig.create({
        data: { key: item.key, value: item.value, countryId: item.countryId ?? null },
      });
      results.push(created);
    }
  }

  return reply.status(200).send({ success: true, data: results });
}

export async function createBannerHandler(request: FastifyRequest, reply: FastifyReply) {
  const body = request.body as {
    imageUrl: string;
    targetUrl?: string;
    active?: boolean;
    order?: number;
    startDate?: string;
    endDate?: string;
    countryId?: string;
  };

  const banner = await prisma.banner.create({
    data: {
      imageUrl: body.imageUrl,
      targetUrl: body.targetUrl,
      active: body.active ?? true,
      order: body.order ?? 0,
      startDate: body.startDate ? new Date(body.startDate) : null,
      endDate: body.endDate ? new Date(body.endDate) : null,
      countryId: body.countryId || null,
    },
    include: { country: { select: { id: true, name: true, code: true } } },
  });

  return reply.status(201).send({ success: true, data: banner });
}

export async function updateBannerHandler(
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply,
) {
  const { id } = request.params;
  const body = request.body as Record<string, unknown>;

  const existing = await prisma.banner.findUnique({ where: { id } });
  if (!existing) return reply.status(404).send({ success: false, error: 'Banner not found' });

  const updateData: Record<string, unknown> = {};
  if (body.imageUrl !== undefined) updateData.imageUrl = body.imageUrl;
  if (body.targetUrl !== undefined) updateData.targetUrl = body.targetUrl;
  if (body.active !== undefined) updateData.active = body.active;
  if (body.order !== undefined) updateData.order = body.order;
  if (body.startDate !== undefined) updateData.startDate = body.startDate ? new Date(body.startDate as string) : null;
  if (body.endDate !== undefined) updateData.endDate = body.endDate ? new Date(body.endDate as string) : null;
  if (body.countryId !== undefined) updateData.countryId = body.countryId || null;

  const banner = await prisma.banner.update({
    where: { id },
    data: updateData,
    include: { country: { select: { id: true, name: true, code: true } } },
  });

  return reply.status(200).send({ success: true, data: banner });
}

export async function deleteBannerHandler(
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply,
) {
  const { id } = request.params;
  const existing = await prisma.banner.findUnique({ where: { id } });
  if (!existing) return reply.status(404).send({ success: false, error: 'Banner not found' });

  await prisma.banner.delete({ where: { id } });
  return reply.status(200).send({ success: true, data: null });
}

export async function createCategoryHandler(request: FastifyRequest, reply: FastifyReply) {
  const body = request.body as {
    slug: string;
    icon: string;
    order?: number;
    translations: { locale: string; name: string }[];
  };

  const category = await prisma.category.create({
    data: {
      slug: body.slug,
      icon: body.icon,
      order: body.order ?? 0,
      translations: { create: body.translations },
    },
    include: { translations: true },
  });

  return reply.status(201).send({ success: true, data: category });
}

export async function updateCategoryHandler(
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply,
) {
  const { id } = request.params;
  const body = request.body as {
    slug?: string;
    icon?: string;
    order?: number;
    translations?: { locale: string; name: string }[];
  };

  const existing = await prisma.category.findUnique({ where: { id } });
  if (!existing) return reply.status(404).send({ success: false, error: 'Category not found' });

  const { translations, ...categoryData } = body;
  const category = await prisma.category.update({
    where: { id },
    data: {
      ...categoryData,
      ...(translations && {
        translations: { deleteMany: {}, create: translations },
      }),
    },
    include: { translations: true },
  });

  return reply.status(200).send({ success: true, data: category });
}

export async function deleteCategoryHandler(
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply,
) {
  const { id } = request.params;
  const existing = await prisma.category.findUnique({
    where: { id },
    include: { services: { select: { id: true } } },
  });
  if (!existing) return reply.status(404).send({ success: false, error: 'Categoria não encontrada' });

  if (existing.services.length > 0) {
    return reply.status(400).send({
      success: false,
      error: `Não é possível excluir: esta categoria possui ${existing.services.length} serviço(s) vinculado(s). Remova os serviços primeiro.`,
    });
  }

  // CategoryTranslation has onDelete: Cascade, so just delete the category
  await prisma.category.delete({ where: { id } });
  return reply.status(200).send({ success: true, data: null });
}

export async function reorderCategoryHandler(
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply,
) {
  const { id } = request.params;
  const { order } = request.body as { order: number };

  const existing = await prisma.category.findUnique({ where: { id } });
  if (!existing) return reply.status(404).send({ success: false, error: 'Categoria não encontrada' });

  const updated = await prisma.category.update({
    where: { id },
    data: { order },
    include: { translations: true },
  });

  return reply.status(200).send({ success: true, data: updated });
}

// ============================================================
// Service Templates (Admin catalog)
// ============================================================

export async function listServiceTemplatesHandler(request: FastifyRequest, reply: FastifyReply) {
  const templates = await prisma.serviceTemplate.findMany({
    orderBy: [{ order: 'asc' }, { name: 'asc' }],
    include: {
      category: { include: { translations: true } },
      _count: { select: { services: true } },
    },
  });

  return reply.status(200).send({ success: true, data: templates });
}

export async function createServiceTemplateHandler(request: FastifyRequest, reply: FastifyReply) {
  const body = request.body as { name: string; categoryId: string; order?: number };

  if (!body.name || !body.categoryId) {
    return reply.status(400).send({ success: false, error: 'Name and categoryId are required' });
  }

  const template = await prisma.serviceTemplate.create({
    data: {
      name: body.name,
      categoryId: body.categoryId,
      order: body.order ?? 0,
    },
    include: {
      category: { include: { translations: true } },
    },
  });

  return reply.status(201).send({ success: true, data: template });
}

export async function updateServiceTemplateHandler(
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply,
) {
  const { id } = request.params;
  const body = request.body as { name?: string; categoryId?: string; active?: boolean; order?: number };

  const existing = await prisma.serviceTemplate.findUnique({ where: { id } });
  if (!existing) return reply.status(404).send({ success: false, error: 'Template not found' });

  const updateData: Record<string, unknown> = {};
  if (body.name !== undefined) updateData.name = body.name;
  if (body.categoryId !== undefined) updateData.categoryId = body.categoryId;
  if (body.active !== undefined) updateData.active = body.active;
  if (body.order !== undefined) updateData.order = body.order;

  const updated = await prisma.serviceTemplate.update({
    where: { id },
    data: updateData,
    include: {
      category: { include: { translations: true } },
    },
  });

  return reply.status(200).send({ success: true, data: updated });
}

export async function deleteServiceTemplateHandler(
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply,
) {
  const { id } = request.params;

  const existing = await prisma.serviceTemplate.findUnique({
    where: { id },
    include: { _count: { select: { services: true } } },
  });
  if (!existing) return reply.status(404).send({ success: false, error: 'Template not found' });

  if (existing._count.services > 0) {
    return reply.status(400).send({
      success: false,
      error: `Cannot delete: ${existing._count.services} professionals are using this service`,
    });
  }

  await prisma.serviceTemplate.delete({ where: { id } });
  return reply.status(200).send({ success: true, data: null });
}

export async function listServicesHandler(request: FastifyRequest, reply: FastifyReply) {
  const { page, perPage } = paginationSchema.parse(request.query);
  const skip = (page - 1) * perPage;

  const [services, total] = await Promise.all([
    prisma.service.findMany({
      skip,
      take: perPage,
      orderBy: { createdAt: 'desc' },
      include: {
        professional: { select: { id: true, businessName: true } },
        category: { select: { id: true, slug: true, translations: { where: { locale: 'pt-BR' }, select: { name: true } } } },
      },
    }),
    prisma.service.count(),
  ]);

  return reply.status(200).send({
    success: true,
    data: services,
    meta: { page, perPage, total, totalPages: Math.ceil(total / perPage) },
  });
}

export async function listAdminUsersHandler(request: FastifyRequest, reply: FastifyReply) {
  const adminUsers = await prisma.adminUser.findMany({
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      name: true,
      email: true,
      roleId: true,
      active: true,
      createdAt: true,
      countryId: true,
      country: { select: { id: true, name: true, code: true } },
      staffRole: { select: { id: true, name: true } },
    },
  });

  return reply.status(200).send({ success: true, data: adminUsers });
}

export async function createAdminUserHandler(request: FastifyRequest, reply: FastifyReply) {
  const body = request.body as {
    name: string;
    email: string;
    password: string;
    roleId?: string;
    countryId?: string;
    active?: boolean;
  };

  const passwordHash = await bcrypt.hash(body.password, 10);

  const admin = await prisma.adminUser.create({
    data: {
      name: body.name,
      email: body.email,
      passwordHash,
      roleId: body.roleId || null,
      countryId: body.countryId || null,
      active: body.active ?? true,
    },
  });

  const { passwordHash: _, ...adminWithoutPassword } = admin;
  return reply.status(201).send({ success: true, data: adminWithoutPassword });
}

export async function updateAdminUserHandler(
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply,
) {
  const { id } = request.params;
  const body = request.body as {
    name?: string;
    email?: string;
    password?: string;
    roleId?: string | null;
    countryId?: string;
    active?: boolean;
  };

  const existing = await prisma.adminUser.findUnique({ where: { id } });
  if (!existing) return reply.status(404).send({ success: false, error: 'Admin user not found' });

  const updateData: Record<string, unknown> = {};
  if (body.name !== undefined) updateData.name = body.name;
  if (body.email !== undefined) updateData.email = body.email;
  if (body.password !== undefined) updateData.passwordHash = await bcrypt.hash(body.password, 10);
  if (body.roleId !== undefined) updateData.roleId = body.roleId || null;
  if (body.countryId !== undefined) updateData.countryId = body.countryId || null;
  if (body.active !== undefined) updateData.active = body.active;

  const admin = await prisma.adminUser.update({
    where: { id },
    data: updateData,
  });

  const { passwordHash: _, ...adminWithoutPassword } = admin;
  return reply.status(200).send({ success: true, data: adminWithoutPassword });
}

export async function deleteAdminUserHandler(
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply,
) {
  const { id } = request.params;
  const existing = await prisma.adminUser.findUnique({ where: { id } });
  if (!existing) return reply.status(404).send({ success: false, error: 'Admin user not found' });

  await prisma.adminUser.delete({ where: { id } });
  return reply.status(200).send({ success: true, data: null });
}
