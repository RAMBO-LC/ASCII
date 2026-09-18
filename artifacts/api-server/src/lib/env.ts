import { existsSync } from "node:fs";
import path from "node:path";

/**
 * Load the single repo-root `.env` for local dev. Evaluated first (see
 * `src/index.ts`) so DATABASE_URL and friends exist before the DB module
 * loads. Missing file = production, where the platform provides env vars.
 * Never overrides variables that are already set.
 */
const candidates = [
  path.resolve(process.cwd(), "..", "..", ".env"),
  path.resolve(process.cwd(), ".env"),
];

for (const file of candidates) {
  if (existsSync(file)) {
    process.loadEnvFile(file);
    break;
  }
}
