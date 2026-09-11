import { trpc } from "@/providers/trpc";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { LOGIN_PATH } from "@/const";
import { supabase } from "@/lib/supabaseClient";
import type { Session } from "@supabase/supabase-js";

type UseAuthOptions = {
  redirectOnUnauthenticated?: boolean;
  redirectPath?: string;
};

export function useAuth(options?: UseAuthOptions) {
  const { redirectOnUnauthenticated = false, redirectPath = LOGIN_PATH } = options ?? {};
  const navigate = useNavigate();
  const utils = trpc.useUtils();
  const [session, setSession] = useState<Session | null>(null);
  const [sessionLoading, setSessionLoading] = useState(true);

  const { data: user, isLoading: userLoading, error, refetch } = trpc.auth.me.useQuery(undefined, {
    enabled: !sessionLoading && !!session,
    staleTime: 1000 * 60,
    refetchInterval: false,
    refetchOnWindowFocus: false,
    retry: 1,
  });

  const logoutMutation = trpc.auth.logout.useMutation({
    onSuccess: async () => {
      await supabase.auth.signOut();
      setSession(null);
      await utils.invalidate();
      navigate(redirectPath, { replace: true });
    },
  });

  const logout = useCallback(async () => {
    try {
      await logoutMutation.mutateAsync();
    } catch {
      await supabase.auth.signOut();
      setSession(null);
      await utils.invalidate();
      navigate(redirectPath, { replace: true });
    }
  }, [logoutMutation, navigate, redirectPath, utils]);

  useEffect(() => {
    let mounted = true;
    let initialized = false;

    void supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      initialized = true;
      setSession(data.session ?? null);
      setSessionLoading(false);
    });

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (!mounted) return;
      // The session state itself enables auth.me; don't immediately refetch it
      // from inside the auth callback, which can race the state update and keep
      // protected pages in a perpetual loading cycle.
      setSession(nextSession ?? null);
      setSessionLoading(false);
    });

    // Safety valve for a browser/Supabase client that never resolves getSession.
    const timeout = window.setTimeout(() => {
      if (!mounted || initialized) return;
      setSession(null);
      setSessionLoading(false);
    }, 7000);

    return () => {
      mounted = false;
      window.clearTimeout(timeout);
      subscription.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (redirectOnUnauthenticated && !sessionLoading && !session) {
      const currentPath = window.location.pathname;
      if (currentPath !== redirectPath) navigate(redirectPath, { replace: true });
    }
  }, [redirectOnUnauthenticated, sessionLoading, session, navigate, redirectPath]);

  return useMemo(() => ({
    user: user ?? null,
    session,
    isAuthenticated: !!session,
    isLoading: sessionLoading || userLoading || logoutMutation.isPending,
    error,
    logout,
    refresh: refetch,
  }), [user, session, sessionLoading, userLoading, logoutMutation.isPending, error, logout, refetch]);
}
