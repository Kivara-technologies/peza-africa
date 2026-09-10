import { createTRPCReact } from "@trpc/react-query";
import { httpBatchLink } from "@trpc/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import superjson from "superjson";
import type { AppRouter } from "../../server/router";
import type { ReactNode } from "react";
import { supabase } from "@/lib/supabaseClient";

export const trpc = createTRPCReact<AppRouter>();

const queryClient = new QueryClient();
const trpcClient = trpc.createClient({
  links: [
    httpBatchLink({
      url: "/api/trpc",
      transformer: superjson,
      // No `credentials: "include"` here (deliberately removed) — this API
      // authenticates via a Bearer token in the headers below, not cookies,
      // so sending credentials would just be unnecessary exposure on an
      // API whose CORS surface includes preview-deployment origins.
      async headers() {
        const { data } = await supabase.auth.getSession();
        // Real session token always wins. The demo token is only ever a
        // fallback when there is no real session at all — never discard a
        // live JWT in favor of it (that was the bug: `A || B ? X : Y`
        // evaluated as `(A || B) ? X : Y`, so any truthy token still hit
        // the demo branch).
        const token = data.session?.access_token ?? ((supabase as any).isDemoMode ? "demo-access-token" : undefined);
        return token ? { authorization: `Bearer ${token}` } : {};
      },
    }),
  ],
});

export function TRPCProvider({ children }: { children: ReactNode }) {
  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </trpc.Provider>
  );
}
