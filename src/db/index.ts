import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import * as schema from "./schema";

const url = process.env.DATABASE_URL ?? "file:./data/certops.db";
const authToken = process.env.DATABASE_AUTH_TOKEN;

if (url.startsWith("file:")) {
  const path = url.slice("file:".length);
  if (path && path !== ":memory:") {
    mkdirSync(dirname(path), { recursive: true });
  }
}

const client = createClient({
  url,
  ...(authToken ? { authToken } : {}),
});

// PRAGMAs are only set for file: URLs. Turso (libsql://) runs each
// client.execute() as a separate HTTP request — the server treats each as
// a fresh session, so a one-shot PRAGMA foreign_keys=ON does NOT carry
// over to subsequent statements, and libsql has no init-statement option
// to fix that. FK enforcement on Turso is therefore an accepted limitation
// (local dev + tests do enforce FKs; see scripts/verify-fk.ts).
//
// Fire-and-forget is safe here because libsql's node/file backend
// serializes statements on the embedded connection — subsequent drizzle
// queries queue behind these PRAGMAs. Verified empirically in
// scripts/verify-fk.ts. Avoids top-level await for tsx/CJS compatibility.
if (url.startsWith("file:")) {
  void client.execute("PRAGMA journal_mode = WAL");
  void client.execute("PRAGMA foreign_keys = ON");
}

export const db = drizzle(client, { schema });
export type DB = typeof db;
