import "server-only";

import { createClient } from "@supabase/supabase-js";
import { getSupabaseServiceRoleKey, getSupabaseUrl } from "@/lib/env";

/**
 * Client avec la clé SERVICE ROLE.
 * ⚠️ Serveur uniquement (Server Actions / Server Components). Ne jamais
 * l'importer dans un composant "use client". Le paquet "server-only"
 * fait échouer le build si cela arrive.
 */
export function createAdminClient() {
  return createClient(getSupabaseUrl(), getSupabaseServiceRoleKey(), {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
