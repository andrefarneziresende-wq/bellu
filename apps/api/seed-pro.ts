import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seed() {
  const country = await prisma.country.findFirst({ where: { code: 'BR' } });
  if (!country) {
    console.log('No BR country found');
    return;
  }

  const existing = await prisma.user.findUnique({ where: { email: 'pro@bellu.com' } });
  if (existing) {
    console.log('Pro user already exists:', existing.id);
    const pro = await prisma.professional.findUnique({ where: { userId: existing.id } });
    console.log('Professional:', pro?.id);
    return;
  }

  const hash = await bcrypt.hash('pro123', 10);
  const user = await prisma.user.create({
    data: {
      name: 'Studio Bellu Demo',
      email: 'pro@bellu.com',
      passwordHash: hash,
      countryId: country.id,
      locale: 'pt-BR',
    },
  });

  const pro = await prisma.professional.create({
    data: {
      userId: user.id,
      businessName: 'Studio Bellu Demo',
      description: 'Salao de beleza completo com os melhores profissionais da regiao.',
      address: 'Rua das Flores, 123 - Sao Paulo, SP',
      latitude: -23.5505,
      longitude: -46.6333,
      countryId: country.id,
      taxId: '12345678000190',
      status: 'APPROVED',
      verified: true,
      active: true,
    },
  });

  console.log('Created pro user:', user.email);
  console.log('Professional ID:', pro.id);
}

seed()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
