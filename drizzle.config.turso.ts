import { defineConfig } from "drizzle-kit";

const url = process.env.DATABASE_URL;
const authToken = process.env.DATABASE_AUTH_TOKEN;

if (!url || !authToken) {
  throw new Error(
    "drizzle.config.turso.ts requires DATABASE_URL and DATABASE_AUTH_TOKEN (load via --env-file=.env.turso).",
  );
}

export default defineConfig({
  dialect: "turso",
  schema: "./src/db/schema.ts",
  out: "./src/db/migrations",
  dbCredentials: { url, authToken },
  strict: true,
  verbose: true,
});
