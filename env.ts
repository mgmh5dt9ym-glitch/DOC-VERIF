/**
 * Accès centralisé aux variables d'environnement.
 * Les fonctions sont appelées à l'exécution (pas à l'import) pour que
 * `next build` fonctionne même sans variables définies.
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
 * Retourne uniquement l'origine publique du site.
 * Exemple :
 *   https://docverif.vercel.app/admin/login
 * devient :
 *   https://docverif.vercel.app
 *
 * Cela empêche /admin/login ou tout autre chemin de se retrouver
 * accidentellement dans les liens et QR codes publics.
 */
export function getSiteUrl(): string {
  const raw = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

  try {
    return new URL(raw).origin;
  } catch {
    return "http://localhost:3000";
  }
}
