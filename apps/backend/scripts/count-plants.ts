import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const count = await prisma.plant.count();
  console.log(`Total plants in PostgreSQL: ${count}`);
  
  const zones = await prisma.zone.findMany({
    include: { _count: { select: { plants: true } } }
  });
  console.log("Plants per zone:");
  zones.forEach(z => {
    console.log(`- ${z.name}: ${z._count.plants}`);
  });
}

main().finally(() => prisma.$disconnect());
