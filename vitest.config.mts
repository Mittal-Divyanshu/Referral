import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

export default defineConfig({
  test: {
    // Unit tests only. Playwright owns tests/e2e and would otherwise be picked
    // up here and fail, since its `test` export is a different runner.
    include: ["tests/unit/**/*.test.ts"],
    environment: "node",
    // Loaded so unit tests exercising lib/env.ts see the same config the app
    // does, without each test file wiring up dotenv itself.
    setupFiles: ["tests/unit/setup.ts"],
  },
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./", import.meta.url)),
    },
  },
});
