import { createBrowserClient } from "@supabase/ssr";

/**
 * Browser client for a future RLS + client data flow, or public reads.
 * The signup flow uses server API routes; do not put the service role in the client.
 */
export function createBrowserSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) {
    throw new Error(
      "Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env for client usage."
    );
  }
  return createBrowserClient(url, key);
}
