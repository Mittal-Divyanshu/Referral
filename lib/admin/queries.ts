import { prisma } from "@/lib/db";
import { ReferralStatus } from "@/lib/db";

/** Admin read queries for the management pages. */

export async function getAllRewards() {
  return prisma.reward.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      amount: true,
      currency: true,
      status: true,
      reason: true,
      createdAt: true,
      user: { select: { name: true } },
      referral: {
        select: { referredUser: { select: { name: true } } },
      },
    },
  });
}

export async function getAllReferrals(statusFilter?: ReferralStatus) {
  return prisma.referral.findMany({
    where: statusFilter ? { status: statusFilter } : undefined,
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      status: true,
      createdAt: true,
      referralCode: true,
      referrer: { select: { name: true } },
      referredUser: { select: { name: true } },
      reward: { select: { amount: true, status: true } },
      events: {
        orderBy: { createdAt: "asc" },
        select: { eventType: true, createdAt: true },
      },
    },
  });
}
