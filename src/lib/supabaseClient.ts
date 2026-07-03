import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL as string;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

if (!url || !anonKey) {
  // eslint-disable-next-line no-console
  console.warn("Supabase env vars missing - set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY");
}

export const supabase = createClient(url, anonKey);
