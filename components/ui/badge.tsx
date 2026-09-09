import { ReferralStatus, RewardStatus } from "@/lib/db/enums";

/**
 * Status badges. Colour-coded, but the text always carries the meaning too --
 * colour is never the only signal, for accessibility.
 */
const REFERRAL_STYLES: Record<ReferralStatus, string> = {
  CLICKED: "bg-canvas text-muted",
  REGISTERED: "bg-brand-soft text-brand",
  QUALIFIED: "bg-warning-soft text-warning",
  COMPLETED: "bg-success-soft text-success",
  REJECTED: "bg-danger-soft text-danger",
};

const REWARD_STYLES: Record<RewardStatus, string> = {
  PENDING: "bg-warning-soft text-warning",
  APPROVED: "bg-brand-soft text-brand",
  REJECTED: "bg-danger-soft text-danger",
  PAID: "bg-success-soft text-success",
};

const BASE =
  "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium";

export function ReferralBadge({ status }: { status: ReferralStatus }) {
  return <span className={`${BASE} ${REFERRAL_STYLES[status]}`}>{status}</span>;
}

export function RewardBadge({ status }: { status: RewardStatus }) {
  return <span className={`${BASE} ${REWARD_STYLES[status]}`}>{status}</span>;
}
