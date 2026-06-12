import {
  MediaKind,
  NotificationSeverity,
  PlantHealth,
  PrismaClient,
  TaskStatus,
  UserRole,
} from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const existing = await prisma.plant.findFirst({
    where: { qrToken: 'demo-public-token-secure' },
  });
  if (existing) {
    // eslint-disable-next-line no-console
    console.log('Database already seeded — skipping.');
    return;
  }

  const password = await bcrypt.hash('Demo@12345', 10);

  const org = await prisma.organization.upsert({
    where: { slug: 'thanhhuyen-demo' },
    update: {},
    create: {
      name: 'Thanh Huyen Farm Demo',
      slug: 'thanhhuyen-demo',
    },
  });

  await prisma.rolePermission.createMany({
    data: [
      { organizationId: org.id, role: UserRole.OWNER, permission: '*' },
      { organizationId: org.id, role: UserRole.MANAGER, permission: 'plants:read' },
      { organizationId: org.id, role: UserRole.MANAGER, permission: 'plants:write' },
      { organizationId: org.id, role: UserRole.MANAGER, permission: 'employees:read' },
      { organizationId: org.id, role: UserRole.EMPLOYEE, permission: 'plants:read' },
      { organizationId: org.id, role: UserRole.EMPLOYEE, permission: 'tasks:own' },
    ],
  });

  const owner = await prisma.user.upsert({
    where: { email: 'owner@farm.demo' },
    update: {},
    create: {
      organizationId: org.id,
      email: 'owner@farm.demo',
      passwordHash: password,
      firstName: 'Lan',
      lastName: 'Nguyen',
      role: UserRole.OWNER,
      kpiScore: 100,
    },
  });

  const manager = await prisma.user.upsert({
    where: { email: 'manager@farm.demo' },
    update: {},
    create: {
      organizationId: org.id,
      email: 'manager@farm.demo',
      passwordHash: password,
      firstName: 'Minh',
      lastName: 'Tran',
      role: UserRole.MANAGER,
      specialty: 'IPM',
      kpiScore: 88,
    },
  });

  const employee = await prisma.user.upsert({
    where: { email: 'employee@farm.demo' },
    update: {},
    create: {
      organizationId: org.id,
      email: 'employee@farm.demo',
      passwordHash: password,
      firstName: 'Hoa',
      lastName: 'Pham',
      role: UserRole.EMPLOYEE,
      specialty: 'Field ops',
      kpiScore: 76,
    },
  });

  const farm = await prisma.farm.create({
    data: {
      organizationId: org.id,
      name: 'Green Valley Orchard',
      address: 'Lam Dong, Vietnam',
      latitude: 11.94,
      longitude: 108.45,
    },
  });

  const zoneA = await prisma.zone.create({
    data: { farmId: farm.id, name: 'Zone A — Avocado', description: 'Hill slope, drip irrigation' },
  });

  const season = await prisma.season.create({
    data: {
      farmId: farm.id,
      name: 'Spring 2026',
      startDate: new Date('2026-01-01'),
      endDate: new Date('2026-06-30'),
      laborCost: 120000000,
      inputCost: 45000000,
      revenue: 210000000,
      profit: 45000000,
    },
  });

  const plant = await prisma.plant.create({
    data: {
      zoneId: zoneA.id,
      species: 'Hass Avocado',
      plantedAt: new Date('2022-03-15'),
      health: PlantHealth.HEALTHY,
      statusNote: 'Strong canopy, flowering stage',
      qrToken: 'demo-public-token-secure',
      estimatedHarvestAt: new Date('2026-08-20'),
      aiYieldPrediction: { kgPerTree: 42, confidence: 0.82, model: 'baseline-regressor' },
      currentYieldEstimate: 38.5,
    },
  });

  await prisma.qrCode.create({
    data: {
      plantId: plant.id,
      payload: JSON.stringify({ plantId: plant.id, token: plant.qrToken }),
    },
  });

  await prisma.mediaFile.create({
    data: {
      plantId: plant.id,
      uploadedBy: employee.id,
      kind: MediaKind.IMAGE,
      storageKey: `plants/${plant.id}/canopy-1.jpg`,
      url: 'https://images.unsplash.com/photo-1523348837708-15d4a09cfac2?w=1200',
      caption: 'Canopy — morning',
    },
  });

  await prisma.plantHistory.createMany({
    data: [
      {
        plantId: plant.id,
        actorId: employee.id,
        title: 'Pruning light',
        detail: 'Removed water shoots',
      },
      {
        plantId: plant.id,
        actorId: manager.id,
        title: 'Scouting',
        detail: 'No pests observed',
      },
    ],
  });

  await prisma.diseaseRecord.create({
    data: {
      plantId: plant.id,
      name: 'Anthracnose (mild)',
      severity: 2,
      notes: 'Treated early',
      aiDetected: false,
    },
  });

  await prisma.treatment.create({
    data: {
      plantId: plant.id,
      product: 'Copper oxychloride',
      dosage: '0.3% spray',
      appliedById: manager.id,
    },
  });

  await prisma.fertilizerApplication.create({
    data: {
      plantId: plant.id,
      product: 'Organic NPK 4-3-3',
      amount: '2kg / tree',
      appliedById: employee.id,
    },
  });

  await prisma.wateringLog.create({
    data: { plantId: plant.id, liters: 45, notes: 'Drip 35m' },
  });

  await prisma.harvest.create({
    data: {
      plantId: plant.id,
      seasonId: season.id,
      quantityKg: 36,
      quality: 'Grade A',
      revenue: 2800000,
    },
  });

  await prisma.certification.create({
    data: {
      plantId: plant.id,
      title: 'VietGAP',
      issuer: 'Local authority',
      validTo: new Date('2027-12-31'),
    },
  });

  await prisma.employeeTask.create({
    data: {
      plantId: plant.id,
      title: 'Inspect drip emitters',
      description: 'Zone A row 3-6',
      status: TaskStatus.IN_PROGRESS,
      assigneeId: employee.id,
      createdById: manager.id,
      dueAt: new Date(),
    },
  });

  await prisma.notification.create({
    data: {
      userId: owner.id,
      title: 'Harvest window approaching',
      body: `${plant.species} estimated in 10 weeks`,
      severity: NotificationSeverity.INFO,
      channels: ['IN_APP', 'EMAIL'],
    },
  });

  await prisma.attendanceLog.create({
    data: {
      userId: employee.id,
      latitude: 11.9401,
      longitude: 108.4502,
      accuracyM: 12,
      note: 'Check-in at Zone A gate',
    },
  });

  await prisma.activityLog.create({
    data: {
      actorId: employee.id,
      action: 'PLANT_UPDATE',
      entity: 'Plant',
      entityId: plant.id,
      metadata: { field: 'health', value: PlantHealth.HEALTHY },
    },
  });

  console.log('Seed OK. Owner login: owner@farm.demo / Demo@12345');
  console.log('Public plant page token in QR:', plant.qrToken);
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
