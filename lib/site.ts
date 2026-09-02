import { getSiteUrl } from "./env";

export const STORAGE_BUCKET = "documents";

export function buildPublicUrl(code: string): string {
  return `${getSiteUrl()}/v/${code}`;
}
