import { prisma } from "@/lib/db";
import { ReferralStatus, RewardStatus } from "@/lib/db";

/**
 * Read-model aggregations for the dashboards. Pure queries, no mutation.
 */

export type UserStats = {
  totalClicks: number;
  totalReferrals: number;
  successfulReferrals: number; // qualified, completed
  pendingRewards: number; // amount in rupees
  approvedRewards: number;
  paidRewards: number;
  totalEarned: number; // approved + paid, the money that is or will be theirs
};

export async function getUserStats(userId: string): Promise<UserStats> {
  const [totalClicks, totalReferrals, successfulReferrals, rewardSums] =
    await Promise.all([
      prisma.referralClick.count({ where: { referrerId: userId } }),
      prisma.referral.count({ where: { referrerId: userId } }),
      prisma.referral.count({
        where: {
          referrerId: userId,
          status: { in: [ReferralStatus.QUALIFIED, ReferralStatus.COMPLETED] },
        },
      }),
      prisma.reward.groupBy({
        by: ["status"],
        where: { userId },
        _sum: { amount: true },
      }),
    ]);

  const byStatus = (status: RewardStatus) =>
    rewardSums.find((r) => r.status === status)?._sum.amount ?? 0;

  const pendingRewards = byStatus(RewardStatus.PENDING);
  const approvedRewards = byStatus(RewardStatus.APPROVED);
  const paidRewards = byStatus(RewardStatus.PAID);

  return {
    totalClicks,
    totalReferrals,
    successfulReferrals,
    pendingRewards,
    approvedRewards,
    paidRewards,
    totalEarned: approvedRewards + paidRewards,
  };
}

export type ReferralRow = {
  id: string;
  referredUserName: string;
  status: ReferralStatus;
  createdAt: Date;
  rewardAmount: number | null;
  rewardStatus: RewardStatus | null;
};

export async function getUserReferrals(userId: string): Promise<ReferralRow[]> {
  const referrals = await prisma.referral.findMany({
    where: { referrerId: userId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      status: true,
      createdAt: true,
      referredUser: { select: { name: true } },
      reward: { select: { amount: true, status: true } },
    },
  });

  return referrals.map((r) => ({
    id: r.id,
    referredUserName: r.referredUser.name,
    status: r.status,
    createdAt: r.createdAt,
    rewardAmount: r.reward?.amount ?? null,
    rewardStatus: r.reward?.status ?? null,
  }));
}

export type AdminStats = {
  totalUsers: number;
  totalClicks: number;
  totalReferrals: number;
  qualifiedReferrals: number;
  completedReferrals: number;
  pendingRewardsAmount: number;
  approvedRewardsAmount: number;
  paidRewardsAmount: number;
  totalRewardAmount: number;
};

export async function getAdminStats(): Promise<AdminStats> {
  const [
    totalUsers,
    totalClicks,
    totalReferrals,
    qualifiedReferrals,
    completedReferrals,
    rewardSums,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.referralClick.count(),
    prisma.referral.count(),
    prisma.referral.count({ where: { status: ReferralStatus.QUALIFIED } }),
    prisma.referral.count({ where: { status: ReferralStatus.COMPLETED } }),
    prisma.reward.groupBy({ by: ["status"], _sum: { amount: true } }),
  ]);

  const byStatus = (status: RewardStatus) =>
    rewardSums.find((r) => r.status === status)?._sum.amount ?? 0;

  const pendingRewardsAmount = byStatus(RewardStatus.PENDING);
  const approvedRewardsAmount = byStatus(RewardStatus.APPROVED);
  const paidRewardsAmount = byStatus(RewardStatus.PAID);

  return {
    totalUsers,
    totalClicks,
    totalReferrals,
    qualifiedReferrals,
    completedReferrals,
    pendingRewardsAmount,
    approvedRewardsAmount,
    paidRewardsAmount,
    totalRewardAmount:
      pendingRewardsAmount + approvedRewardsAmount + paidRewardsAmount,
  };
}
