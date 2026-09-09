import { NextResponse } from "next/server";
import { requireUserApi } from "@/lib/auth/api";
import { getUserStats } from "@/lib/referrals/stats";

/** GET /api/referrals/stats -- the signed-in user's referral statistics. */
export async function GET() {
  const auth = await requireUserApi();
  if (!auth.ok) return auth.response;
  const stats = await getUserStats(auth.user.id);
  return NextResponse.json({ stats }, { status: 200 });
}
