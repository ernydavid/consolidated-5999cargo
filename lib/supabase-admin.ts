import { createClient } from "@supabase/supabase-js";

import { env } from "@/lib/env";

export function createSupabaseAdminClient() {
  const adminKey = env.SUPABASE_SECRET_KEY ?? env.SUPABASE_SERVICE_ROLE_KEY;

  if (!adminKey) {
    return null;
  }

  return createClient(env.NEXT_PUBLIC_SUPABASE_URL, adminKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
  });
}
