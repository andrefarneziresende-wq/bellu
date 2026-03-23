import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seed() {
  // Find the pro user
  const user = await prisma.user.findUnique({
    where: { email: 'pro@bellu.com' },
    include: { professional: true },
  });

  if (!user || !user.professional) {
    console.log('Pro user not found. Run seed-pro.ts first.');
    return;
  }

  const proId = user.professional.id;
  console.log('Seeding data for professional:', proId);

  // Get categories
  const categories = await prisma.category.findMany();
  if (categories.length === 0) {
    console.log('No categories found. Seed categories first.');
    return;
  }

  // Create services
  const servicesData = [
    { name: 'Corte Feminino', description: 'Corte moderno com lavagem e finalização', price: 80, duration: 45, catSlug: 'cabelo' },
    { name: 'Corte Masculino', description: 'Corte masculino com máquina e tesoura', price: 50, duration: 30, catSlug: 'barbearia' },
    { name: 'Coloração', description: 'Coloração completa com produtos premium', price: 180, duration: 120, catSlug: 'cabelo' },
    { name: 'Manicure', description: 'Manicure com esmaltação em gel', price: 45, duration: 40, catSlug: 'unhas' },
    { name: 'Pedicure', description: 'Pedicure completa com hidratação', price: 55, duration: 50, catSlug: 'unhas' },
    { name: 'Limpeza de Pele', description: 'Limpeza de pele profunda com extração', price: 120, duration: 60, catSlug: 'rosto' },
    { name: 'Design de Sobrancelha', description: 'Design com pinça e henna', price: 40, duration: 30, catSlug: 'sobrancelhas' },
    { name: 'Massagem Relaxante', description: 'Massagem corpo inteiro 60 minutos', price: 150, duration: 60, catSlug: 'massagem' },
  ];

  for (const svc of servicesData) {
    const cat = categories.find((c) => c.slug === svc.catSlug) || categories[0];
    const existing = await prisma.service.findFirst({
      where: { professionalId: proId, name: svc.name },
    });
    if (!existing) {
      await prisma.service.create({
        data: {
          professionalId: proId,
          categoryId: cat.id,
          name: svc.name,
          description: svc.description,
          price: svc.price,
          currency: 'BRL',
          durationMinutes: svc.duration,
          active: true,
        },
      });
      console.log('  Created service:', svc.name);
    }
  }

  // Create working hours (Mon-Sat 9:00-18:00, Sun off)
  for (let day = 0; day <= 6; day++) {
    const existing = await prisma.workingHours.findFirst({
      where: { professionalId: proId, dayOfWeek: day },
    });
    if (!existing) {
      await prisma.workingHours.create({
        data: {
          professionalId: proId,
          dayOfWeek: day,
          startTime: day === 0 ? '00:00' : '09:00',
          endTime: day === 0 ? '00:00' : '18:00',
          isOff: day === 0,
        },
      });
    }
  }
  console.log('  Created working hours');

  // Create a team member
  const memberExists = await prisma.professionalMember.findFirst({
    where: { professionalId: proId },
  });
  if (!memberExists) {
    await prisma.professionalMember.create({
      data: {
        professionalId: proId,
        name: 'Ana Paula',
        email: 'ana@studio.com',
        phone: '11999887766',
        role: 'staff',
        specialties: 'Coloração, Corte Feminino',
        commissionPercent: 40,
        active: true,
      },
    });
    console.log('  Created team member: Ana Paula');
  }

  // Create sample bookings for today
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const services = await prisma.service.findMany({ where: { professionalId: proId } });

  const bookingsData = [
    { clientName: 'Maria Santos', clientPhone: '11999001122', serviceIdx: 0, startTime: '10:00', endTime: '10:45', status: 'CONFIRMED' as const },
    { clientName: 'Juliana Costa', clientPhone: '11999003344', serviceIdx: 3, startTime: '11:00', endTime: '11:40', status: 'CONFIRMED' as const },
    { clientName: 'Fernanda Lima', clientPhone: '11999005566', serviceIdx: 5, startTime: '14:00', endTime: '15:00', status: 'PENDING' as const },
    { clientName: 'Carla Mendes', clientPhone: '11999007788', serviceIdx: 2, startTime: '15:30', endTime: '17:30', status: 'PENDING' as const },
  ];

  for (const b of bookingsData) {
    const svc = services[b.serviceIdx] || services[0];
    const existingBooking = await prisma.booking.findFirst({
      where: { professionalId: proId, clientName: b.clientName, date: today },
    });
    if (!existingBooking) {
      await prisma.booking.create({
        data: {
          professionalId: proId,
          serviceId: svc.id,
          date: today,
          startTime: b.startTime,
          endTime: b.endTime,
          status: b.status,
          totalPrice: svc.price,
          currency: 'BRL',
          paymentStatus: 'PENDING',
          source: 'MANUAL',
          clientName: b.clientName,
          clientPhone: b.clientPhone,
        },
      });
      console.log('  Created booking:', b.clientName, b.startTime);
    }
  }

  console.log('Done!');
}

seed()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
