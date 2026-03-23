import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const cats = await prisma.category.findMany();
  const data: [string, string][] = [
    ['Corte Feminino', 'hair'], ['Corte Masculino', 'barbershop'], ['Coloração', 'hair'],
    ['Manicure', 'nails'], ['Pedicure', 'nails'], ['Limpeza de Pele', 'facial'],
    ['Design de Sobrancelha', 'eyebrows'], ['Massagem Relaxante', 'massage'],
    ['Hidratação Capilar', 'hair'], ['Escova Progressiva', 'hair'],
    ['Depilação', 'depilation'], ['Maquiagem', 'makeup'],
    ['Micropigmentação', 'eyebrows'], ['Extensão de Cílios', 'lashes'],
    ['Tratamento Facial', 'facial'], ['Drenagem Linfática', 'massage'],
    ['Barba', 'barbershop'], ['Penteado', 'hair'],
    ['Gel / Alongamento de Unhas', 'nails'], ['Peeling', 'facial'],
  ];

  let count = 0;
  for (let i = 0; i < data.length; i++) {
    const [name, slug] = data[i];
    const cat = cats.find(c => c.slug === slug);
    if (cat) {
      await prisma.serviceTemplate.create({ data: { name, categoryId: cat.id, order: i } });
      count++;
    }
  }

  // Link existing services to their templates
  const templates = await prisma.serviceTemplate.findMany();
  const services = await prisma.service.findMany();
  let linked = 0;
  for (const svc of services) {
    const tmpl = templates.find(t => t.name === svc.name);
    if (tmpl) {
      await prisma.service.update({
        where: { id: svc.id },
        data: { serviceTemplateId: tmpl.id },
      });
      linked++;
    }
  }

  console.log(`Created ${count} templates, linked ${linked} services`);
  await prisma.$disconnect();
}

main();
