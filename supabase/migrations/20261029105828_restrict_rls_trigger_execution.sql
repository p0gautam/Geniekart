-- This is a Supabase-provided DDL event trigger, not a client RPC.
-- Its event-trigger invocation continues to work after this privilege reduction.
revoke execute on function public.rls_auto_enable() from public, anon, authenticated;
