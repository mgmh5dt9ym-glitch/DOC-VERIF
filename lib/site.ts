export const STORAGE_BUCKET = "documents";
export const PUBLIC_SITE_ORIGIN = "https://docverif.vercel.app";

export function buildPublicUrl(code: string): string {
  return `${PUBLIC_SITE_ORIGIN}/v/${encodeURIComponent(String(code).trim())}`;
}
