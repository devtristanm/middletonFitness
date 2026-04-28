import { createClient } from "@supabase/supabase-js";

/**
 * Server-only Supabase client for API routes / server actions.
 * Uses the service role key when set (bypasses RLS); otherwise the publishable key
 * (works if RLS is disabled on `membership_store` — OK for local testing).
 */
export function createMembershipSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim();
  if (!url || !key) {
    throw new Error(
      "Missing Supabase env: set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY (optionally SUPABASE_SERVICE_ROLE_KEY on the server for RLS)."
    );
  }
  return createClient(url, key);
}
