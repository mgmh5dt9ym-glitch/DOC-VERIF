"use client";

import { createBrowserClient } from "@supabase/ssr";

/** Client navigateur : clé anon uniquement, sert seulement à l'authentification. */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
