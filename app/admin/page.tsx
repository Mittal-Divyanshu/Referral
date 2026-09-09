import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/lib/auth/current-user";
import { getAdminStats } from "@/lib/referrals/stats";
import { AppNav } from "@/components/ui/app-nav";
import { Stat } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils/format";

export const metadata: Metadata = { title: "Admin" };

export default async function AdminPage() {
  const user = await requireAdmin();
  const stats = await getAdminStats();

  return (
    <>
      <AppNav user={user} />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold tracking-tight">
            Admin dashboard
          </h1>
          <div className="flex gap-3 text-sm">
            <Link href="/admin/referrals" className="text-brand font-medium">
              Referrals
            </Link>
            <Link href="/admin/rewards" className="text-brand font-medium">
              Rewards
            </Link>
          </div>
        </div>

        <section className="mt-6">
          <h2 className="text-muted text-sm font-semibold">Activity</h2>
          <div className="mt-3 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
            <Stat label="Users" value={stats.totalUsers} />
            <Stat label="Referral clicks" value={stats.totalClicks} />
            <Stat label="Referrals" value={stats.totalReferrals} />
            <Stat label="Qualified" value={stats.qualifiedReferrals} />
            <Stat label="Completed" value={stats.completedReferrals} />
          </div>
        </section>

        <section className="mt-8">
          <h2 className="text-muted text-sm font-semibold">Rewards</h2>
          <div className="mt-3 grid grid-cols-2 gap-4 md:grid-cols-4">
            <Stat
              label="Pending"
              value={formatCurrency(stats.pendingRewardsAmount)}
            />
            <Stat
              label="Approved"
              value={formatCurrency(stats.approvedRewardsAmount)}
            />
            <Stat
              label="Paid"
              value={formatCurrency(stats.paidRewardsAmount)}
            />
            <Stat
              label="Total"
              value={formatCurrency(stats.totalRewardAmount)}
            />
          </div>
        </section>
      </main>
    </>
  );
}
