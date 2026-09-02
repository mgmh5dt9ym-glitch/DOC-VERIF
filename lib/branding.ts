import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import { STORAGE_BUCKET } from "@/lib/site";
import { verifyAdminSession } from "@/lib/admin-auth";

const SIGNED_URL_TTL_SECONDS = 60 * 60;

export type VerificationBranding = {
  header_url: string | null;
  logo_url: string | null;
  status_text: string;
};

async function signedUrl(path: string | null): Promise<string | null> {
  if (!path) return null;

  const supabase = createAdminClient();
  const { data, error } = await supabase.storage
    .from(STORAGE_BUCKET)
    .createSignedUrl(path, SIGNED_URL_TTL_SECONDS);

  if (error || !data) return null;
  return data.signedUrl;
}

export async function getVerificationBranding(): Promise<VerificationBranding> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("site_branding")
    .select("header_path, logo_path, status_text")
    .eq("id", 1)
    .maybeSingle();

  if (error || !data) {
    return {
      header_url: null,
      logo_url: null,
      status_text: "FIRMADO - VIGENTE",
    };
  }

  const [headerUrl, logoUrl] = await Promise.all([
    signedUrl(data.header_path),
    signedUrl(data.logo_path),
  ]);

  return {
    header_url: headerUrl,
    logo_url: logoUrl,
    status_text: data.status_text || "FIRMADO - VIGENTE",
  };
}

export async function getBrandingForAdmin(): Promise<VerificationBranding> {
  if (!(await verifyAdminSession())) throw new Error("Non autorisé.");
  return getVerificationBranding();
}
