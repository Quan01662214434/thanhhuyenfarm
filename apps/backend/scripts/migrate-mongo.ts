import { PrismaClient } from "@prisma/client";
import { MongoClient } from "mongodb";
import * as dotenv from "dotenv";
import * as path from "path";

// Load custom env for migration
dotenv.config({ path: path.resolve(process.cwd(), "scripts/.env.migration") });

const prisma = new PrismaClient();

async function main() {
  const mongoUri = process.env.MONGO_URI;
  const mongoUser = process.env.MONGO_USER;
  const mongoPass = process.env.MONGO_PASS;

  if (!mongoUri || !mongoUser || !mongoPass) {
    throw new Error("Missing MONGO_URI, MONGO_USER, or MONGO_PASS in scripts/.env.migration");
  }

  console.log("Connecting to MongoDB...");
  const client = new MongoClient(mongoUri, {
    auth: { username: mongoUser, password: mongoPass }
  });
  await client.connect();
  const db = client.db("thanh-huyen-farm");
  const treesCollection = db.collection("trees");

  const totalTrees = await treesCollection.countDocuments();
  console.log(`Found ${totalTrees} trees in MongoDB.`);

  // Get or create a default Farm and Zone for the migrated data
  // Assuming 'owner@farm.demo' exists from your seed.ts
  const ownerUser = await prisma.user.findFirst({
    where: { email: "owner@farm.demo" },
    include: { organization: true },
  });

  if (!ownerUser) {
    throw new Error("Owner user not found. Please run 'npm run db:seed' first.");
  }

  let farm = await prisma.farm.findFirst({ where: { organizationId: ownerUser.organizationId } });
  if (!farm) {
    farm = await prisma.farm.create({
      data: { name: "Thanh Huyen Farm (Migrated)", organizationId: ownerUser.organizationId },
    });
  }

  console.log("Migrating trees...");
  let count = 0;
  const cursor = treesCollection.find({});

  // To track qrTokens and prevent unique constraint violations
  const seenQrTokens = new Set<string>();

  for await (const tree of cursor) {
    // Determine the zone based on "area" from Mongo
    const areaName = tree.area || "Khu vực mặc định";
    let zone = await prisma.zone.findFirst({ where: { farmId: farm.id, name: areaName } });
    if (!zone) {
      zone = await prisma.zone.create({ data: { name: areaName, farmId: farm.id } });
    }

    // Determine health status
    let healthStatus: "HEALTHY" | "WATCH" | "DISEASED" | "RECOVERING" | "DEAD" = "HEALTHY";
    if (tree.currentHealth?.toLowerCase().includes("bệnh")) healthStatus = "DISEASED";
    if (tree.currentHealth?.toLowerCase().includes("chết")) healthStatus = "DEAD";

    const legacyIdStr = tree._id.toString();
    const numericIdStr = tree.numericId?.toString();
    
    // Logic để không mất cây nào: 
    // 1. Dùng _id của Mongo làm khóa chính (id) trong Postgres
    // 2. Nếu numericId bị trùng, ta gắn thêm hậu tố để không bị lỗi Unique của qrToken
    let qrTokenToUse = numericIdStr || legacyIdStr;
    if (seenQrTokens.has(qrTokenToUse)) {
      qrTokenToUse = `${qrTokenToUse}_dup_${legacyIdStr.slice(-4)}`;
    }
    seenQrTokens.add(qrTokenToUse);

    try {
      await prisma.plant.upsert({
        where: { id: legacyIdStr },
        update: {
          species: tree.species || "Unknown",
          health: healthStatus,
          statusNote: tree.currentHealth || tree.notes,
          qrToken: qrTokenToUse,
          zoneId: zone.id,
        },
        create: {
          id: legacyIdStr,
          zoneId: zone.id,
          species: tree.species || "Unknown",
          plantedAt: tree.plantDate ? new Date(tree.plantDate) : new Date(),
          health: healthStatus,
          statusNote: tree.currentHealth || tree.notes,
          qrToken: qrTokenToUse,
          createdAt: tree.createdAt ? new Date(tree.createdAt) : new Date(),
          updatedAt: tree.updatedAt ? new Date(tree.updatedAt) : new Date(),
        },
      });
      count++;
      if (count % 100 === 0) console.log(`Migrated ${count}/${totalTrees} trees...`);
    } catch (error) {
      console.error(`Error migrating tree ${legacyIdStr}:`, error);
    }
  }

  console.log(`Migration complete! Successfully migrated ${count} trees.`);
  await client.close();
  await prisma.$disconnect();
}

main().catch(console.error);
