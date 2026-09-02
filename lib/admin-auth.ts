import "server-only";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createHash, timingSafeEqual } from "node:crypto";
import { createSessionToken, verifySessionToken, SESSION_COOKIE_NAME } from "@/lib/admin-session-token";

export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7; // 7 jours

function getSessionSecret(): string {
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!secret || secret.length < 16) {
    throw new Error("ADMIN_SESSION_SECRET manquant ou trop court (16 caractères minimum).");
  }
  return secret;
}

function getAdminPassword(): string {
  const password = process.env.ADMIN_PASSWORD;
  if (!password) throw new Error("ADMIN_PASSWORD manquant.");
  return password;
}

/**
 * Compare le mot de passe fourni avec ADMIN_PASSWORD en temps constant.
 * Les deux valeurs sont hachées d'abord pour que la comparaison ne dépende
 * pas de la longueur du mot de passe.
 */
export function checkAdminPassword(candidate: string): boolean {
  const a = createHash("sha256").update(candidate, "utf8").digest();
  const b = createHash("sha256").update(getAdminPassword(), "utf8").digest();
  return timingSafeEqual(a, b);
}

/** Crée un jeton signé et le dépose dans un cookie HTTP-only. */
export async function createAdminSession(): Promise<void> {
  const token = await createSessionToken(getSessionSecret(), SESSION_MAX_AGE_SECONDS);
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  });
}

/** Vrai si le cookie de session est présent, signé et non expiré. */
export async function verifyAdminSession(): Promise<boolean> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return false;
  try {
    return await verifySessionToken(token, getSessionSecret());
  } catch {
    return false;
  }
}

/** Supprime le cookie de session. */
export async function destroyAdminSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}

/**
 * À appeler en tête de chaque page et Server Action admin.
 * Redirige vers /admin/login si la session est invalide.
 */
export async function requireAdmin(): Promise<void> {
  if (!(await verifyAdminSession())) {
    redirect("/admin/login");
  }
}
