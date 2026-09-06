import "dotenv/config";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema.js";

const connectionString = process.env.DATABASE_URL || "postgres://preview:preview@localhost:5432/preview";

if (!process.env.DATABASE_URL) {
  // eslint-disable-next-line no-console
  console.warn("DATABASE_URL is missing; database-backed actions are disabled in preview.");
}

// `prepare: false` is required when using Supabase's connection pooler (pgbouncer / port 6543).
const client = postgres(connectionString, { prepare: false });

export const db = drizzle(client, { schema });
export * as schema from "./schema.js";
