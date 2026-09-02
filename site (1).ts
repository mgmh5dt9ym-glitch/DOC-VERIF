export const STORAGE_BUCKET = "documents";

/**
 * Domaine public utilisé pour tous les liens de vérification et QR codes.
 * Ne jamais ajouter /admin, /admin/login ou /v ici.
 */
const PUBLIC_SITE_ORIGIN = "https://docverif.vercel.app";

export function buildPublicUrl(code: string): string {
  const cleanCode = String(code).trim();
  return `${PUBLIC_SITE_ORIGIN}/v/${encodeURIComponent(cleanCode)}`;
}
