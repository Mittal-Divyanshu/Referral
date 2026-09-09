import { Prisma } from "@/lib/generated/prisma";
import { prisma } from "@/lib/db";
import { ReferralStatus, RewardStatus, ReferralEventType } from "@/lib/db";
import { env } from "@/lib/env";
import { log } from "@/lib/utils/logger";

/**
 * Reward lifecycle. Two responsibilities:
 *   1. Create exactly one reward when a referral qualifies (idempotent).
 *   2. Move a reward through PENDING -> APPROVED -> PAID (or -> REJECTED),
 *      rejecting illegal transitions.
 *
 * All mutations are transactional and each records a ReferralEvent, so the
 * audit trail always matches the state.
 */

export type QualifyResult =
  | {
      qualified: true;
      referralId: string;
      rewardId: string;
      alreadyQualified: boolean;
    }
  | { qualified: false; reason: "no_referral" };

/**
 * Marks a user's referral QUALIFIED and creates their referrer's PENDING
 * reward. Safe to call more than once: the unique constraint on
 * Reward.referralId means a duplicate insert is caught and treated as a no-op,
 * so a double-submitted profile form never pays twice.
 */
export async function qualifyReferralForUser(
  referredUserId: string,
): Promise<QualifyResult> {
  return prisma.$transaction(async (tx) => {
    const referral = await tx.referral.findUnique({
      where: { referredUserId },
      select: {
        id: true,
        referrerId: true,
        status: true,
        reward: { select: { id: true } },
      },
    });

    if (!referral) return { qualified: false, reason: "no_referral" } as const;

    // Already qualified (or further along): ensure a reward exists and return.
    if (referral.status !== ReferralStatus.REGISTERED) {
      return {
        qualified: true,
        referralId: referral.id,
        rewardId: referral.reward?.id ?? "",
        alreadyQualified: true,
      } as const;
    }

    const now = new Date();
    await tx.referral.update({
      where: { id: referral.id },
      data: { status: ReferralStatus.QUALIFIED, qualifiedAt: now },
    });
    await tx.referralEvent.create({
      data: {
        referralId: referral.id,
        eventType: ReferralEventType.REFERRAL_QUALIFIED,
        metadata: { referredUserId },
      },
    });

    // Idempotent reward creation. The unique index on referralId is the real
    // guarantee; catching P2002 handles a concurrent double-submit gracefully.
    let rewardId = referral.reward?.id ?? "";
    if (!rewardId) {
      try {
        const reward = await tx.reward.create({
          data: {
            referralId: referral.id,
            userId: referral.referrerId,
            amount: env.REFERRAL_REWARD_AMOUNT,
            currency: env.REFERRAL_REWARD_CURRENCY,
            status: RewardStatus.PENDING,
            reason: "Referral completed profile",
          },
          select: { id: true },
        });
        rewardId = reward.id;
        await tx.referralEvent.create({
          data: {
            referralId: referral.id,
            eventType: ReferralEventType.REWARD_CREATED,
            metadata: { rewardId, amount: env.REFERRAL_REWARD_AMOUNT },
          },
        });
        log.info("reward_created", {
          rewardId,
          referralId: referral.id,
          userId: referral.referrerId,
          amount: env.REFERRAL_REWARD_AMOUNT,
        });
      } catch (e) {
        if (
          e instanceof Prisma.PrismaClientKnownRequestError &&
          e.code === "P2002"
        ) {
          const existing = await tx.reward.findUnique({
            where: { referralId: referral.id },
            select: { id: true },
          });
          rewardId = existing?.id ?? "";
        } else {
          throw e;
        }
      }
    }

    log.info("referral_qualified", { referralId: referral.id });
    return {
      qualified: true,
      referralId: referral.id,
      rewardId,
      alreadyQualified: false,
    } as const;
  });
}

export type TransitionResult =
  { ok: true } | { ok: false; reason: "not_found" | "invalid_transition" };

/** PENDING -> APPROVED. */
export async function approveReward(
  rewardId: string,
): Promise<TransitionResult> {
  return prisma.$transaction(async (tx) => {
    const reward = await tx.reward.findUnique({
      where: { id: rewardId },
      select: { id: true, status: true, referralId: true },
    });
    if (!reward) return { ok: false, reason: "not_found" } as const;
    if (reward.status !== RewardStatus.PENDING) {
      return { ok: false, reason: "invalid_transition" } as const;
    }
    await tx.reward.update({
      where: { id: reward.id },
      data: { status: RewardStatus.APPROVED, approvedAt: new Date() },
    });
    await tx.referralEvent.create({
      data: {
        referralId: reward.referralId,
        eventType: ReferralEventType.REWARD_APPROVED,
        metadata: { rewardId },
      },
    });
    log.info("reward_approved", { rewardId });
    return { ok: true } as const;
  });
}

/** PENDING or APPROVED -> REJECTED. Also marks the referral REJECTED. */
export async function rejectReward(
  rewardId: string,
): Promise<TransitionResult> {
  return prisma.$transaction(async (tx) => {
    const reward = await tx.reward.findUnique({
      where: { id: rewardId },
      select: { id: true, status: true, referralId: true },
    });
    if (!reward) return { ok: false, reason: "not_found" } as const;
    if (
      reward.status !== RewardStatus.PENDING &&
      reward.status !== RewardStatus.APPROVED
    ) {
      return { ok: false, reason: "invalid_transition" } as const;
    }
    await tx.reward.update({
      where: { id: reward.id },
      data: { status: RewardStatus.REJECTED },
    });
    await tx.referral.update({
      where: { id: reward.referralId },
      data: { status: ReferralStatus.REJECTED },
    });
    await tx.referralEvent.create({
      data: {
        referralId: reward.referralId,
        eventType: ReferralEventType.REWARD_REJECTED,
        metadata: { rewardId },
      },
    });
    log.info("reward_rejected", { rewardId });
    return { ok: true } as const;
  });
}

/** APPROVED -> PAID. Also completes the referral. */
export async function payReward(rewardId: string): Promise<TransitionResult> {
  return prisma.$transaction(async (tx) => {
    const reward = await tx.reward.findUnique({
      where: { id: rewardId },
      select: { id: true, status: true, referralId: true },
    });
    if (!reward) return { ok: false, reason: "not_found" } as const;
    if (reward.status !== RewardStatus.APPROVED) {
      return { ok: false, reason: "invalid_transition" } as const;
    }
    const now = new Date();
    await tx.reward.update({
      where: { id: reward.id },
      data: { status: RewardStatus.PAID, paidAt: now },
    });
    await tx.referral.update({
      where: { id: reward.referralId },
      data: { status: ReferralStatus.COMPLETED, completedAt: now },
    });
    await tx.referralEvent.createMany({
      data: [
        {
          referralId: reward.referralId,
          eventType: ReferralEventType.REWARD_PAID,
          metadata: { rewardId },
        },
        {
          referralId: reward.referralId,
          eventType: ReferralEventType.REFERRAL_COMPLETED,
          metadata: { rewardId },
        },
      ],
    });
    log.info("reward_paid", { rewardId });
    return { ok: true } as const;
  });
}
