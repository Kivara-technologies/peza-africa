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
  const { redirectOnUnauthenticated = false, redirectPath = LOGIN_PATH } =
    options ?? {};

  const navigate = useNavigate();
  const utils = trpc.useUtils();
  const [session, setSession] = useState<Session | null>(null);
  const [sessionLoading, setSessionLoading] = useState(true);

  const isRiderRoute = typeof window !== "undefined" && window.location.pathname === "/rider";

  const {
    data: user,
    isLoading: userLoading,
    error,
    refetch,
  } = trpc.auth.me.useQuery(undefined, {
    enabled: !sessionLoading && !!session,
    staleTime: isRiderRoute ? 0 : 1000 * 60 * 5,
    refetchInterval: isRiderRoute ? 5000 : false,
    refetchIntervalInBackground: false,
    retry: false,
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

  // Supabase is the source of truth for authentication. The tRPC profile is
  // application data and may be temporarily unavailable without meaning the
  // user's valid Supabase session has disappeared.
  useEffect(() => {
    let mounted = true;

    void supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setSession(data.session ?? null);
      setSessionLoading(false);
    });

    const { data: subscription } = supabase.auth.onAuthStateChange(
      (_event, nextSession) => {
        if (!mounted) return;
        setSession(nextSession ?? null);
        setSessionLoading(false);
        void refetch();
      },
    );

    return () => {
      mounted = false;
      subscription.subscription.unsubscribe();
    };
  }, [refetch]);

  useEffect(() => {
    if (redirectOnUnauthenticated && !sessionLoading && !session) {
      const currentPath = window.location.pathname;
      if (currentPath !== redirectPath) {
        navigate(redirectPath, { replace: true });
      }
    }
  }, [redirectOnUnauthenticated, sessionLoading, session, navigate, redirectPath]);

  return useMemo(
    () => ({
      user: user ?? null,
      session,
      isAuthenticated: !!session,
      isLoading: sessionLoading || userLoading || logoutMutation.isPending,
      error,
      logout,
      refresh: refetch,
    }),
    [
      user,
      session,
      sessionLoading,
      userLoading,
      logoutMutation.isPending,
      error,
      logout,
      refetch,
    ],
  );
}
