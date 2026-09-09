import { createHmac, timingSafeEqual, randomUUID } from "node:crypto";
import { cookies } from "next/headers";
import { env, ATTRIBUTION_WINDOW_MS } from "@/lib/env";

/**
 * Anonymous referral attribution.
 *
 * When a visitor opens /r/CODE we validate the code server-side, then store a
 * signed cookie recording who referred them. The cookie is HMAC-signed with
 * SESSION_SECRET, so the visitor cannot edit it to credit an arbitrary user --
 * this is what keeps "never trust referral codes from the client" true.
 *
 * The attribution survives the visitor leaving and returning: the cookie lives
 * for the full attribution window (default 30 days). At registration we read
 * it, check it is still in-window, and persist the relationship to Postgres --
 * from then on the database is the record and the cookie is irrelevant.
 */
const COOKIE_NAME = "referflow_attribution";

export type Attribution = {
  referrerId: string;
  code: string;
  /** Opaque per-click id, also written to ReferralClick for abuse analysis. */
  sessionId: string;
  iat: number;
};

function sign(payloadB64: string): string {
  return createHmac("sha256", env.SESSION_SECRET)
    .update(`attr:${payloadB64}`)
    .digest("base64url");
}

export function newSessionId(): string {
  return randomUUID();
}

export async function setAttributionCookie(
  attribution: Omit<Attribution, "iat">,
): Promise<void> {
  const payload: Attribution = { ...attribution, iat: Date.now() };
  const payloadB64 = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const value = `${payloadB64}.${sign(payloadB64)}`;

  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, value, {
    httpOnly: true,
    sameSite: "lax",
    secure: env.NODE_ENV === "production",
    path: "/",
    maxAge: Math.floor(ATTRIBUTION_WINDOW_MS / 1000),
  });
}

/** Reads and verifies the attribution cookie, or null if absent/expired/forged. */
export async function readAttributionCookie(): Promise<Attribution | null> {
  const cookieStore = await cookies();
  const raw = cookieStore.get(COOKIE_NAME)?.value;
  if (!raw) return null;

  const dot = raw.indexOf(".");
  if (dot === -1) return null;
  const payloadB64 = raw.slice(0, dot);
  const sig = raw.slice(dot + 1);

  const expected = sign(payloadB64);
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;

  try {
    const parsed = JSON.parse(
      Buffer.from(payloadB64, "base64url").toString("utf8"),
    ) as Attribution;
    if (Date.now() - parsed.iat > ATTRIBUTION_WINDOW_MS) return null;
    return parsed;
  } catch {
    return null;
  }
}

export async function clearAttributionCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}
