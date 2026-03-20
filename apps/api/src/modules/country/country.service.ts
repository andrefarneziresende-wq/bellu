import { prisma } from '../../config/prisma.js';
import { NotFoundError } from '../../shared/errors.js';

export async function listCountries() {
  return prisma.country.findMany({
    where: { active: true },
    orderBy: { name: 'asc' },
  });
}

export async function getCountryById(id: string) {
  const country = await prisma.country.findUnique({ where: { id } });

  if (!country) {
    throw new NotFoundError('Country');
  }

  return country;
}

export async function getCountryByCode(code: string) {
  const country = await prisma.country.findUnique({
    where: { code: code.toUpperCase() },
  });

  if (!country) {
    throw new NotFoundError('Country');
  }

  return country;
}
