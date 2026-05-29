/**
 * Side-effect-only: loads .env.turso into process.env if present.
 * Tolerant of multiple KEY=VAL on one line (space-separated). Used by
 * seed.ts before importing ./index, since Node's --env-file is greedy
 * and merges trailing tokens into the first var's value.
 */
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const path = resolve(".env.turso");
if (existsSync(path) && !process.env.DATABASE_URL) {
  const raw = readFileSync(path, "utf8");
  for (const m of raw.matchAll(
    /([A-Z_][A-Z0-9_]*)=(?:"([^"]*)"|'([^']*)'|(\S+))/gi,
  )) {
    const key = m[1];
    const value = m[2] ?? m[3] ?? m[4] ?? "";
    if (!process.env[key]) process.env[key] = value;
  }
}
