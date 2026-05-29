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

if (url.startsWith("file:")) {
  await client.execute("PRAGMA journal_mode = WAL");
  await client.execute("PRAGMA foreign_keys = ON");
}

export const db = drizzle(client, { schema });
export type DB = typeof db;
