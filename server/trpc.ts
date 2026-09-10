import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import { createClient } from "@supabase/supabase-js";
import { db, schema } from "../db/index.js";
import { eq } from "drizzle-orm";

const supabaseUrl = process.env.SUPABASE_URL || "https://placeholder.supabase.co";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "preview-placeholder-service-role-key";

const supabaseConfigured = !!process.env.SUPABASE_URL && !!process.env.SUPABASE_SERVICE_ROLE_KEY;
const dbConfigured = !!process.env.DATABASE_URL;

// A misconfigured deploy with a real DATABASE_URL but missing Supabase
// creds must never silently fall back to demo mode — that would grant the
// hardcoded demo user full write access to a real database. Fail loudly
// at boot instead.
if (!supabaseConfigured && dbConfigured) {
  throw new Error(
    "[peza] SUPABASE_URL/SUPABASE_SERVICE_ROLE_KEY are missing while DATABASE_URL is set. " +
      "Refusing to start in demo mode against a real database — set the Supabase env vars.",
  );
}

// This is the one flag that decides whether the demo/preview auth path is
// reachable at all. It must stay derived from real credentials AND a real
// database being absent — never true in an environment with either set,
// no matter what token a request sends. See the demo-token branch below.
const isPreviewMode = !supabaseConfigured && !dbConfigured;

if (isPreviewMode) {
  console.warn("[v0] Supabase server credentials missing; auth-backed server actions are disabled in preview.");
}

// Admin client used only on the server to verify user JWTs.
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

export type Profile = typeof schema.profiles.$inferSelect;

// Short-TTL cache for verified profiles so a busy user doesn't re-hit
// Supabase auth + a profile lookup on every single request in a batch.
// Deliberately small TTL — this trades a little staleness for a lot of
// avoided round trips, not a real session store.
const PROFILE_CACHE_TTL_MS = 15_000;
const profileCache = new Map<string, { profile: Profile; expiresAt: number }>();

function getCachedProfile(userId: string): Profile | null {
  const hit = profileCache.get(userId);
  if (!hit) return null;
  if (hit.expiresAt < Date.now()) {
    profileCache.delete(userId);
    return null;
  }
  return hit.profile;
}

function setCachedProfile(userId: string, profile: Profile) {
  profileCache.set(userId, { profile, expiresAt: Date.now() + PROFILE_CACHE_TTL_MS });
}

// Any mutation that changes a profile row (role changes, name/phone/language
// edits) must call this — otherwise a cached copy from an earlier request in
// the same TTL window can serve stale data, which is worse than just not
// caching: becomeRider updating role but a stale cache still saying
// "vendor" would incorrectly FORBIDDEN a rider's very next request.
export function invalidateProfileCache(userId: string) {
  profileCache.delete(userId);
}

export async function createContext(req: Request) {
  const authHeader = req.headers.get("authorization") ?? "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;

  let user: Profile | null = null;

  if (isPreviewMode && token === "demo-access-token") {
    // Only reachable when Supabase server credentials are genuinely absent
    // (local/preview dev). In any environment with real SUPABASE_URL and
    // SUPABASE_SERVICE_ROLE_KEY set — i.e. production — this branch can
    // never match, regardless of what token a request sends.
    user = {
      id: "demo-user-id",
      email: "demo@peza.africa",
      name: "PEZA Vendor",
      phone: null,
      preferredLanguage: "en",
      role: "vendor",
      createdAt: new Date(),
    } as Profile;
  } else if (token) {
    const { data, error } = await supabaseAdmin.auth.getUser(token);
    if (!error && data.user) {
      const cached = getCachedProfile(data.user.id);
      if (cached) {
        user = cached;
      } else {
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

        if (user) setCachedProfile(data.user.id, user);
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
