/**
 * Client-safe enum values.
 *
 * These mirror the Prisma enums but import nothing, so they can be used from
 * "use client" components without dragging the Prisma client (and its Node-only
 * pg driver) into the browser bundle. Server code may import the same names
 * from "@/lib/db"; both resolve to these identical string unions.
 */
export const UserRole = { USER: "USER", ADMIN: "ADMIN" } as const;
export type UserRole = (typeof UserRole)[keyof typeof UserRole];

export const ReferralStatus = {
  CLICKED: "CLICKED",
  REGISTERED: "REGISTERED",
  QUALIFIED: "QUALIFIED",
  COMPLETED: "COMPLETED",
  REJECTED: "REJECTED",
} as const;
export type ReferralStatus =
  (typeof ReferralStatus)[keyof typeof ReferralStatus];

export const RewardStatus = {
  PENDING: "PENDING",
  APPROVED: "APPROVED",
  REJECTED: "REJECTED",
  PAID: "PAID",
} as const;
export type RewardStatus = (typeof RewardStatus)[keyof typeof RewardStatus];

export const ReferralEventType = {
  REFERRAL_CLICKED: "REFERRAL_CLICKED",
  USER_REGISTERED: "USER_REGISTERED",
  REFERRAL_QUALIFIED: "REFERRAL_QUALIFIED",
  REFERRAL_COMPLETED: "REFERRAL_COMPLETED",
  REFERRAL_REJECTED: "REFERRAL_REJECTED",
  REWARD_CREATED: "REWARD_CREATED",
  REWARD_APPROVED: "REWARD_APPROVED",
  REWARD_REJECTED: "REWARD_REJECTED",
  REWARD_PAID: "REWARD_PAID",
} as const;
export type ReferralEventType =
  (typeof ReferralEventType)[keyof typeof ReferralEventType];
