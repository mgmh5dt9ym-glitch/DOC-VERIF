"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { uploadDocumentAction } from "@/app/admin/actions";
import { ACCEPT_ATTRIBUTE, checkFileBasics } from "@/lib/validation";
import { Button, ErrorText } from "@/components/admin/ui";
import type { ActionResult } from "@/types/document";

export function UploadForm() {
  const [preview, setPreview] = useState<string | null>(null);
  const [clientError, setClientError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const [state, action, pending] = useActionState(
    async (prev: ActionResult | null, formData: FormData) => {
      const result = await uploadDocumentAction(prev, formData);
      if (result.ok) {
        // Réinitialise le formulaire après un envoi réussi.
        setPreview(null);
        setFileName(null);
        if (inputRef.current) inputRef.current.value = "";
      }
      return result;
    },
    null,
  );

  // Libère l'URL de prévisualisation quand elle change.
  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    setClientError(null);
    setPreview(null);
    setFileName(null);
    if (!file) return;

    const check = checkFileBasics(file);
    if (!check.ok) {
      setClientError(check.error);
      e.target.value = "";
      return;
    }
    setFileName(file.name);
    setPreview(URL.createObjectURL(file));
  }

  return (
    <form action={action} className="rounded-lg border border-line bg-white p-5">
      <div className="flex flex-col gap-5 sm:flex-row">
        <div className="flex-1">
          <h2 className="font-medium">Ajouter un document</h2>
          <p className="mt-1 text-sm text-ink-soft">
            JPEG, PNG ou WEBP, 15 MB maximum. Un lien public et un QR code
            seront créés automatiquement.
          </p>

          <label className="mt-4 block">
            <span className="sr-only">Fichier image</span>
            <input
              ref={inputRef}
              name="file"
              type="file"
              accept={ACCEPT_ATTRIBUTE}
              required
              onChange={onFileChange}
              className="block w-full text-sm text-ink-soft file:mr-3 file:rounded-md file:border file:border-line file:bg-white file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-ink hover:file:border-ink-soft"
            />
          </label>

          <div className="mt-4 flex items-center gap-3">
            <Button type="submit" variant="primary" disabled={pending || !preview || !!clientError}>
              {pending ? "Envoi en cours…" : "Enregistrer le document"}
            </Button>
            {state?.ok && !pending && (
              <span className="text-sm text-ink-soft">{state.message}</span>
            )}
          </div>

          <div className="mt-3 space-y-2">
            {clientError && <ErrorText>{clientError}</ErrorText>}
            {state && !state.ok && <ErrorText>{state.error}</ErrorText>}
          </div>
        </div>

        <div className="flex w-full shrink-0 items-center justify-center rounded-md border border-dashed border-line bg-canvas sm:w-56">
          {preview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={preview}
              alt={fileName ?? "Aperçu"}
              className="max-h-64 w-auto max-w-full object-contain p-2"
            />
          ) : (
            <span className="px-4 py-12 text-center text-xs text-ink-soft">
              L’aperçu apparaît ici avant l’envoi.
            </span>
          )}
        </div>
      </div>
    </form>
  );
}
