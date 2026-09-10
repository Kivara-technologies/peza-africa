import type { ReactNode } from "react";
import { useLocation } from "react-router";
import { useAuth } from "@/hooks/useAuth";
import { LOGIN_PATH } from "@/const";

// Wraps a route that requires a signed-in user. While signed out, these
// routes previously rendered in a broken logged-out state (every query
// 401ing) instead of sending the person to log in. This makes that
// redirect explicit and carries the intended destination as ?redirect=
// so Login can send them back after signing in.
export default function RequireAuth({ children }: { children: ReactNode }) {
  const location = useLocation();
  const { isAuthenticated, isLoading } = useAuth({
    redirectOnUnauthenticated: true,
    redirectPath: `${LOGIN_PATH}?redirect=${encodeURIComponent(location.pathname)}`,
  });

  if (isLoading) {
    return <div className="flex items-center justify-center py-24 text-peza-brown/60">Loading…</div>;
  }

  if (!isAuthenticated) {
    // useAuth's effect is already navigating away; render nothing in the
    // meantime rather than flashing the protected page.
    return null;
  }

  return <>{children}</>;
}
