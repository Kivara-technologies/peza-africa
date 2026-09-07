import { createClient } from "@supabase/supabase-js";

const configuredUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const configuredAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;
const isDemoMode = !configuredUrl || !configuredAnonKey || configuredUrl.includes("placeholder") || configuredAnonKey.includes("placeholder");

const demoUser = {
  id: "demo-user-id",
  email: "demo@peza.africa",
  user_metadata: {
    name: "PEZA Vendor",
    role: "vendor",
  },
};

const demoSession = {
  access_token: "demo-access-token",
  refresh_token: "demo-refresh-token",
  expires_at: Math.floor(Date.now() / 1000) + 60 * 60 * 24,
  user: demoUser,
};

if (isDemoMode) {
  // eslint-disable-next-line no-console
  console.warn("Supabase env vars missing; enabling preview demo auth so sign-in works without cloud credentials.");
}

const demoAuth = {
  async signInWithPassword({ email, password }: { email: string; password: string }) {
    const hasValidDemoCredentials = email === "demo@peza.africa" && password === "demo123";
    if (!hasValidDemoCredentials) {
      return { data: { user: null, session: null }, error: { message: "Use demo@peza.africa / demo123 to continue in preview mode." } };
    }

    localStorage.setItem("peza_demo_session", JSON.stringify(demoSession));
    return { data: { user: demoUser, session: demoSession }, error: null };
  },
  async signUp({ email, password, options }: { email: string; password: string; options?: { data?: { name?: string } } }) {
    if (!email || !password) {
      return { data: { user: null, session: null }, error: { message: "Email and password are required." } };
    }

    const createdUser = {
      ...demoUser,
      email,
      user_metadata: {
        name: options?.data?.name || email.split("@")[0],
      },
    };

    localStorage.setItem("peza_demo_session", JSON.stringify({ ...demoSession, user: createdUser }));
    return { data: { user: createdUser, session: { ...demoSession, user: createdUser } }, error: null };
  },
  async signInWithOAuth() {
    localStorage.setItem("peza_demo_session", JSON.stringify(demoSession));
    return { data: { provider: "google" }, error: null };
  },
  async signOut() {
    localStorage.removeItem("peza_demo_session");
    return { error: null };
  },
  async getSession() {
    const saved = localStorage.getItem("peza_demo_session");
    if (!saved) {
      return { data: { session: null }, error: null };
    }
    try {
      const parsed = JSON.parse(saved);
      return { data: { session: parsed }, error: null };
    } catch {
      return { data: { session: null }, error: null };
    }
  },
  onAuthStateChange(callback: (event: string, session: any) => void) {
    const saved = localStorage.getItem("peza_demo_session");
    const session = saved ? JSON.parse(saved) : null;
    callback(session ? "SIGNED_IN" : "SIGNED_OUT", session);
    return { data: { subscription: { unsubscribe: () => undefined } } };
  },
};

export const supabase = isDemoMode
  ? ({
    auth: demoAuth,
    isDemoMode: true,
  } as any)
  : createClient(configuredUrl!, configuredAnonKey!);

export const isSupabaseDemoMode = isDemoMode;
