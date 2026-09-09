import { Prisma } from "@/lib/generated/prisma";
import { prisma } from "@/lib/db";
import { UserRole } from "@/lib/db";
import { hashPassword } from "@/lib/auth/password";
import { generateReferralCode } from "@/lib/referrals/code";
import { createReferralRelationship } from "@/lib/referrals/service";
import { log } from "@/lib/utils/logger";

/**
 * User registration.
 *
 * Creates the account, generates a unique referral code (with collision
 * retry), and -- if an attribution is supplied -- links the new user to their
 * referrer, all in one transaction so a half-registered user is impossible.
 */

export type RegisterResult =
  | { ok: true; userId: string; referralLinked: boolean }
  | { ok: false; reason: "email_taken" };

type Attribution = { referrerId: string; code: string } | null;

const MAX_CODE_ATTEMPTS = 5;

export async function registerUser(params: {
  name: string;
  email: string;
  password: string;
  attribution: Attribution;
}): Promise<RegisterResult> {
  const email = params.email.toLowerCase().trim();

  const existing = await prisma.user.findUnique({
    where: { email },
    select: { id: true },
  });
  if (existing) return { ok: false, reason: "email_taken" };

  const passwordHash = await hashPassword(params.password);

  // Retry on the astronomically unlikely referral-code collision. The unique
  // index guarantees correctness; the loop just picks a fresh code and retries.
  for (let attempt = 1; attempt <= MAX_CODE_ATTEMPTS; attempt++) {
    const referralCode = generateReferralCode();
    try {
      const result = await prisma.$transaction(async (tx) => {
        const user = await tx.user.create({
          data: {
            name: params.name.trim(),
            email,
            passwordHash,
            role: UserRole.USER,
            referralCode,
          },
          select: { id: true },
        });

        let referralLinked = false;
        if (params.attribution) {
          const rel = await createReferralRelationship(tx, {
            referrerId: params.attribution.referrerId,
            referredUserId: user.id,
            referralCode: params.attribution.code,
          });
          referralLinked = rel.created;
        }
        return { userId: user.id, referralLinked };
      });

      log.info("user_registered", {
        userId: result.userId,
        referralLinked: result.referralLinked,
      });
      return { ok: true, ...result };
    } catch (e) {
      if (
        e instanceof Prisma.PrismaClientKnownRequestError &&
        e.code === "P2002"
      ) {
        const target =
          (e.meta?.target as string[] | undefined)?.join(",") ?? "";
        if (target.includes("email"))
          return { ok: false, reason: "email_taken" };
        if (target.includes("referralCode")) continue;
      }
      throw e;
    }
  }

  throw new Error("Could not generate a unique referral code after retries");
}
