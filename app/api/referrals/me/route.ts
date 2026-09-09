import { NextResponse } from "next/server";
import { requireUserApi } from "@/lib/auth/api";
import { getUserReferrals } from "@/lib/referrals/stats";

/** GET /api/referrals/me -- the signed-in user's referrals. */
export async function GET() {
  const auth = await requireUserApi();
  if (!auth.ok) return auth.response;
  const referrals = await getUserReferrals(auth.user.id);
  return NextResponse.json({ referrals }, { status: 200 });
}
