/**
 * Seed the database with sample data for development.
 * Run with: npm run db:seed
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // Create sample users
  const alice = await prisma.user.upsert({
    where: { email: "alice@example.com" },
    update: {},
    create: {
      googleId: "google_alice_001",
      name: "Alice Sharma",
      email: "alice@example.com",
      points: 80,
      role: "CITIZEN",
    },
  });

  const bob = await prisma.user.upsert({
    where: { email: "bob@example.com" },
    update: {},
    create: {
      googleId: "google_bob_002",
      name: "Bob Verma",
      email: "bob@example.com",
      points: 45,
      role: "AUTHORITY",
    },
  });

  const carol = await prisma.user.upsert({
    where: { email: "carol@example.com" },
    update: {},
    create: {
      googleId: "google_carol_003",
      name: "Carol Gupta",
      email: "carol@example.com",
      points: 30,
      role: "CITIZEN",
    },
  });

  console.log("✅ Users created");

  // Create sample issues
  const issues = [
    {
      title: "Pothole near Market",
      description:
        "Large pothole causing traffic issues and vehicle damage. The hole is approximately 2 feet wide and 6 inches deep.",
      category: "ROAD" as const,
      location: "Main Market Street, near Metro Station",
      status: "REPORTED" as const,
      votes: 5,
      reporterId: alice.id,
    },
    {
      title: "Streetlight not working",
      description:
        "Street light has been non-functional for over a week, making the area unsafe for pedestrians at night.",
      category: "STREETLIGHT" as const,
      location: "Sector 21 Road, outside Community Center",
      status: "IN_PROGRESS" as const,
      votes: 8,
      reporterId: bob.id,
    },
    {
      title: "Garbage pile not collected",
      description:
        "Garbage has been accumulating for 3 days. Attracting stray animals and creating unhygienic conditions.",
      category: "GARBAGE" as const,
      location: "Park Avenue, Block C",
      status: "FIXED" as const,
      votes: 12,
      reporterId: carol.id,
    },
    {
      title: "Water leakage from main pipe",
      description:
        "Major water leakage from the main supply pipe causing water wastage and road damage.",
      category: "WATER" as const,
      location: "Green Street, near School Gate",
      status: "REPORTED" as const,
      votes: 15,
      reporterId: alice.id,
    },
  ];

  for (const issue of issues) {
    await prisma.issue.create({ data: issue });
  }

  console.log("✅ Sample issues created");
  console.log("🎉 Seeding complete!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
