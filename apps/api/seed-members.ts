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
  console.log('Adding team members to professional:', proId);

  const membersData = [
    {
      name: 'Camila Oliveira',
      email: 'camila@studio.com',
      phone: '11988001100',
      role: 'staff',
      specialties: 'Corte Feminino, Coloração, Escova',
      commissionPercent: 45,
      avatar: 'https://images.unsplash.com/photo-1580618672591-eb180b1a973f?w=200&h=200&fit=crop&crop=face',
    },
    {
      name: 'Rafael Mendes',
      email: 'rafael@studio.com',
      phone: '11988002200',
      role: 'staff',
      specialties: 'Corte Masculino, Barba, Degradê',
      commissionPercent: 40,
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&crop=face',
    },
    {
      name: 'Juliana Santos',
      email: 'juliana@studio.com',
      phone: '11988003300',
      role: 'staff',
      specialties: 'Manicure, Pedicure, Nail Art',
      commissionPercent: 35,
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop&crop=face',
    },
  ];

  for (const member of membersData) {
    const existing = await prisma.professionalMember.findFirst({
      where: { professionalId: proId, email: member.email },
    });

    if (!existing) {
      const created = await prisma.professionalMember.create({
        data: {
          professionalId: proId,
          name: member.name,
          email: member.email,
          phone: member.phone,
          role: member.role,
          specialties: member.specialties,
          commissionPercent: member.commissionPercent,
          avatar: member.avatar,
          active: true,
        },
      });
      console.log(`  Created member: ${member.name} (${created.id})`);
    } else {
      // Update avatar if missing
      if (!existing.avatar) {
        await prisma.professionalMember.update({
          where: { id: existing.id },
          data: { avatar: member.avatar },
        });
        console.log(`  Updated avatar for: ${member.name}`);
      } else {
        console.log(`  Already exists: ${member.name}`);
      }
    }
  }

  // Also update Ana Paula (existing member) with an avatar
  const ana = await prisma.professionalMember.findFirst({
    where: { professionalId: proId, name: 'Ana Paula' },
  });
  if (ana && !ana.avatar) {
    await prisma.professionalMember.update({
      where: { id: ana.id },
      data: {
        avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&h=200&fit=crop&crop=face',
      },
    });
    console.log('  Updated avatar for: Ana Paula');
  }

  console.log('Done! Members seeded.');
}

seed()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
