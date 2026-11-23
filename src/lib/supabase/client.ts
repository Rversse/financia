import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/types/database.types";

let browserClient: SupabaseClient<Database> | undefined;

/**
 * Returns the single browser-side Supabase client for this application.
 *
 * This project uses Next.js static export, so authentication runs in the
 * browser with PKCE. Only the publishable key may be exposed to this client.
 * Never pass a service-role key or database password here.
 */
export function getSupabaseBrowserClient(): SupabaseClient<Database> {
  if (typeof window === "undefined") {
    throw new Error(
      "The FINANCIA Supabase browser client can only be used in the browser."
    );
  }

  if (browserClient) {
    return browserClient;
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!supabaseUrl || !publishableKey) {
    throw new Error(
      "FINANCIA Supabase environment is missing. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY."
    );
  }

  browserClient = createClient<Database>(supabaseUrl, publishableKey, {
    auth: {
      flowType: "pkce",
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true
    }
  });

  return browserClient;
}
