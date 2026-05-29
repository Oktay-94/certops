import { defineConfig } from "drizzle-kit";
import { existsSync, readFileSync } from "node:fs";

// drizzle-kit does not read env-files, and Node's --env-file flag can't be
// combined with the .bin shell wrapper that pnpm exec invokes. Parse
// .env.turso ourselves into process.env. Skip if envs are already set
// (inline DATABASE_URL=… pnpm …).
if (existsSync(".env.turso") && !process.env.DATABASE_URL) {
  // Tolerates both KEY=VAL-per-line and multiple space-separated KEY=VAL
  // on the same line. Values may be optionally quoted; whitespace ends the
  // value (libsql URLs and JWTs contain no spaces).
  const raw = readFileSync(".env.turso", "utf8");
  for (const match of raw.matchAll(/([A-Z_][A-Z0-9_]*)=(?:"([^"]*)"|'([^']*)'|(\S+))/gi)) {
    const key = match[1];
    const value = match[2] ?? match[3] ?? match[4] ?? "";
    if (!process.env[key]) process.env[key] = value;
  }
}

const url = process.env.DATABASE_URL;
// authToken can be either a separate env var OR embedded in the URL as
// ?authToken=…  (Turso CLI emits the embedded form).
const authToken = process.env.DATABASE_AUTH_TOKEN;

if (!url) {
  throw new Error(
    "drizzle.config.turso.ts requires DATABASE_URL (set in .env.turso).",
  );
}

export default defineConfig({
  dialect: "turso",
  schema: "./src/db/schema.ts",
  out: "./src/db/migrations",
  dbCredentials: authToken ? { url, authToken } : { url },
  strict: true,
  verbose: true,
});
