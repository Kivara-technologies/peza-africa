import "dotenv/config";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema.js";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is required (Supabase connection string, use the pooled 6543 URL on Vercel)");
}

// `prepare: false` is required when using Supabase's connection pooler (pgbouncer / port 6543).
const client = postgres(connectionString, { prepare: false });

export const db = drizzle(client, { schema });
export * as schema from "./schema.js";
