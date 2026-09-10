import type { Metadata } from "next";
import Link from "next/link";
import { requireUser } from "@/lib/auth/current-user";
import { getUserStats, getUserReferrals } from "@/lib/referrals/stats";
import { env } from "@/lib/env";
import { referralUrlFromRequest } from "@/lib/utils/base-url";
import { AppNav } from "@/components/ui/app-nav";
import { Card, Stat } from "@/components/ui/card";
import { ShareLink } from "@/components/dashboard/share-link";
import { ReferralBadge, RewardBadge } from "@/components/ui/badge";
import { formatCurrency, formatDate } from "@/lib/utils/format";

export const metadata: Metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  const user = await requireUser();
  const [stats, referrals, referralLink] = await Promise.all([
    getUserStats(user.id),
    getUserReferrals(user.id),
    referralUrlFromRequest(user.referralCode),
  ]);
  const recent = referrals.slice(0, 5);

  return (
    <>
      <AppNav user={user} />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">
        <h1 className="text-2xl font-semibold tracking-tight">
          Hello, {user.name.split(" ")[0]}
        </h1>
        <p className="text-muted mt-1">
          Share your link and earn {formatCurrency(env.REFERRAL_REWARD_AMOUNT)}{" "}
          per successful referral.
        </p>

        {!user.profileComplete ? (
          <div className="bg-warning-soft text-warning mt-6 flex flex-wrap items-center justify-between gap-2 rounded-xl px-4 py-3 text-sm">
            <span>
              Complete your profile so your own referrer can be rewarded.
            </span>
            <Link href="/profile" className="font-semibold underline">
              Complete profile
            </Link>
          </div>
        ) : null}

        <div className="mt-6">
          <Card>
            <ShareLink url={referralLink} code={user.referralCode} />
          </Card>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
          <Stat label="Clicks" value={stats.totalClicks} />
          <Stat
            label="Successful referrals"
            value={stats.successfulReferrals}
          />
          <Stat
            label="Pending rewards"
            value={formatCurrency(stats.pendingRewards)}
          />
          <Stat
            label="Total earned"
            value={formatCurrency(stats.totalEarned)}
          />
        </div>

        <div className="mt-8 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Recent referrals</h2>
          <Link href="/referrals" className="text-brand text-sm font-medium">
            View all
          </Link>
        </div>

        {recent.length === 0 ? (
          <Card className="mt-3">
            <p className="text-muted text-sm">
              No referrals yet. Share your link above to get started.
            </p>
          </Card>
        ) : (
          <div className="border-border bg-surface mt-3 overflow-x-auto rounded-xl border">
            <table className="w-full text-left text-sm">
              <thead className="text-muted border-border border-b">
                <tr>
                  <th className="px-4 py-3 font-medium">Referred user</th>
                  <th className="px-4 py-3 font-medium">Date</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Reward</th>
                </tr>
              </thead>
              <tbody>
                {recent.map((r) => (
                  <tr
                    key={r.id}
                    className="border-border border-b last:border-0"
                  >
                    <td className="px-4 py-3 font-medium">
                      {r.referredUserName}
                    </td>
                    <td className="text-muted px-4 py-3">
                      {formatDate(r.createdAt)}
                    </td>
                    <td className="px-4 py-3">
                      <ReferralBadge status={r.status} />
                    </td>
                    <td className="px-4 py-3">
                      {r.rewardStatus ? (
                        <span className="flex items-center gap-2">
                          {formatCurrency(r.rewardAmount ?? 0)}
                          <RewardBadge status={r.rewardStatus} />
                        </span>
                      ) : (
                        <span className="text-muted">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </>
  );
}
