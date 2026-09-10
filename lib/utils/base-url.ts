import { headers } from "next/headers";
import { env } from "@/lib/env";

/**
 * The public origin of the current request, e.g. "https://referral.vercel.app".
 *
 * Derived from the request headers so absolute links (referral URLs, redirects)
 * always match the domain the visitor is actually on -- localhost in dev, the
 * Vercel domain in production, a custom domain later -- with no per-environment
 * configuration. Falls back to the validated APP_URL when no request headers
 * are available (e.g. build-time or scripts).
 *
 * Vercel sits behind a proxy, so we honour x-forwarded-host / x-forwarded-proto.
 */
export async function getBaseUrl(): Promise<string> {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host");
  if (!host) return env.APP_URL;
  const proto =
    h.get("x-forwarded-proto") ??
    (host.startsWith("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}

/** Builds the absolute referral URL for a code, based on the current request. */
export async function referralUrlFromRequest(code: string): Promise<string> {
  const base = await getBaseUrl();
  return `${base}/r/${code}`;
}
