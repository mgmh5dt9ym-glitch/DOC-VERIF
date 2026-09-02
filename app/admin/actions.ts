"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import {
  checkAdminPassword,
  createAdminSession,
  destroyAdminSession,
  verifyAdminSession,
} from "@/lib/admin-auth";
import { getLockoutSeconds, registerFailure, registerSuccess } from "@/lib/login-rate-limit";
import { createAdminClient } from "@/lib/supabase/admin";
import { generateVerificationCode } from "@/lib/codes";
import { STORAGE_BUCKET } from "@/lib/site";
import { checkFileBasics, sniffImageType } from "@/lib/validation";
import type { ActionResult } from "@/types/document";

/* ---------- Authentification ---------- */

async function clientIp(): Promise<string> {
  const h = await headers();
  return (
    h.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    h.get("x-real-ip") ||
    "unknown"
  );
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export async function loginAction(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const password = String(formData.get("password") ?? "");
  const ip = await clientIp();

  const locked = getLockoutSeconds(ip);
  if (locked > 0) {
    return {
      ok: false,
      error: `Trop de tentatives. Réessayez dans ${Math.ceil(locked / 60)} min.`,
    };
  }

  let valid = false;
  try {
    valid = password.length > 0 && checkAdminPassword(password);
  } catch {
    return { ok: false, error: "Configuration serveur incomplète (ADMIN_PASSWORD / ADMIN_SESSION_SECRET)." };
  }

  if (!valid) {
    await sleep(registerFailure(ip));
    return { ok: false, error: "Mot de passe incorrect." };
  }

  registerSuccess(ip);
  await createAdminSession();
  redirect("/admin");
}

export async function logoutAction(): Promise<void> {
  await destroyAdminSession();
  redirect("/admin/login");
}

/* ---------- Helpers ---------- */

/** Chaque action sensible revérifie la session, indépendamment du proxy. */
async function requireAdmin(): Promise<void> {
  if (!(await verifyAdminSession())) throw new Error("Non autorisé.");
}

function friendlyError(e: unknown): string {
  const message = e instanceof Error ? e.message : String(e);
  if (/fetch failed|ECONNREFUSED|ENOTFOUND/i.test(message)) {
    return "Connexion à Supabase impossible. Vérifiez l'URL et les clés.";
  }
  return message;
}

/**
 * Valide le fichier (taille, type déclaré, signature binaire) et renvoie
 * le contenu prêt à envoyer.
 */
async function validateUpload(file: unknown) {
  if (!(file instanceof File)) {
    return { ok: false as const, error: "Aucun fichier reçu." };
  }
  const basics = checkFileBasics(file);
  if (!basics.ok) return basics;

  const buffer = new Uint8Array(await file.arrayBuffer());
  const sniffed = sniffImageType(buffer);
  if (!sniffed) {
    return { ok: false as const, error: "Le contenu du fichier n'est pas une image JPEG, PNG ou WEBP valide." };
  }
  const extension = sniffed === "image/jpeg" ? "jpg" : sniffed === "image/png" ? "png" : "webp";
  return { ok: true as const, buffer, mime: sniffed, extension };
}

/* ---------- Créer un document ---------- */

export async function uploadDocumentAction(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  try {
    await requireAdmin();
    const checked = await validateUpload(formData.get("file"));
    if (!checked.ok) return { ok: false, error: checked.error };

    const supabase = createAdminClient();
    const id = crypto.randomUUID();
    const imagePath = `${id}/document.${checked.extension}`;

    const { error: storageError } = await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(imagePath, checked.buffer, {
        contentType: checked.mime,
        cacheControl: "3600",
        upsert: false,
      });
    if (storageError) {
      return { ok: false, error: `Échec de l'envoi de l'image : ${storageError.message}` };
    }

    // Boucle de sécurité en cas (très improbable) de collision de code.
    let inserted = false;
    for (let attempt = 0; attempt < 5 && !inserted; attempt++) {
      const code = generateVerificationCode();
      const { error: dbError } = await supabase
        .from("documents")
        .insert({ id, verification_code: code, image_path: imagePath });
      if (!dbError) {
        inserted = true;
      } else if (dbError.code !== "23505") {
        await supabase.storage.from(STORAGE_BUCKET).remove([imagePath]);
        return { ok: false, error: `Erreur base de données : ${dbError.message}` };
      }
    }
    if (!inserted) {
      await supabase.storage.from(STORAGE_BUCKET).remove([imagePath]);
      return { ok: false, error: "Impossible de générer un code unique. Réessayez." };
    }

    revalidatePath("/admin");
    return { ok: true, message: "Document enregistré." };
  } catch (e) {
    return { ok: false, error: friendlyError(e) };
  }
}

/* ---------- Remplacer l'image ---------- */

export async function replaceImageAction(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  try {
    await requireAdmin();
    const id = String(formData.get("id") ?? "");
    if (!/^[0-9a-f-]{36}$/i.test(id)) return { ok: false, error: "Identifiant invalide." };

    const checked = await validateUpload(formData.get("file"));
    if (!checked.ok) return { ok: false, error: checked.error };

    const supabase = createAdminClient();
    const { data: doc, error: findError } = await supabase
      .from("documents")
      .select("id, image_path")
      .eq("id", id)
      .maybeSingle();
    if (findError || !doc) return { ok: false, error: "Document introuvable." };

    // Nouveau nom de fichier : le lien public reste identique,
    // seule l'image change.
    const newPath = `${doc.id}/document-${crypto.randomUUID()}.${checked.extension}`;
    const { error: storageError } = await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(newPath, checked.buffer, { contentType: checked.mime, cacheControl: "3600" });
    if (storageError) {
      return { ok: false, error: `Échec de l'envoi de l'image : ${storageError.message}` };
    }

    const { error: updateError } = await supabase
      .from("documents")
      .update({ image_path: newPath })
      .eq("id", doc.id);
    if (updateError) {
      await supabase.storage.from(STORAGE_BUCKET).remove([newPath]);
      return { ok: false, error: `Erreur base de données : ${updateError.message}` };
    }

    if (doc.image_path !== newPath) {
      await supabase.storage.from(STORAGE_BUCKET).remove([doc.image_path]);
    }

    revalidatePath("/admin");
    revalidatePath(`/v/[code]`, "page");
    return { ok: true, message: "Image remplacée." };
  } catch (e) {
    return { ok: false, error: friendlyError(e) };
  }
}

/* ---------- Supprimer ---------- */

export async function deleteDocumentAction(id: string): Promise<ActionResult> {
  try {
    await requireAdmin();
    if (!/^[0-9a-f-]{36}$/i.test(id)) return { ok: false, error: "Identifiant invalide." };

    const supabase = createAdminClient();
    const { data: doc, error: findError } = await supabase
      .from("documents")
      .select("id, image_path")
      .eq("id", id)
      .maybeSingle();
    if (findError || !doc) return { ok: false, error: "Document introuvable." };

    const { error: dbError } = await supabase.from("documents").delete().eq("id", doc.id);
    if (dbError) return { ok: false, error: `Erreur base de données : ${dbError.message}` };

    // Supprime l'image et tout autre fichier resté dans le dossier du document.
    const { data: files } = await supabase.storage.from(STORAGE_BUCKET).list(doc.id);
    const paths = (files ?? []).map((f) => `${doc.id}/${f.name}`);
    if (!paths.includes(doc.image_path)) paths.push(doc.image_path);
    await supabase.storage.from(STORAGE_BUCKET).remove(paths);

    revalidatePath("/admin");
    return { ok: true, message: "Document supprimé." };
  } catch (e) {
    return { ok: false, error: friendlyError(e) };
  }
}

/* ---------- Apparence de la page publique ---------- */

export async function updateBrandingAction(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  try {
    await requireAdmin();

    const headerFile = formData.get("header");
    const logoFile = formData.get("logo");
    const statusText = String(formData.get("status_text") ?? "FIRMADO - VIGENTE")
      .trim()
      .slice(0, 80) || "FIRMADO - VIGENTE";

    const supabase = createAdminClient();
    const { data: existing } = await supabase
      .from("site_branding")
      .select("header_path, logo_path")
      .eq("id", 1)
      .maybeSingle();

    let headerPath = existing?.header_path ?? null;
    let logoPath = existing?.logo_path ?? null;
    const oldPaths: string[] = [];

    if (headerFile instanceof File && headerFile.size > 0) {
      const checked = await validateUpload(headerFile);
      if (!checked.ok) return { ok: false, error: `Header : ${checked.error}` };

      const newPath = `branding/header-${crypto.randomUUID()}.${checked.extension}`;
      const { error } = await supabase.storage
        .from(STORAGE_BUCKET)
        .upload(newPath, checked.buffer, {
          contentType: checked.mime,
          cacheControl: "3600",
          upsert: false,
        });
      if (error) return { ok: false, error: `Échec de l’envoi du header : ${error.message}` };
      if (headerPath) oldPaths.push(headerPath);
      headerPath = newPath;
    }

    if (logoFile instanceof File && logoFile.size > 0) {
      const checked = await validateUpload(logoFile);
      if (!checked.ok) return { ok: false, error: `Logo : ${checked.error}` };

      const newPath = `branding/logo-${crypto.randomUUID()}.${checked.extension}`;
      const { error } = await supabase.storage
        .from(STORAGE_BUCKET)
        .upload(newPath, checked.buffer, {
          contentType: checked.mime,
          cacheControl: "3600",
          upsert: false,
        });
      if (error) return { ok: false, error: `Échec de l’envoi du logo : ${error.message}` };
      if (logoPath) oldPaths.push(logoPath);
      logoPath = newPath;
    }

    const { error: dbError } = await supabase
      .from("site_branding")
      .upsert({
        id: 1,
        header_path: headerPath,
        logo_path: logoPath,
        status_text: statusText,
      });

    if (dbError) return { ok: false, error: `Erreur base de données : ${dbError.message}` };

    if (oldPaths.length > 0) {
      await supabase.storage.from(STORAGE_BUCKET).remove(oldPaths);
    }

    revalidatePath("/admin");
    revalidatePath("/v/[code]", "page");
    return { ok: true, message: "Apparence enregistrée." };
  } catch (e) {
    return { ok: false, error: friendlyError(e) };
  }
}
