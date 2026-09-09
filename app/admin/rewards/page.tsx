import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth/current-user";
import { getAllRewards } from "@/lib/admin/queries";
import { AppNav } from "@/components/ui/app-nav";
import { Card } from "@/components/ui/card";
import { RewardBadge } from "@/components/ui/badge";
import { RewardActions } from "@/components/admin/reward-actions";
import { formatCurrency, formatDate } from "@/lib/utils/format";

export const metadata: Metadata = { title: "Admin · Rewards" };

export default async function AdminRewardsPage() {
  const user = await requireAdmin();
  const rewards = await getAllRewards();

  return (
    <>
      <AppNav user={user} />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">
        <h1 className="text-2xl font-semibold tracking-tight">Rewards</h1>
        <p className="text-muted mt-1">
          Approve, reject, and mark rewards as paid.
        </p>

        {rewards.length === 0 ? (
          <Card className="mt-6">
            <p className="text-muted text-sm">No rewards yet.</p>
          </Card>
        ) : (
          <div className="mt-6 space-y-3">
            {rewards.map((reward) => (
              <Card key={reward.id}>
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">
                        {formatCurrency(reward.amount, reward.currency)}
                      </span>
                      <RewardBadge status={reward.status} />
                    </div>
                    <dl className="text-muted mt-2 space-y-0.5 text-sm">
                      <div className="flex gap-1">
                        <dt>Referrer:</dt>
                        <dd className="text-ink font-medium">
                          {reward.user.name}
                        </dd>
                      </div>
                      <div className="flex gap-1">
                        <dt>Referred:</dt>
                        <dd className="text-ink font-medium">
                          {reward.referral.referredUser.name}
                        </dd>
                      </div>
                      <div className="flex gap-1">
                        <dt>Created:</dt>
                        <dd>{formatDate(reward.createdAt)}</dd>
                      </div>
                    </dl>
                  </div>
                  <RewardActions rewardId={reward.id} status={reward.status} />
                </div>
              </Card>
            ))}
          </div>
        )}
      </main>
    </>
  );
}
