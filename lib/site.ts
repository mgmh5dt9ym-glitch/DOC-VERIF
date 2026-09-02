export const STORAGE_BUCKET = "documents";

function normalizeOrigin(value: string): string {
  const raw = String(value || "").trim();
  if (!raw) return "";

  const withProtocol = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;

  try {
    return new URL(withProtocol).origin;
  } catch {
    return "";
  }
}

/**
 * Origine publique utilisée pour les liens de vérification.
 *
 * Dans le navigateur, on privilégie toujours le domaine réellement ouvert.
 * Cela permet au QR de suivre automatiquement un changement de domaine.
 *
 * Côté serveur, NEXT_PUBLIC_SITE_URL est utilisé en priorité, puis les
 * variables système Vercel. Aucun domaine de production n'est écrit en dur.
 */
export function getPublicSiteOrigin(): string {
  if (typeof window !== "undefined" && window.location?.origin) {
    const browserOrigin = normalizeOrigin(window.location.origin);
    if (browserOrigin) return browserOrigin;
  }

  const configured = normalizeOrigin(process.env.NEXT_PUBLIC_SITE_URL || "");
  if (configured) return configured;

  const vercelHost =
    process.env.VERCEL_PROJECT_PRODUCTION_URL || process.env.VERCEL_URL || "";
  const vercelOrigin = normalizeOrigin(vercelHost);
  if (vercelOrigin) return vercelOrigin;

  return "http://localhost:3000";
}

export function buildPublicUrl(code: string): string {
  const cleanCode = String(code ?? "").trim();
  if (!cleanCode) throw new Error("Code de vérification manquant.");

  return `${getPublicSiteOrigin()}/v/${encodeURIComponent(cleanCode)}`;
}
