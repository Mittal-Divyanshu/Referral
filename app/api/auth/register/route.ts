import { NextResponse } from "next/server";
import { registerSchema } from "@/lib/validation/schemas";
import { registerUser } from "@/lib/users/service";
import { createSession } from "@/lib/auth/session";
import {
  readAttributionCookie,
  clearAttributionCookie,
} from "@/lib/referrals/attribution";
import { findReferrerByCode } from "@/lib/referrals/service";

/**
 * POST /api/auth/register
 * Validates input, resolves referral attribution, creates the user, logs them
 * in, and returns the new user id. All validation is server-side.
 */
export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = registerSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: parsed.error.flatten() },
      { status: 400 },
    );
  }
  const { name, email, password, referralCode } = parsed.data;

  // Attribution: the signed cookie is the trusted source. A referral code typed
  // into the form is only a fallback, and is re-validated against the DB here.
  const cookieAttr = await readAttributionCookie();
  let attribution: { referrerId: string; code: string } | null = cookieAttr
    ? { referrerId: cookieAttr.referrerId, code: cookieAttr.code }
    : null;

  if (!attribution && referralCode) {
    const referrer = await findReferrerByCode(referralCode);
    if (referrer) {
      attribution = { referrerId: referrer.id, code: referrer.referralCode };
    }
  }

  const result = await registerUser({ name, email, password, attribution });
  if (!result.ok) {
    return NextResponse.json(
      { error: "An account with this email already exists" },
      { status: 409 },
    );
  }

  await createSession(result.userId);
  if (attribution) await clearAttributionCookie();

  return NextResponse.json(
    { userId: result.userId, referralLinked: result.referralLinked },
    { status: 201 },
  );
}
