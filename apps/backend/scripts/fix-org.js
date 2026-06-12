const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

async function main() {
  const targetOrgId = 'cmp0wzat70000uvokklk2n4db'; // thanhhuyenfarm@gmail.com org
  const sourceOrgId = 'cmp0d8m8v0000uvq805sbqqan'; // owner@farm.demo org

  // Move all farms from source org to target org
  const result = await p.farm.updateMany({
    where: { organizationId: sourceOrgId },
    data: { organizationId: targetOrgId },
  });

  console.log(`Moved ${result.count} farm(s) to your organization.`);

  // Verify
  const plantCount = await p.plant.count({
    where: {
      deletedAt: null,
      zone: { farm: { organizationId: targetOrgId } },
    },
  });
  console.log(`thanhhuyenfarm@gmail.com now has ${plantCount} plants!`);

  await p.$disconnect();
}
main();
