import { createClient } from "@supabase/supabase-js";

const configuredUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const configuredAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;
const url = configuredUrl || "https://placeholder.supabase.co";
const anonKey = configuredAnonKey || "preview-placeholder-anon-key";

if (!configuredUrl || !configuredAnonKey) {
  // eslint-disable-next-line no-console
  console.warn("Supabase env vars missing; authenticated data actions are disabled in preview.");
}

export const supabase = createClient(url, anonKey);
