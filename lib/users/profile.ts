import { prisma } from "@/lib/db";
import { qualifyReferralForUser } from "@/lib/rewards/service";
import { log } from "@/lib/utils/logger";

/**
 * Profile completion -- the V1 qualifying action.
 *
 * Providing a phone number (plus the name they already have) completes the
 * profile. If this user was referred, completing the profile qualifies that
 * referral and creates the referrer's reward, transactionally and idempotently.
 */
export async function updateProfile(
  userId: string,
  data: { name: string; phone: string },
): Promise<{ profileComplete: boolean; qualifiedReferral: boolean }> {
  const user = await prisma.user.update({
    where: { id: userId },
    data: {
      name: data.name.trim(),
      phone: data.phone.trim(),
      profileComplete: true,
    },
    select: { id: true },
  });

  log.info("profile_completed", { userId: user.id });

  // Completing the profile is the qualifying event. Idempotent, so repeated
  // saves never create a second reward.
  const result = await qualifyReferralForUser(userId);

  return {
    profileComplete: true,
    qualifiedReferral: result.qualified,
  };
}
