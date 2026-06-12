import { PrismaClient, UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const email = 'thanhhuyenfarm@gmail.com'; // Adding @gmail.com for valid email format
  const password = await bcrypt.hash('thanh@12345', 10);
  const orgName = 'Thanh Huyen Farm';
  const slug = 'thanhhuyen-farm';

  // Create Organization
  const org = await prisma.organization.upsert({
    where: { slug },
    update: {},
    create: {
      name: orgName,
      slug: slug,
    },
  });

  // Create Permissions
  await prisma.rolePermission.createMany({
    data: [
      { organizationId: org.id, role: UserRole.OWNER, permission: '*' },
    ],
    skipDuplicates: true,
  });

  // Create User
  const user = await prisma.user.upsert({
    where: { email },
    update: { passwordHash: password },
    create: {
      organizationId: org.id,
      email: email,
      passwordHash: password,
      firstName: 'Thanh',
      lastName: 'Huyền',
      role: UserRole.OWNER,
    },
  });

  console.log(`Successfully created owner account: ${email}`);
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
