/**
 * Accès centralisé aux variables d'environnement.
 */

function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `Variable d'environnement manquante : ${name}. Voir .env.example.`,
    );
  }
  return value;
}

export function getSupabaseUrl(): string {
  return required("NEXT_PUBLIC_SUPABASE_URL");
}

export function getSupabaseAnonKey(): string {
  return required("NEXT_PUBLIC_SUPABASE_ANON_KEY");
}

/** Côté serveur uniquement. Jamais importé dans un composant client. */
export function getSupabaseServiceRoleKey(): string {
  return required("SUPABASE_SERVICE_ROLE_KEY");
}

/**
 * Retourne toujours uniquement l'origine du site, sans chemin.
 * Ex.: https://docverif.vercel.app/admin/login -> https://docverif.vercel.app
 */
export function getSiteUrl(): string {
  const raw = process.env.NEXT_PUBLIC_SITE_URL || "https://docverif.vercel.app";

  try {
    return new URL(raw).origin;
  } catch {
    return "https://docverif.vercel.app";
  }
}
