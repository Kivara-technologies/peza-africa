import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import { createClient } from "@supabase/supabase-js";
import { db, schema } from "../db.js";
import { eq } from "drizzle-orm";

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Admin client used only on the server to verify user JWTs.
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

export type Profile = typeof schema.profiles.$inferSelect;

export async function createContext(req: Request) {
  const authHeader = req.headers.get("authorization") ?? "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;

  let user: Profile | null = null;

  if (token) {
    const { data, error } = await supabaseAdmin.auth.getUser(token);
    if (!error && data.user) {
      // Ensure a profile row exists for this auth user (first-login upsert).
      const existing = await db.query.profiles.findFirst({
        where: eq(schema.profiles.id, data.user.id),
      });

      if (existing) {
        user = existing;
      } else {
        const [created] = await db
          .insert(schema.profiles)
          .values({
            id: data.user.id,
            email: data.user.email ?? null,
            name:
              (data.user.user_metadata?.name as string | undefined) ??
              data.user.email?.split("@")[0] ??
              "New User",
          })
          .returning();
        user = created;
      }
    }
  }

  return { user, db };
}

export type Context = Awaited<ReturnType<typeof createContext>>;

const t = initTRPC.context<Context>().create({
  transformer: superjson,
});

export const router = t.router;
export const publicProcedure = t.procedure;

// Throws if there's no authenticated user; otherwise narrows ctx.user to non-null.
export const protectedProcedure = t.procedure.use(({ ctx, next }) => {
  if (!ctx.user) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: "Sign in required" });
  }
  return next({ ctx: { ...ctx, user: ctx.user } });
});
