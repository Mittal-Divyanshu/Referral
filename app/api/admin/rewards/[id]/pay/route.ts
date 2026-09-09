import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/auth/api";
import { payReward } from "@/lib/rewards/service";

/** POST /api/admin/rewards/[id]/pay -- admin only. */
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireAdminApi();
  if (!auth.ok) return auth.response;

  const { id } = await params;
  const result = await payReward(id);

  if (!result.ok) {
    const status = result.reason === "not_found" ? 404 : 409;
    const error =
      result.reason === "not_found"
        ? "Reward not found"
        : "That action is not allowed for the reward's current status";
    return NextResponse.json({ error }, { status });
  }
  return NextResponse.json({ ok: true }, { status: 200 });
}
