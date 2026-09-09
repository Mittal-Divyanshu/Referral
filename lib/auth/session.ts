import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { env } from "@/lib/env";

/**
 * Session handling via a signed, HttpOnly cookie.
 *
 * The cookie value is `base64url(payload).base64url(hmac)` where payload is
 * `{ uid, iat }`. The HMAC is keyed with SESSION_SECRET, so a client cannot
 * change the user id without invalidating the signature. This is stateless:
 * no session table, no per-request lookup.
 *
 * Tradeoff, noted for the later rewrite: because it is stateless there is no
 * server-side revocation. Logout clears the cookie, and sessions simply expire
 * after SESSION_MAX_AGE. That is acceptable for V1; a DB-backed session table
 * is the upgrade path when revocation is needed.
 */
const COOKIE_NAME = "referflow_session";
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7; // 7 days

type SessionPayload = { uid: string; iat: number };

function b64url(input: Buffer | string): string {
  return Buffer.from(input).toString("base64url");
}

function sign(payloadB64: string): string {
  return createHmac("sha256", env.SESSION_SECRET)
    .update(payloadB64)
    .digest("base64url");
}

function serialize(payload: SessionPayload): string {
  const payloadB64 = b64url(JSON.stringify(payload));
  return `${payloadB64}.${sign(payloadB64)}`;
}

function deserialize(value: string): SessionPayload | null {
  const dot = value.indexOf(".");
  if (dot === -1) return null;
  const payloadB64 = value.slice(0, dot);
  const sig = value.slice(dot + 1);

  const expected = sign(payloadB64);
  // Constant-time compare to avoid leaking signature validity via timing.
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;

  try {
    const parsed = JSON.parse(
      Buffer.from(payloadB64, "base64url").toString("utf8"),
    ) as SessionPayload;
    if (typeof parsed.uid !== "string" || typeof parsed.iat !== "number") {
      return null;
    }
    const ageSeconds = (Date.now() - parsed.iat) / 1000;
    if (ageSeconds > SESSION_MAX_AGE_SECONDS) return null;
    return parsed;
  } catch {
    return null;
  }
}

/** Writes the session cookie for a user. Call from a Route Handler or Action. */
export async function createSession(userId: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, serialize({ uid: userId, iat: Date.now() }), {
    httpOnly: true,
    sameSite: "lax",
    secure: env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  });
}

/** Clears the session cookie. */
export async function destroySession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

/** Returns the signed-in user id, or null. Verifies the signature. */
export async function getSessionUserId(): Promise<string | null> {
  const cookieStore = await cookies();
  const raw = cookieStore.get(COOKIE_NAME)?.value;
  if (!raw) return null;
  return deserialize(raw)?.uid ?? null;
}
