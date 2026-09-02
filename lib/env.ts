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
 * URL publique configurée côté serveur.
 * Aucun domaine de production n'est codé en dur.
 */
export function getSiteUrl(): string {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (configured) {
    try {
      const withProtocol = /^https?:\/\//i.test(configured)
        ? configured
        : `https://${configured}`;
      return new URL(withProtocol).origin;
    } catch {
      // Continue vers le fallback Vercel/local.
    }
  }

  const vercelHost =
    process.env.VERCEL_PROJECT_PRODUCTION_URL || process.env.VERCEL_URL;
  if (vercelHost) {
    try {
      const withProtocol = /^https?:\/\//i.test(vercelHost)
        ? vercelHost
        : `https://${vercelHost}`;
      return new URL(withProtocol).origin;
    } catch {
      // Continue vers localhost.
    }
  }

  return "http://localhost:3000";
}
