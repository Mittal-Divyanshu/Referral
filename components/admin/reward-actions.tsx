"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { RewardStatus } from "@/lib/db";

/**
 * Approve / reject / mark-paid buttons for a single reward. Which buttons show
 * depends on the current status -- but the real authorization and transition
 * validation happen server-side; this only reflects it.
 */
export function RewardActions({
  rewardId,
  status,
}: {
  rewardId: string;
  status: RewardStatus;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function act(action: "approve" | "reject" | "pay") {
    setBusy(true);
    setError(null);
    const res = await fetch(`/api/admin/rewards/${rewardId}/${action}`, {
      method: "POST",
    });
    if (!res.ok) {
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      setError(data.error ?? "Action failed");
      setBusy(false);
      return;
    }
    router.refresh();
    setBusy(false);
  }

  const btn = "rounded-lg px-3 py-1.5 text-sm font-medium disabled:opacity-60";

  return (
    <div className="flex flex-col items-end gap-1">
      <div className="flex gap-2">
        {status === RewardStatus.PENDING ? (
          <>
            <button
              type="button"
              disabled={busy}
              onClick={() => act("approve")}
              className={`${btn} bg-brand hover:bg-brand-hover text-white`}
            >
              Approve
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => act("reject")}
              className={`${btn} text-danger border-danger/30 border`}
            >
              Reject
            </button>
          </>
        ) : null}

        {status === RewardStatus.APPROVED ? (
          <button
            type="button"
            disabled={busy}
            onClick={() => act("pay")}
            className={`${btn} bg-success text-white hover:opacity-90`}
          >
            Mark as paid
          </button>
        ) : null}

        {status === RewardStatus.PAID ? (
          <span className="text-success text-sm font-medium">Paid ✓</span>
        ) : null}
        {status === RewardStatus.REJECTED ? (
          <span className="text-muted text-sm">Rejected</span>
        ) : null}
      </div>
      {error ? (
        <p role="alert" className="text-danger text-xs">
          {error}
        </p>
      ) : null}
    </div>
  );
}
