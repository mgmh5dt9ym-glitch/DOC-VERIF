export const STORAGE_BUCKET = "documents";

export function getPublicSiteOrigin(): string {
  const raw =
    process.env.NEXT_PUBLIC_SITE_URL ||
    "https://docverif.vercel.app";

  try {
    return new URL(raw).origin;
  } catch {
    return "https://docverif.vercel.app";
  }
}

export function buildPublicUrl(code: string): string {
  const cleanCode = String(code).trim();

  return `${getPublicSiteOrigin()}/v/${encodeURIComponent(cleanCode)}`;
}
