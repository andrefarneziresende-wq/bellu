import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seed() {
  const proId = 'd3c29e8f-cfb4-4eec-9c8a-0ceb6965a943';
  console.log('Adding team members to Studio Bella Hair:', proId);

  const membersData = [
    {
      name: 'Camila Oliveira',
      email: 'camila@bellahair.com',
      phone: '11988001100',
      role: 'staff',
      specialties: 'Corte Feminino, Coloração, Escova',
      commissionPercent: 45,
      avatar: 'https://images.unsplash.com/photo-1580618672591-eb180b1a973f?w=200&h=200&fit=crop&crop=face',
    },
    {
      name: 'Rafael Mendes',
      email: 'rafael@bellahair.com',
      phone: '11988002200',
      role: 'staff',
      specialties: 'Corte Masculino, Barba, Degradê',
      commissionPercent: 40,
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&crop=face',
    },
    {
      name: 'Juliana Santos',
      email: 'juliana@bellahair.com',
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
          ...member,
          active: true,
        },
      });
      console.log(`  Created: ${member.name} (${created.id})`);
    } else {
      console.log(`  Already exists: ${member.name}`);
    }
  }

  console.log('Done!');
}

seed()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
