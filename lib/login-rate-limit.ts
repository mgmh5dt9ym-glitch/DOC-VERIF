import "server-only";

/**
 * Limitation des tentatives de connexion, en mémoire par adresse IP.
 * - après MAX_FAILURES échecs dans WINDOW_MS : blocage LOCKOUT_MS ;
 * - chaque échec ajoute un petit délai progressif.
 *
 * Sur Vercel (serverless), la mémoire n'est pas partagée entre instances :
 * c'est une protection "best effort" qui ralentit fortement le brute force
 * sans dépendre d'un service externe.
 */

const MAX_FAILURES = 5;
const WINDOW_MS = 15 * 60 * 1000;
const LOCKOUT_MS = 15 * 60 * 1000;

type Entry = { failures: number; firstFailureAt: number; lockedUntil: number };
const attempts = new Map<string, Entry>();

function cleanup(now: number) {
  if (attempts.size < 1000) return;
  for (const [key, e] of attempts) {
    if (e.lockedUntil < now && now - e.firstFailureAt > WINDOW_MS) attempts.delete(key);
  }
}

/** Retourne le nombre de secondes restantes si l'IP est bloquée, sinon 0. */
export function getLockoutSeconds(ip: string): number {
  const e = attempts.get(ip);
  if (!e) return 0;
  const now = Date.now();
  if (e.lockedUntil > now) return Math.ceil((e.lockedUntil - now) / 1000);
  return 0;
}

/** Enregistre un échec et renvoie le délai (ms) à attendre avant de répondre. */
export function registerFailure(ip: string): number {
  const now = Date.now();
  cleanup(now);
  let e = attempts.get(ip);
  if (!e || now - e.firstFailureAt > WINDOW_MS) {
    e = { failures: 0, firstFailureAt: now, lockedUntil: 0 };
  }
  e.failures += 1;
  if (e.failures >= MAX_FAILURES) e.lockedUntil = now + LOCKOUT_MS;
  attempts.set(ip, e);
  // 500 ms, 1 s, 1,5 s… plafonné à 3 s
  return Math.min(e.failures * 500, 3000);
}

export function registerSuccess(ip: string): void {
  attempts.delete(ip);
}
