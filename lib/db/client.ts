import { PrismaClient } from "@/lib/generated/prisma";
import { PrismaPg } from "@prisma/adapter-pg";
import { env } from "@/lib/env";

/**
 * A single PrismaClient for the whole app.
 *
 * Prisma 7 connects through a driver adapter rather than a URL in the schema,
 * so we build the pg adapter from the validated DATABASE_URL here.
 *
 * In development Next.js reloads modules on every change; without the global
 * cache that would open a new pool of connections each time and eventually
 * exhaust Postgres. Caching on globalThis keeps one client across reloads.
 */
const adapter = new PrismaPg({ connectionString: env.DATABASE_URL });

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter,
    log: env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

if (env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
