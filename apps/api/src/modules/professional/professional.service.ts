import { Prisma } from '@prisma/client';
import { prisma } from '../../config/prisma.js';
import { ConflictError, ForbiddenError, NotFoundError } from '../../shared/errors.js';
import { geocodeAddress } from '../geocoding/geocoding.service.js';

interface CreateProfessionalData {
  businessName: string;
  description?: string;
  address: string;
  latitude: number;
  longitude: number;
  taxId: string;
  countryId: string;
}

interface UpdateProfessionalData {
  businessName?: string;
  description?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  coverPhoto?: string;
  avatarPhoto?: string;
  taxId?: string;
}

interface SearchFilters {
  query?: string;
  categoryId?: string;
  latitude?: number;
  longitude?: number;
  radiusKm: number;
  minRating?: number;
  minPrice?: number;
  maxPrice?: number;
  countryId?: string;
  page: number;
  perPage: number;
}

export async function createProfessional(userId: string, data: CreateProfessionalData) {
  const existing = await prisma.professional.findUnique({
    where: { userId },
  });

  if (existing) {
    throw new ConflictError('User already has a professional profile');
  }

  // Auto-geocode if coordinates not provided
  let { latitude, longitude } = data;
  if ((!latitude || !longitude) && data.address) {
    const geo = await geocodeAddress(data.address);
    if (geo) {
      latitude = geo.latitude;
      longitude = geo.longitude;
    }
  }

  return prisma.professional.create({
    data: {
      userId,
      businessName: data.businessName,
      description: data.description,
      address: data.address,
      latitude: latitude || 0,
      longitude: longitude || 0,
      taxId: data.taxId,
      countryId: data.countryId,
    },
    include: {
      user: { select: { name: true, avatar: true } },
      country: true,
    },
  });
}

export async function getProfessionalById(id: string) {
  const professional = await prisma.professional.findUnique({
    where: { id },
    include: {
      user: { select: { name: true, avatar: true } },
      services: { where: { active: true }, orderBy: { name: 'asc' } },
      workingHours: { orderBy: { dayOfWeek: 'asc' } },
      country: true,
    },
  });

  if (!professional) {
    throw new NotFoundError('Professional');
  }

  return professional;
}

export async function getProfessionalByUserId(userId: string) {
  const professional = await prisma.professional.findUnique({
    where: { userId },
    include: {
      user: { select: { name: true, avatar: true } },
      services: { where: { active: true }, orderBy: { name: 'asc' } },
      workingHours: { orderBy: { dayOfWeek: 'asc' } },
      country: true,
    },
  });

  if (!professional) {
    throw new NotFoundError('Professional');
  }

  return professional;
}

export async function updateProfessional(id: string, userId: string, data: UpdateProfessionalData) {
  const professional = await prisma.professional.findUnique({
    where: { id },
    select: { userId: true },
  });

  if (!professional) {
    throw new NotFoundError('Professional');
  }

  if (professional.userId !== userId) {
    throw new ForbiddenError('You can only update your own professional profile');
  }

  // Auto-geocode if address changed but no coordinates provided
  if (data.address && !data.latitude && !data.longitude) {
    const geo = await geocodeAddress(data.address);
    if (geo) {
      data.latitude = geo.latitude;
      data.longitude = geo.longitude;
    }
  }

  return prisma.professional.update({
    where: { id },
    data,
    include: {
      user: { select: { name: true, avatar: true } },
      country: true,
    },
  });
}

