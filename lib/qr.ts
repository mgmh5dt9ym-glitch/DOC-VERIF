import QRCode from "qrcode";

const OPTIONS = {
  errorCorrectionLevel: "M" as const, // bonne tolérance à l'impression
  margin: 2,
  color: {
    dark: "#000000ff",
    light: "#00000000", // fond transparent
  },
};

/** Aperçu (petit) pour l'interface admin. */
export async function qrPreviewDataUrl(url: string): Promise<string> {
  return QRCode.toDataURL(url, { ...OPTIONS, width: 240 });
}

/** PNG 1000×1000 avec fond transparent, prêt à imprimer. */
export async function qrDownloadDataUrl(url: string): Promise<string> {
  return QRCode.toDataURL(url, { ...OPTIONS, width: 1000, type: "image/png" });
}
