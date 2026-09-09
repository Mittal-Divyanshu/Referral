export { prisma } from "./client";
export {
  UserRole,
  ReferralStatus,
  RewardStatus,
  ReferralEventType,
} from "./enums";
export type {
  User,
  Referral,
  Reward,
  ReferralClick,
  ReferralEvent,
} from "@/lib/generated/prisma";
