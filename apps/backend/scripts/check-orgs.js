const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

async function main() {
  // List all users with their org
  const users = await p.user.findMany({
    select: { email: true, organizationId: true, role: true }
  });
  console.log('=== USERS ===');
  console.log(JSON.stringify(users, null, 2));

  // Count plants
  const plantCount = await p.plant.count({ where: { deletedAt: null } });
  console.log('\nTotal plants:', plantCount);

  // Check which org owns the plants
  const zones = await p.zone.findMany({
    include: { farm: { select: { organizationId: true, name: true } } },
    take: 3
  });
  console.log('\n=== ZONES (first 3) ===');
  zones.forEach(z => console.log(`Zone: ${z.name} → Org: ${z.farm.organizationId}`));

  await p.$disconnect();
}
main();
