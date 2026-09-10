import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { findReferrerByCode, recordClick } from "@/lib/referrals/service";
import {
  setAttributionCookie,
  newSessionId,
} from "@/lib/referrals/attribution";
import { getBaseUrl } from "@/lib/utils/base-url";
import { log } from "@/lib/utils/logger";

/**
 * GET /r/[code]
 *
 * The public referral link. Validates the code against the database (never
 * trusting it just because it is in the URL), records an anonymous click, sets
 * the signed attribution cookie, then redirects the visitor to registration.
 * An unknown code simply redirects home with no attribution set.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ code: string }> },
) {
  const { code } = await params;

  const baseUrl = await getBaseUrl();

  const referrer = await findReferrerByCode(code);
  if (!referrer) {
    log.warn("referral_click_unknown_code", { code });
    return NextResponse.redirect(new URL("/", baseUrl));
  }

  const sessionId = newSessionId();
  const headerList = await headers();
  const userAgent = headerList.get("user-agent");

  await recordClick({
    referralCode: referrer.referralCode,
    referrerId: referrer.id,
    sessionId,
    landingPage: `/r/${referrer.referralCode}`,
    userAgent: userAgent ?? null,
  });

  await setAttributionCookie({
    referrerId: referrer.id,
    code: referrer.referralCode,
    sessionId,
  });

  return NextResponse.redirect(
    new URL(`/register?ref=${referrer.referralCode}`, baseUrl),
  );
}
