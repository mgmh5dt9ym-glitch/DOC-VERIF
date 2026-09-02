import QRCode from "qrcode";
import { buildPublicUrl } from "@/lib/site";

const OPTIONS = {
  errorCorrectionLevel: "M" as const,
  margin: 2,
  color: {
    dark: "#000000ff",
    light: "#00000000",
  },
};

function extractVerificationCode(input: string): string {
  const raw = String(input ?? "").trim();

  if (!raw) {
    throw new Error("Code de vérification manquant.");
  }

  let code = raw;

  try {
    const parsed = new URL(raw);

    const parts = parsed.pathname
      .split("/")
      .filter(Boolean);

    const vIndex = parts.lastIndexOf("v");

    if (vIndex >= 0 && parts[vIndex + 1]) {
      code = parts[vIndex + 1];
    } else if (parts.length > 0) {
      code = parts[parts.length - 1];
    }
  } catch {
    const parts = raw
      .split("/")
      .filter(Boolean);

    if (parts.length > 0) {
      code = parts[parts.length - 1];
    }
  }

  code = decodeURIComponent(code)
    .replace(/[^A-Za-z0-9_-]/g, "")
    .trim();

  if (!code) {
    throw new Error("Code de vérification invalide.");
  }

  return code;
}

export async function qrPreviewDataUrl(
  value: string,
): Promise<string> {
  const code = extractVerificationCode(value);
  const url = buildPublicUrl(code);

  return QRCode.toDataURL(url, {
    ...OPTIONS,
    width: 240,
  });
}

export async function qrDownloadDataUrl(
  value: string,
): Promise<string> {
  const code = extractVerificationCode(value);
  const url = buildPublicUrl(code);

  return QRCode.toDataURL(url, {
    ...OPTIONS,
    width: 1000,
    type: "image/png",
  });
}
