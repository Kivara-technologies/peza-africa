-- rls_auto_enable is a SECURITY DEFINER helper and must never be exposed
-- as an anonymous/authenticated REST RPC endpoint.
revoke execute on function public.rls_auto_enable() from public;
revoke execute on function public.rls_auto_enable() from anon;
revoke execute on function public.rls_auto_enable() from authenticated;
