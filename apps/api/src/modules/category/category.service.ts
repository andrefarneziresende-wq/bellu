import { prisma } from '../../config/prisma.js';
import { NotFoundError } from '../../shared/errors.js';

export async function listCategories(locale?: string) {
  return prisma.category.findMany({
    orderBy: { order: 'asc' },
    include: {
      translations: locale
        ? { where: { locale } }
        : true,
    },
  });
}

export async function getCategoryById(id: string) {
  const category = await prisma.category.findUnique({
    where: { id },
    include: { translations: true },
  });

  if (!category) {
    throw new NotFoundError('Category');
  }

  return category;
}

export async function createCategory(data: {
  slug: string;
  icon: string;
  order: number;
  translations: { locale: string; name: string }[];
}) {
  return prisma.category.create({
    data: {
      slug: data.slug,
      icon: data.icon,
      order: data.order,
      translations: {
        create: data.translations,
      },
    },
    include: { translations: true },
  });
}

export async function updateCategory(
  id: string,
  data: {
    slug?: string;
    icon?: string;
    order?: number;
    translations?: { locale: string; name: string }[];
  },
) {
  const existing = await prisma.category.findUnique({ where: { id } });

  if (!existing) {
    throw new NotFoundError('Category');
  }

  const { translations, ...categoryData } = data;

  return prisma.category.update({
    where: { id },
    data: {
      ...categoryData,
      ...(translations && {
        translations: {
          deleteMany: {},
          create: translations,
        },
      }),
    },
    include: { translations: true },
  });
}

export async function deleteCategory(id: string) {
  const existing = await prisma.category.findUnique({ where: { id } });

  if (!existing) {
    throw new NotFoundError('Category');
  }

  return prisma.category.delete({ where: { id } });
}
