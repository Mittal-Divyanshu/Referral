import { describe, expect, it } from "vitest";
import { env, referralUrl, ATTRIBUTION_WINDOW_MS } from "@/lib/env";

describe("environment configuration", () => {
  it("loads a PostgreSQL connection string", () => {
    expect(env.DATABASE_URL).toMatch(/^postgres(ql)?:\/\//);
  });

  it("requires a session secret long enough to be unguessable", () => {
    expect(env.SESSION_SECRET.length).toBeGreaterThanOrEqual(32);
  });

  it("exposes APP_URL without a trailing slash", () => {
    expect(env.APP_URL).not.toMatch(/\/$/);
  });

  it("builds referral URLs from APP_URL", () => {
    expect(referralUrl("DVX82K9")).toBe(`${env.APP_URL}/r/DVX82K9`);
  });

  it("derives the attribution window in milliseconds", () => {
    expect(ATTRIBUTION_WINDOW_MS).toBe(
      env.REFERRAL_ATTRIBUTION_DAYS * 86_400_000,
    );
  });
});