export async function searchProfessionals(filters: SearchFilters) {
  const { query, categoryId, latitude, longitude, radiusKm, minRating, minPrice, maxPrice, countryId, page, perPage } = filters;
  const offset = (page - 1) * perPage;

  const useGeoSearch = latitude !== undefined && longitude !== undefined;

  if (useGeoSearch) {
    // Haversine distance calculation in pure SQL (no PostGIS needed)
    // Returns distance in meters
    const distanceExpr = `
      6371000 * 2 * ASIN(SQRT(
        POWER(SIN(RADIANS(p.latitude - $1) / 2), 2) +
        COS(RADIANS($1)) * COS(RADIANS(p.latitude)) *
        POWER(SIN(RADIANS(p.longitude - $2) / 2), 2)
      ))
    `;

    const conditions: string[] = [
      'p.active = true',
      `p.status = 'APPROVED'`,
      `${distanceExpr} <= $3`,
    ];
    const params: unknown[] = [latitude, longitude, radiusKm * 1000];
    let paramIndex = 4;

    if (query) {
      conditions.push(`(p.business_name ILIKE $${paramIndex} OR u.name ILIKE $${paramIndex})`);
      params.push(`%${query}%`);
      paramIndex++;
    }

    if (categoryId) {
      conditions.push(`EXISTS (SELECT 1 FROM services s WHERE s.professional_id = p.id AND s.category_id = $${paramIndex} AND s.active = true)`);
      params.push(categoryId);
      paramIndex++;
    }

    if (minRating !== undefined) {
      conditions.push(`p.rating >= $${paramIndex}`);
      params.push(minRating);
      paramIndex++;
    }

    if (minPrice !== undefined) {
      conditions.push(`EXISTS (SELECT 1 FROM services s WHERE s.professional_id = p.id AND s.price >= $${paramIndex} AND s.active = true)`);
      params.push(minPrice);
      paramIndex++;
    }

    if (maxPrice !== undefined) {
      conditions.push(`EXISTS (SELECT 1 FROM services s WHERE s.professional_id = p.id AND s.price <= $${paramIndex} AND s.active = true)`);
      params.push(maxPrice);
      paramIndex++;
    }

    if (countryId) {
      conditions.push(`p.country_id = $${paramIndex}`);
      params.push(countryId);
      paramIndex++;
    }

    const whereClause = conditions.join(' AND ');

    const countQuery = `
      SELECT COUNT(*)::int AS total
      FROM professionals p
      JOIN users u ON u.id = p.user_id
      WHERE ${whereClause}
    `;

    const dataQuery = `
      SELECT
        p.id,
        p.business_name AS "businessName",
        p.description,
        p.address,
        p.latitude,
        p.longitude,
        p.cover_photo AS "coverPhoto",
        p.avatar_photo AS "avatarPhoto",
        p.rating,
        p.total_reviews AS "totalReviews",
        p.verified,
        p.active,
        p.status,
        p.tax_id AS "taxId",
        p.user_id AS "userId",
        p.country_id AS "countryId",
        p.created_at AS "createdAt",
        p.updated_at AS "updatedAt",
        u.name AS "userName",
        u.avatar AS "userAvatar",
        (${distanceExpr}) AS "distanceMeters"
      FROM professionals p
      JOIN users u ON u.id = p.user_id
      WHERE ${whereClause}
      ORDER BY "distanceMeters" ASC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;
    params.push(perPage, offset);

    const [countResult, rawData] = await Promise.all([
      prisma.$queryRawUnsafe<[{ total: number }]>(countQuery, ...params.slice(0, -2)),
      prisma.$queryRawUnsafe<any[]>(dataQuery, ...params),
    ]);

    // Shape data to match Prisma output format
    const data = rawData.map((row) => ({
      ...row,
      user: { name: row.userName, avatar: row.userAvatar },
    }));

    const total = countResult[0]?.total ?? 0;
    const totalPages = Math.ceil(total / perPage);

    return {
      data,
      meta: {
        total,
        page,
        perPage,
        totalPages,
      },
    };
  }

  // Non-geo search using Prisma
  const where: Prisma.ProfessionalWhereInput = {
    active: true,
    status: 'APPROVED',
  };

  if (query) {
    where.OR = [
      { businessName: { contains: query, mode: 'insensitive' } },
      { user: { name: { contains: query, mode: 'insensitive' } } },
    ];
  }

  if (categoryId) {
    where.services = { some: { categoryId, active: true } };
  }

  if (minRating !== undefined) {
    where.rating = { gte: minRating };
  }

  if (minPrice !== undefined || maxPrice !== undefined) {
    const priceFilter: Prisma.ServiceWhereInput = { active: true };
    if (minPrice !== undefined) priceFilter.price = { ...priceFilter.price as object, gte: minPrice };
    if (maxPrice !== undefined) priceFilter.price = { ...priceFilter.price as object, lte: maxPrice };
    where.services = { ...where.services as object, some: { ...((where.services as Prisma.ServiceListRelationFilter)?.some ?? {}), ...priceFilter } };
  }

  if (countryId) {
    where.countryId = countryId;
  }

  const [data, total] = await Promise.all([
    prisma.professional.findMany({
      where,
      include: {
        user: { select: { name: true, avatar: true } },
        services: { where: { active: true }, orderBy: { price: 'asc' }, take: 3 },
        country: true,
      },
      orderBy: { rating: 'desc' },
      skip: offset,
      take: perPage,
    }),
    prisma.professional.count({ where }),
  ]);

  const totalPages = Math.ceil(total / perPage);

  return {
    data,
    meta: {
      total,
      page,
      perPage,
      totalPages,
    },
  };
}

export async function listFeatured(countryId: string, limit: number = 10) {
  return prisma.professional.findMany({
    where: {
      countryId,
      verified: true,
      active: true,
      status: 'APPROVED',
    },
    include: {
      user: { select: { name: true, avatar: true } },
      services: { where: { active: true }, orderBy: { price: 'asc' }, take: 3 },
      country: true,
    },
    orderBy: [{ rating: 'desc' }, { totalReviews: 'desc' }],
    take: limit,
  });
}
