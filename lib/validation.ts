export const MAX_FILE_SIZE = 15 * 1024 * 1024; // 15 MB

export const ALLOWED_MIME_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

export const ACCEPT_ATTRIBUTE = "image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp";

export type FileCheck =
  | { ok: true; extension: string; mime: string }
  | { ok: false; error: string };

/** Vérifie la taille et le type déclaré (utilisable côté client et serveur). */
export function checkFileBasics(file: { size: number; type: string; name: string }): FileCheck {
  if (file.size === 0) {
    return { ok: false, error: "Le fichier est vide." };
  }
  if (file.size > MAX_FILE_SIZE) {
    return {
      ok: false,
      error: `Fichier trop volumineux (${(file.size / 1024 / 1024).toFixed(1)} MB). Maximum : 15 MB.`,
    };
  }
  const extension = ALLOWED_MIME_TYPES[file.type];
  if (!extension) {
    return {
      ok: false,
      error: "Format non pris en charge. Utilisez un fichier JPEG, JPG, PNG ou WEBP.",
    };
  }
  return { ok: true, extension, mime: file.type };
}

/**
 * Côté serveur : vérifie la signature binaire (magic bytes) pour empêcher
 * l'envoi d'un fichier arbitraire renommé en .jpg.
 */
export function sniffImageType(bytes: Uint8Array): "image/jpeg" | "image/png" | "image/webp" | null {
  if (bytes.length < 12) return null;
  // JPEG : FF D8 FF
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return "image/jpeg";
  // PNG : 89 50 4E 47 0D 0A 1A 0A
  if (
    bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47 &&
    bytes[4] === 0x0d && bytes[5] === 0x0a && bytes[6] === 0x1a && bytes[7] === 0x0a
  ) return "image/png";
  // WEBP : "RIFF" .... "WEBP"
  if (
    bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46 &&
    bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50
  ) return "image/webp";
  return null;
}
