import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/lib/auth/current-user";
import { getAllReferrals } from "@/lib/admin/queries";
import { ReferralStatus } from "@/lib/db";
import { AppNav } from "@/components/ui/app-nav";
import { Card } from "@/components/ui/card";
import { ReferralBadge, RewardBadge } from "@/components/ui/badge";
import { formatCurrency, formatDate } from "@/lib/utils/format";

export const metadata: Metadata = { title: "Admin · Referrals" };

const STATUSES = Object.values(ReferralStatus);

function isReferralStatus(value: string | undefined): value is ReferralStatus {
  return !!value && (STATUSES as string[]).includes(value);
}

export default async function AdminReferralsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const user = await requireAdmin();
  const { status } = await searchParams;
  const filter = isReferralStatus(status) ? status : undefined;
  const referrals = await getAllReferrals(filter);

  return (
    <>
      <AppNav user={user} />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">
        <h1 className="text-2xl font-semibold tracking-tight">Referrals</h1>
        <p className="text-muted mt-1">Every referral in the program.</p>

        <div
          className="mt-4 flex flex-wrap gap-2"
          role="group"
          aria-label="Filter by status"
        >
          <Link
            href="/admin/referrals"
            className={`rounded-full border px-3 py-1 text-sm ${
              !filter
                ? "border-brand bg-brand-soft text-brand"
                : "border-border text-muted"
            }`}
          >
            All
          </Link>
          {STATUSES.map((s) => (
            <Link
              key={s}
              href={`/admin/referrals?status=${s}`}
              className={`rounded-full border px-3 py-1 text-sm ${
                filter === s
                  ? "border-brand bg-brand-soft text-brand"
                  : "border-border text-muted"
              }`}
            >
              {s}
            </Link>
          ))}
        </div>

        {referrals.length === 0 ? (
          <Card className="mt-6">
            <p className="text-muted text-sm">
              No referrals match this filter.
            </p>
          </Card>
        ) : (
          <div className="mt-6 space-y-3">
            {referrals.map((r) => (
              <Card key={r.id}>
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{r.referrer.name}</span>
                      <span className="text-muted text-sm">referred</span>
                      <span className="font-medium">{r.referredUser.name}</span>
                      <ReferralBadge status={r.status} />
                    </div>
                    <p className="text-muted mt-1 text-xs">
                      Code <span className="font-mono">{r.referralCode}</span> ·{" "}
                      {formatDate(r.createdAt)}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {r.events.map((e, i) => (
                        <span
                          key={i}
                          className="bg-canvas text-muted rounded px-2 py-0.5 text-xs"
                          title={formatDate(e.createdAt)}
                        >
                          {e.eventType}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="text-right">
                    {r.reward ? (
                      <span className="flex items-center gap-2">
                        {formatCurrency(r.reward.amount)}
                        <RewardBadge status={r.reward.status} />
                      </span>
                    ) : (
                      <span className="text-muted text-sm">No reward</span>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </main>
    </>
  );
}
