import type { Metadata } from "next";
import { requireUser } from "@/lib/auth/current-user";
import { getUserReferrals } from "@/lib/referrals/stats";
import { AppNav } from "@/components/ui/app-nav";
import { Card } from "@/components/ui/card";
import { ReferralBadge, RewardBadge } from "@/components/ui/badge";
import { formatCurrency, formatDate } from "@/lib/utils/format";

export const metadata: Metadata = { title: "Referrals" };

export default async function ReferralsPage() {
  const user = await requireUser();
  const referrals = await getUserReferrals(user.id);

  return (
    <>
      <AppNav user={user} />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">
        <h1 className="text-2xl font-semibold tracking-tight">
          Your referrals
        </h1>
        <p className="text-muted mt-1">
          Everyone who signed up with your link.
        </p>

        {referrals.length === 0 ? (
          <Card className="mt-6">
            <p className="text-muted text-sm">
              No referrals yet. Share your link from the dashboard to get
              started.
            </p>
          </Card>
        ) : (
          <div className="border-border bg-surface mt-6 overflow-x-auto rounded-xl border">
            <table className="w-full text-left text-sm">
              <thead className="text-muted border-border border-b">
                <tr>
                  <th className="px-4 py-3 font-medium">Referred user</th>
                  <th className="px-4 py-3 font-medium">Date</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Reward</th>
                  <th className="px-4 py-3 font-medium">Reward status</th>
                </tr>
              </thead>
              <tbody>
                {referrals.map((r) => (
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
                      {r.rewardAmount !== null
                        ? formatCurrency(r.rewardAmount)
                        : "—"}
                    </td>
                    <td className="px-4 py-3">
                      {r.rewardStatus ? (
                        <RewardBadge status={r.rewardStatus} />
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
