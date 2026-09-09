import "dotenv/config";
import path from "node:path";
import { defineConfig } from "prisma/config";

/**
 * Prisma 7 no longer reads .env automatically and no longer takes the
 * connection URL from schema.prisma. Migration and introspection commands read
 * it from here instead; the runtime client gets it through a driver adapter
 * (see lib/db/client.ts).
 */
export default defineConfig({
  schema: path.join("prisma", "schema.prisma"),
  datasource: {
    url: process.env.DATABASE_URL,
  },
  migrations: {
    seed: "tsx prisma/seed.ts",
  },
});
