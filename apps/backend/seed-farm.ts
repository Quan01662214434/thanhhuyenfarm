import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  let org = await prisma.organization.findFirst();
  if (!org) {
    org = await prisma.organization.create({
      data: { name: 'Thanh Huyen Farm Org' }
    });
    console.log('Created org:', org.id);
  }
  
  let farm = await prisma.farm.findFirst({ where: { organizationId: org.id } });
  if (!farm) {
    farm = await prisma.farm.create({
      data: { name: 'Thanh Huyen Farm', organizationId: org.id }
    });
    console.log('Created farm:', farm.id);
  } else {
    console.log('Farm already exists:', farm.id);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
