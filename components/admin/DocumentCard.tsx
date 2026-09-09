"use client";

import { useActionState, useEffect, useRef, useState, useTransition } from "react";
import { deleteDocumentAction, replaceImageAction } from "@/app/admin/actions";
import { qrDownloadDataUrl, qrPreviewDataUrl } from "@/lib/qr";
import { buildPublicUrl } from "@/lib/site";
import { ACCEPT_ATTRIBUTE, checkFileBasics } from "@/lib/validation";
import { Button, ErrorText } from "@/components/admin/ui";
import type { AdminDocument } from "@/types/document";

export function DocumentCard({ doc }: { doc: AdminDocument }) {
  const [publicUrl, setPublicUrl] = useState(doc.public_url);
  const [qrPreview, setQrPreview] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [replaceState, replaceAction, replacing] = useActionState(replaceImageAction, null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [replaceClientError, setReplaceClientError] = useState<string | null>(null);
  const [deleting, startDelete] = useTransition();
  const replaceInputRef = useRef<HTMLInputElement>(null);
  const replaceFormRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    let cancelled = false;
    const currentPublicUrl = buildPublicUrl(doc.verification_code);
    setPublicUrl(currentPublicUrl);

    qrPreviewDataUrl(currentPublicUrl).then((url) => {
      if (!cancelled) setQrPreview(url);
    });

    return () => {
      cancelled = true;
    };
  }, [doc.verification_code]);

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(publicUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      window.prompt("Copiez le lien :", publicUrl);
    }
  }

  async function downloadQr() {
    const dataUrl = await qrDownloadDataUrl(publicUrl);
    const a = document.createElement("a");
    a.href = dataUrl;
    a.download = `qr-${doc.verification_code}.png`;
    document.body.appendChild(a);
    a.click();
    a.remove();
  }

  function onReplaceFileChosen(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    setReplaceClientError(null);
    if (!file) return;
    const check = checkFileBasics(file);
    if (!check.ok) {
      setReplaceClientError(check.error);
      e.target.value = "";
      return;
    }
    replaceFormRef.current?.requestSubmit();
  }

  function onDelete() {
    if (!window.confirm("Supprimer ce document ? Le lien public et le QR code cesseront de fonctionner.")) return;
    setDeleteError(null);
    startDelete(async () => {
      const result = await deleteDocumentAction(doc.id);
      if (!result.ok) setDeleteError(result.error);
    });
  }

  return (
    <article className="overflow-hidden rounded-xl border border-line bg-white shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-stretch">
        <a
          href={publicUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex h-56 w-full shrink-0 items-center justify-center overflow-hidden border-b border-line bg-canvas sm:h-auto sm:min-h-52 sm:w-44 sm:border-b-0 sm:border-r"
          title="Ouvrir la page publique"
        >
          {doc.thumbnail_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={doc.thumbnail_url} alt="" className="h-full w-full object-contain p-2" loading="lazy" />
          ) : (
            <span className="text-xs text-ink-soft">Aperçu indisponible</span>
          )}
        </a>

        <div className="min-w-0 flex-1 p-4 sm:p-5">
          <div className="flex items-start gap-3">
            <div className="min-w-0 flex-1">
              <a
                href={publicUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="block break-all text-sm font-medium leading-5 text-accent hover:underline sm:text-base"
              >
                {publicUrl}
              </a>
              <p className="mt-1 text-xs text-ink-soft">Code {doc.verification_code}</p>
            </div>

            <div className="hidden h-24 w-24 shrink-0 items-center justify-center rounded-lg border border-line bg-white p-1.5 sm:flex">
              {qrPreview ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={qrPreview} alt={`QR code ${doc.verification_code}`} className="h-full w-full" />
              ) : (
                <span className="text-xs text-ink-soft">QR…</span>
              )}
            </div>
          </div>

          <div className="mt-4 flex justify-center sm:hidden">
            <div className="flex h-36 w-36 items-center justify-center rounded-xl border border-line bg-white p-2 shadow-sm">
              {qrPreview ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={qrPreview} alt={`QR code ${doc.verification_code}`} className="h-full w-full" />
              ) : (
                <span className="text-xs text-ink-soft">QR…</span>
              )}
            </div>
          </div>

          <div className="mt-5 grid grid-cols-1 gap-2 sm:flex sm:flex-wrap">
            <Button onClick={copyLink} className="w-full sm:w-auto">{copied ? "Lien copié" : "Copier le lien"}</Button>
            <Button onClick={downloadQr} className="w-full sm:w-auto">Télécharger le QR</Button>
            <Button onClick={() => replaceInputRef.current?.click()} disabled={replacing} className="w-full sm:w-auto">
              {replacing ? "Remplacement…" : "Remplacer l’image"}
            </Button>
            <Button variant="danger" onClick={onDelete} disabled={deleting} className="w-full sm:w-auto">
              {deleting ? "Suppression…" : "Supprimer"}
            </Button>
          </div>

          <form ref={replaceFormRef} action={replaceAction} className="hidden">
            <input type="hidden" name="id" value={doc.id} />
            <input ref={replaceInputRef} type="file" name="file" accept={ACCEPT_ATTRIBUTE} onChange={onReplaceFileChosen} />
          </form>

          <div className="mt-3 space-y-2">
            {replaceClientError && <ErrorText>{replaceClientError}</ErrorText>}
            {replaceState && !replaceState.ok && <ErrorText>{replaceState.error}</ErrorText>}
            {replaceState?.ok && !replacing && <p className="text-sm text-ink-soft">{replaceState.message}</p>}
            {deleteError && <ErrorText>{deleteError}</ErrorText>}
          </div>
        </div>
      </div>
    </article>
  );
}
