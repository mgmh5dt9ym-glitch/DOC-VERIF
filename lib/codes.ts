import { randomBytes } from "node:crypto";

/**
 * Alphabet sans caractères ambigus (pas de 0/O, 1/I/L).
 * 32 symboles × 10 caractères ≈ 2^50 combinaisons : impossible à deviner.
 */
const ALPHABET = "23456789ABCDEFGHJKMNPQRSTUVWXYZ";
export const CODE_LENGTH = 10;

export function generateVerificationCode(length = CODE_LENGTH): string {
  const bytes = randomBytes(length);
  let out = "";
  for (let i = 0; i < length; i++) {
    out += ALPHABET[bytes[i] % ALPHABET.length];
  }
  return out;
}

/** Validation stricte du code reçu depuis l'URL publique (anti-injection). */
export function isValidVerificationCode(code: unknown): code is string {
  return (
    typeof code === "string" &&
    code.length >= 6 &&
    code.length <= 32 &&
    /^[A-Z0-9]+$/.test(code)
  );
}
