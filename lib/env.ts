import { z } from "zod";

/**
 * Environment configuration.
 *
 * Every secret and connection string the app needs is declared here and parsed
 * once, at module load. If something is missing or malformed the process fails
 * immediately with a readable message, rather than surfacing later as an
 * obscure runtime error at the first database query or cookie signature check.
 *
 * Never read `process.env` directly elsewhere -- import from this module so the
 * values stay typed and validated.
 */
const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),

  /** PostgreSQL connection string used by Prisma. */
  DATABASE_URL: z
    .string()
    .min(1, "DATABASE_URL is required")
    .refine(
      (value) =>
        value.startsWith("postgresql://") || value.startsWith("postgres://"),
      "DATABASE_URL must be a PostgreSQL connection string",
    ),

  /**
   * Secret used to derive HMACs for anything we hand to a browser and must be
   * able to trust when it comes back. Must be long enough that brute forcing is
   * not practical.
   */
  SESSION_SECRET: z
    .string()
    .min(32, "SESSION_SECRET must be at least 32 characters"),

  /**
   * Public origin of the app. Referral links are built from this, so it has to
   * be an absolute URL with no trailing slash.
   */
  APP_URL: z
    .string()
    .url("APP_URL must be an absolute URL")
    .transform((value) => value.replace(/\/+$/, "")),

  /**
   * How long a referral click stays attributable to the referrer. A visitor who
   * clicks a link today and registers within this window is still credited.
   */
  REFERRAL_ATTRIBUTION_DAYS: z.coerce.number().int().positive().default(30),

  /** Reward granted to the referrer, in whole rupees, when a referral qualifies. */
  REFERRAL_REWARD_AMOUNT: z.coerce.number().int().positive().default(500),

  /** ISO 4217 currency code for rewards. V1 is INR only. */
  REFERRAL_REWARD_CURRENCY: z.string().length(3).default("INR"),
});

export type Env = z.infer<typeof envSchema>;

function loadEnv(): Env {
  const parsed = envSchema.safeParse(process.env);

  if (!parsed.success) {
    const details = parsed.error.issues
      .map(
        (issue) => `  - ${issue.path.join(".") || "(root)"}: ${issue.message}`,
      )
      .join("\n");

    throw new Error(
      `Invalid environment configuration:\n${details}\n\n` +
        "Copy .env.example to .env and fill in the missing values.",
    );
  }

  return parsed.data;
}

export const env = loadEnv();

/** Attribution window expressed in milliseconds, for date arithmetic. */
export const ATTRIBUTION_WINDOW_MS =
  env.REFERRAL_ATTRIBUTION_DAYS * 24 * 60 * 60 * 1000;

/** Builds the public referral URL for a given referral code. */
export function referralUrl(code: string): string {
  return `${env.APP_URL}/r/${code}`;
}
