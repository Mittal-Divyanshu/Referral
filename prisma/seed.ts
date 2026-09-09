import "dotenv/config";
import { PrismaClient } from "../lib/generated/prisma";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";
import { randomInt } from "node:crypto";

/**
 * Demo seed data. Creates an admin, a few users, referral relationships and
 * rewards in every state so the app is easy to demo immediately.
 *
 * DEVELOPMENT ONLY. The password below is an obvious placeholder and must
 * never be used anywhere real.
 */
const DEV_PASSWORD = "Password123"; // dev-only, clearly labelled

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});
const prisma = new PrismaClient({ adapter });

const ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
function code(): string {
  let c = "";
  for (let i = 0; i < 7; i++) c += ALPHABET[randomInt(ALPHABET.length)];
  return c;
}

async function main() {
  console.log("Seeding ReferFlow demo data…");

  // Clean slate (child rows first to satisfy FKs).
  await prisma.referralEvent.deleteMany();
  await prisma.reward.deleteMany();
  await prisma.referral.deleteMany();
  await prisma.referralClick.deleteMany();
  await prisma.user.deleteMany();

  const passwordHash = await bcrypt.hash(DEV_PASSWORD, 12);

  await prisma.user.create({
    data: {
      name: "Admin",
      email: "admin@example.com",
      passwordHash,
      role: "ADMIN",
      referralCode: code(),
      phone: "+91 90000 00000",
      profileComplete: true,
    },
  });

  // Divyanshu is the flagship referrer used in the walkthrough.
  const divyanshu = await prisma.user.create({
    data: {
      name: "Divyanshu Mital",
      email: "divyanshu@example.com",
      passwordHash,
      role: "USER",
      referralCode: "DVX82K9", // fixed so the demo link is predictable
      phone: "+91 98765 43210",
      profileComplete: true,
    },
  });

  // Three people Divyanshu referred, in different lifecycle stages.
  const rahul = await prisma.user.create({
    data: {
      name: "Rahul Sharma",
      email: "rahul@example.com",
      passwordHash,
      role: "USER",
      referralCode: code(),
      phone: "+91 91111 11111",
      profileComplete: true,
    },
  });
  const amit = await prisma.user.create({
    data: {
      name: "Amit Sharma",
      email: "amit@example.com",
      passwordHash,
      role: "USER",
      referralCode: code(),
      profileComplete: false, // registered but hasn't qualified
    },
  });
  const neha = await prisma.user.create({
    data: {
      name: "Neha Gupta",
      email: "neha@example.com",
      passwordHash,
      role: "USER",
      referralCode: code(),
      phone: "+91 92222 22222",
      profileComplete: true,
    },
  });

  const now = new Date();

  // Some clicks for stats.
  for (let i = 0; i < 12; i++) {
    await prisma.referralClick.create({
      data: {
        referralCode: divyanshu.referralCode,
        referrerId: divyanshu.id,
        sessionId: `seed-${i}`,
        landingPage: `/r/${divyanshu.referralCode}`,
        userAgent: "seed-script",
      },
    });
  }

  // Rahul: QUALIFIED with a PENDING reward.
  const rahulRef = await prisma.referral.create({
    data: {
      referrerId: divyanshu.id,
      referredUserId: rahul.id,
      referralCode: divyanshu.referralCode,
      status: "QUALIFIED",
      registeredAt: now,
      qualifiedAt: now,
    },
  });
  await prisma.reward.create({
    data: {
      referralId: rahulRef.id,
      userId: divyanshu.id,
      amount: 500,
      currency: "INR",
      status: "PENDING",
      reason: "Referral completed profile",
    },
  });
  await prisma.referralEvent.createMany({
    data: [
      { referralId: rahulRef.id, eventType: "USER_REGISTERED" },
      { referralId: rahulRef.id, eventType: "REFERRAL_QUALIFIED" },
      { referralId: rahulRef.id, eventType: "REWARD_CREATED" },
    ],
  });

  // Amit: only REGISTERED, no reward yet.
  const amitRef = await prisma.referral.create({
    data: {
      referrerId: divyanshu.id,
      referredUserId: amit.id,
      referralCode: divyanshu.referralCode,
      status: "REGISTERED",
      registeredAt: now,
    },
  });
  await prisma.referralEvent.create({
    data: { referralId: amitRef.id, eventType: "USER_REGISTERED" },
  });

  // Neha: fully COMPLETED and PAID.
  const nehaRef = await prisma.referral.create({
    data: {
      referrerId: divyanshu.id,
      referredUserId: neha.id,
      referralCode: divyanshu.referralCode,
      status: "COMPLETED",
      registeredAt: now,
      qualifiedAt: now,
      completedAt: now,
    },
  });
  await prisma.reward.create({
    data: {
      referralId: nehaRef.id,
      userId: divyanshu.id,
      amount: 500,
      currency: "INR",
      status: "PAID",
      reason: "Referral completed profile",
      approvedAt: now,
      paidAt: now,
    },
  });
  await prisma.referralEvent.createMany({
    data: [
      { referralId: nehaRef.id, eventType: "USER_REGISTERED" },
      { referralId: nehaRef.id, eventType: "REFERRAL_QUALIFIED" },
      { referralId: nehaRef.id, eventType: "REWARD_CREATED" },
      { referralId: nehaRef.id, eventType: "REWARD_APPROVED" },
      { referralId: nehaRef.id, eventType: "REWARD_PAID" },
      { referralId: nehaRef.id, eventType: "REFERRAL_COMPLETED" },
    ],
  });

  console.log("Seed complete:");
  console.log(`  Admin:     admin@example.com / ${DEV_PASSWORD}`);
  console.log(
    `  Referrer:  divyanshu@example.com / ${DEV_PASSWORD} (code DVX82K9)`,
  );
  console.log(
    `  Referred:  rahul@ (qualified), amit@ (registered), neha@ (paid)`,
  );
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
