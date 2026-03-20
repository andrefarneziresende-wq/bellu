import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // ── Countries ──────────────────────────────────────────────
  const brazil = await prisma.country.upsert({
    where: { code: 'BR' },
    update: {},
    create: {
      code: 'BR',
      name: 'Brazil',
      currency: 'BRL',
      currencySymbol: 'R$',
      timezone: 'America/Sao_Paulo',
      locale: 'pt-BR',
      phonePrefix: '+55',
    },
  });

  const spain = await prisma.country.upsert({
    where: { code: 'ES' },
    update: {},
    create: {
      code: 'ES',
      name: 'Spain',
      currency: 'EUR',
      currencySymbol: '€',
      timezone: 'Europe/Madrid',
      locale: 'es-ES',
      phonePrefix: '+34',
    },
  });

  console.log(`Countries: ${brazil.name}, ${spain.name}`);

  // ── Categories ─────────────────────────────────────────────
  const categories = [
    { slug: 'hair',        icon: 'scissors', order: 1,  translations: [{ locale: 'pt-BR', name: 'Cabelo' },           { locale: 'es-ES', name: 'Cabello' },          { locale: 'en', name: 'Hair' }] },
    { slug: 'nails',       icon: 'sparkles', order: 2,  translations: [{ locale: 'pt-BR', name: 'Unhas' },            { locale: 'es-ES', name: 'Uñas' },             { locale: 'en', name: 'Nails' }] },
    { slug: 'facial',      icon: 'droplets', order: 3,  translations: [{ locale: 'pt-BR', name: 'Estética Facial' },  { locale: 'es-ES', name: 'Estética Facial' },  { locale: 'en', name: 'Facial Aesthetics' }] },
    { slug: 'body',        icon: 'body',     order: 4,  translations: [{ locale: 'pt-BR', name: 'Estética Corporal' },{ locale: 'es-ES', name: 'Estética Corporal' },{ locale: 'en', name: 'Body Aesthetics' }] },
    { slug: 'eyebrows',    icon: 'eye',      order: 5,  translations: [{ locale: 'pt-BR', name: 'Sobrancelha' },      { locale: 'es-ES', name: 'Cejas' },            { locale: 'en', name: 'Eyebrows' }] },
    { slug: 'lashes',      icon: 'eye',      order: 6,  translations: [{ locale: 'pt-BR', name: 'Cílios' },           { locale: 'es-ES', name: 'Pestañas' },         { locale: 'en', name: 'Lashes' }] },
    { slug: 'makeup',      icon: 'palette',  order: 7,  translations: [{ locale: 'pt-BR', name: 'Maquiagem' },        { locale: 'es-ES', name: 'Maquillaje' },       { locale: 'en', name: 'Makeup' }] },
    { slug: 'barbershop',  icon: 'scissors', order: 8,  translations: [{ locale: 'pt-BR', name: 'Barbearia' },        { locale: 'es-ES', name: 'Barbería' },         { locale: 'en', name: 'Barbershop' }] },
    { slug: 'massage',     icon: 'hand',     order: 9,  translations: [{ locale: 'pt-BR', name: 'Massagem' },         { locale: 'es-ES', name: 'Masaje' },           { locale: 'en', name: 'Massage' }] },
    { slug: 'depilation',  icon: 'zap',      order: 10, translations: [{ locale: 'pt-BR', name: 'Depilação' },        { locale: 'es-ES', name: 'Depilación' },       { locale: 'en', name: 'Depilation' }] },
  ];

  for (const cat of categories) {
    const { translations, ...categoryData } = cat;

    await prisma.category.upsert({
      where: { slug: cat.slug },
      update: {
        icon: cat.icon,
        order: cat.order,
      },
      create: {
        ...categoryData,
        translations: {
          create: translations,
        },
      },
    });
  }

  console.log(`Categories: ${categories.length} upserted`);

  // ── Admin Superuser ────────────────────────────────────────
  const passwordHash = await bcrypt.hash('admin123', 10);

  await prisma.adminUser.upsert({
    where: { email: 'admin@beauty.com' },
    update: {},
    create: {
      name: 'Admin',
      email: 'admin@beauty.com',
      passwordHash,
      role: 'SUPERADMIN',
    },
  });

  console.log('Admin superuser created: admin@beauty.com');

  console.log('Seed completed.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
