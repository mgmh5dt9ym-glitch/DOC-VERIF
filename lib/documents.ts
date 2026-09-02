import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import { STORAGE_BUCKET, buildPublicUrl } from "@/lib/site";
import { isValidVerificationCode } from "@/lib/codes";
import { verifyAdminSession } from "@/lib/admin-auth";
import type { AdminDocument, DocumentRow } from "@/types/document";

const SIGNED_URL_TTL_SECONDS = 60 * 60; // 1 heure

/**
 * Page publique : retourne l'URL signée de l'image pour un code donné,
 * ou null si le document n'existe pas.
 */
export async function getPublicImageUrl(code: string): Promise<string | null> {
  if (!isValidVerificationCode(code)) return null;

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("documents")
    .select("image_path")
    .eq("verification_code", code)
    .maybeSingle();

  if (error || !data) return null;

  const { data: signed, error: signError } = await supabase.storage
    .from(STORAGE_BUCKET)
    .createSignedUrl(data.image_path, SIGNED_URL_TTL_SECONDS);

  if (signError || !signed) return null;
  return signed.signedUrl;
}

/** Admin : liste complète avec miniatures signées. Session vérifiée ici aussi. */
export async function listDocumentsForAdmin(): Promise<AdminDocument[]> {
  if (!(await verifyAdminSession())) throw new Error("Non autorisé.");
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("documents")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw new Error(`Supabase : ${error.message}`);
  const rows = (data ?? []) as DocumentRow[];
  if (rows.length === 0) return [];

  const { data: signed } = await supabase.storage
    .from(STORAGE_BUCKET)
    .createSignedUrls(
      rows.map((r) => r.image_path),
      SIGNED_URL_TTL_SECONDS,
    );

  return rows.map((row, i) => ({
    ...row,
    thumbnail_url: signed?.[i]?.signedUrl ?? null,
    public_url: buildPublicUrl(row.verification_code),
  }));
}
