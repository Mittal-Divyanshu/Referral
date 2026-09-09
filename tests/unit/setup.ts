/**
 * Vitest setup: load the local .env so unit tests run against the same
 * validated configuration as the app. Node 20+ can parse .env files natively,
 * so this needs no extra dependency.
 */
import { loadEnvFile } from "node:process";
import { existsSync } from "node:fs";

if (existsSync(".env")) {
  loadEnvFile(".env");
}
