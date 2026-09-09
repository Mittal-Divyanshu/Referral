export { prisma } from "./client";
export {
  UserRole,
  ReferralStatus,
  RewardStatus,
  ReferralEventType,
} from "@/lib/generated/prisma";
export type {
  User,
  Referral,
  Reward,
  ReferralClick,
  ReferralEvent,
} from "@/lib/generated/prisma";
