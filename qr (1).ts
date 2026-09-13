import QRCode from "qrcode";

const PUBLIC_SITE_ORIGIN = "https://docverif.vercel.app";

const OPTIONS = {
  errorCorrectionLevel: "M" as const,
  margin: 2,
  color: {
    dark: "#000000ff",
    light: "#00000000",
  },
};

/**
 * Sécurise systématiquement l'URL encodée dans le QR.
 *
 * Accepte par exemple :
 * - T4Q5X6RTY2
 * - https://docverif.vercel.app/v/T4Q5X6RTY2
 * - https://docverif.vercel.app/admin/login/v/T4Q5X6RTY2
 *
 * et retourne toujours :
 * https://docverif.vercel.app/v/T4Q5X6RTY2
 */
function normalizeVerificationUrl(input: string): string {
  const raw = String(input ?? "").trim();

  if (!raw) {
    throw new Error("Code de vérification manquant.");
  }

  let code = raw;

  try {
    const parsed = new URL(raw);
    const segments = parsed.pathname
      .split("/")
      .map((segment) => segment.trim())
      .filter(Boolean);

    const vIndex = segments.lastIndexOf("v");

    if (vIndex >= 0 && segments[vIndex + 1]) {
      code = segments[vIndex + 1];
    } else if (segments.length > 0) {
      code = segments[segments.length - 1];
    }
  } catch {
    const segments = raw
      .split("/")
      .map((segment) => segment.trim())
      .filter(Boolean);

    if (segments.length > 0) {
      code = segments[segments.length - 1];
    }
  }

  code = decodeURIComponent(code)
    .replace(/[^A-Za-z0-9_-]/g, "")
    .trim();

  if (!code) {
    throw new Error("Code de vérification invalide.");
  }

  return `${PUBLIC_SITE_ORIGIN}/v/${encodeURIComponent(code)}`;
}

/** Aperçu QR pour l'interface admin. */
export async function qrPreviewDataUrl(
  value: string,
): Promise<string> {
  const publicUrl = normalizeVerificationUrl(value);

  return QRCode.toDataURL(publicUrl, {
    ...OPTIONS,
    width: 240,
  });
}

/** PNG 1000 × 1000, fond transparent, prêt à imprimer. */
export async function qrDownloadDataUrl(
  value: string,
): Promise<string> {
  const publicUrl = normalizeVerificationUrl(value);

  return QRCode.toDataURL(publicUrl, {
    ...OPTIONS,
    width: 1000,
    type: "image/png",
  });
}
