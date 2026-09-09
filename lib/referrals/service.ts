import { prisma } from "@/lib/db";
import { ReferralStatus, ReferralEventType } from "@/lib/db";
import { isWellFormedReferralCode } from "./code";
import { log } from "@/lib/utils/logger";

/**
 * Referral engine: click recording and relationship creation.
 *
 * Kept free of HTTP concerns so it can be unit tested directly. Route handlers
 * pass in already-validated primitives.
 */

/** Looks up a referrer by code. Returns null for unknown/ill-formed codes. */
export async function findReferrerByCode(code: string) {
  if (!isWellFormedReferralCode(code)) return null;
  return prisma.user.findUnique({
    where: { referralCode: code },
    select: { id: true, name: true, referralCode: true },
  });
}

/** Records an anonymous click for abuse analysis and stats. */
export async function recordClick(params: {
  referralCode: string;
  referrerId: string;
  sessionId: string;
  landingPage: string;
  userAgent: string | null;
}): Promise<void> {
  await prisma.referralClick.create({ data: params });
  log.info("referral_click_recorded", {
    referralCode: params.referralCode,
    referrerId: params.referrerId,
  });
}

export type RelationshipResult =
  | { created: true; referralId: string }
  | {
      created: false;
      reason: "self_referral" | "already_referred" | "unknown_referrer";
    };

/**
 * Creates the referrer -> referred relationship when a new user registers with
 * an attribution. Runs inside the passed transaction so it commits atomically
 * with the user creation.
 *
 * Fraud rules enforced here:
 *   - a user cannot refer themselves
 *   - a user can be referred at most once (DB @unique on referredUserId is the
 *     real guarantee; we also check first for a clean result)
 *   - an unknown referrer id is rejected
 */
export async function createReferralRelationship(
  tx: Parameters<Parameters<typeof prisma.$transaction>[0]>[0],
  params: { referrerId: string; referredUserId: string; referralCode: string },
): Promise<RelationshipResult> {
  const { referrerId, referredUserId, referralCode } = params;

  if (referrerId === referredUserId) {
    log.warn("referral_self_blocked", { referredUserId });
    return { created: false, reason: "self_referral" };
  }

  const referrer = await tx.user.findUnique({
    where: { id: referrerId },
    select: { id: true },
  });
  if (!referrer) return { created: false, reason: "unknown_referrer" };

  const existing = await tx.referral.findUnique({
    where: { referredUserId },
    select: { id: true },
  });
  if (existing) return { created: false, reason: "already_referred" };

  const now = new Date();
  const referral = await tx.referral.create({
    data: {
      referrerId,
      referredUserId,
      referralCode,
      status: ReferralStatus.REGISTERED,
      registeredAt: now,
    },
    select: { id: true },
  });

  await tx.referralEvent.create({
    data: {
      referralId: referral.id,
      eventType: ReferralEventType.USER_REGISTERED,
      metadata: { referrerId, referredUserId },
    },
  });

  log.info("referral_relationship_created", {
    referralId: referral.id,
    referrerId,
    referredUserId,
  });
  return { created: true, referralId: referral.id };
}
