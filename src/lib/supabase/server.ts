import { createClient } from "@supabase/supabase-js";

/**
 * Resolves the Supabase project URL from env. Accepts the common dashboard names.
 */
export function getSupabaseUrl(): string {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  if (url) return url;
  return process.env.SUPABASE_URL?.trim() ?? "";
}

/**
 * Service role (server only). Use for `membership_store_append` and reliable member writes.
 */
function getServiceRoleKey(): string {
  return process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() ?? "";
}

/**
 * Anon / publishable key. Supabase’s dashboard may show this as "anon" or "publishable (anon)".
 */
function getAnonOrPublishableKey(): string {
  return (
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() ||
    process.env.SUPABASE_ANON_KEY?.trim() ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim() ||
    ""
  );
}

export function hasServiceRoleKey(): boolean {
  return getServiceRoleKey().length > 0;
}

/**
 * Server-only Supabase client for API routes / server actions.
 * • Prefer SUPABASE_SERVICE_ROLE_KEY for writes (executes `membership_store_append`).
 * • Falls back to anon / publishable for legacy `membership_store` upsert when RLS is off.
 */
export function createMembershipSupabaseClient() {
  const url = getSupabaseUrl();
  const key = getServiceRoleKey() || getAnonOrPublishableKey();
  if (!url || !key) {
    throw new Error(
      "Missing Supabase env: set NEXT_PUBLIC_SUPABASE_URL and " +
        "NEXT_PUBLIC_SUPABASE_ANON_KEY (or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY). " +
        "Set SUPABASE_SERVICE_ROLE_KEY in production for reliable application submissions."
    );
  }
  return createClient(url, key);
}
