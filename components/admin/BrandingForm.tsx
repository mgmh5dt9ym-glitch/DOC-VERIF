"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { updateBrandingAction } from "@/app/admin/actions";
import { ACCEPT_ATTRIBUTE, checkFileBasics } from "@/lib/validation";
import { Button, ErrorText } from "@/components/admin/ui";
import type { VerificationBranding } from "@/lib/branding";

export function BrandingForm({ branding }: { branding: VerificationBranding }) {
  const [state, action, pending] = useActionState(updateBrandingAction, null);
  const [clientError, setClientError] = useState<string | null>(null);
  const [headerPreview, setHeaderPreview] = useState<string | null>(branding.header_url);
  const [logoPreview, setLogoPreview] = useState<string | null>(branding.logo_url);
  const previewUrls = useRef<string[]>([]);

  useEffect(() => {
    return () => previewUrls.current.forEach((url) => URL.revokeObjectURL(url));
  }, []);

  function previewFile(file: File, type: "header" | "logo") {
    const check = checkFileBasics(file);
    if (!check.ok) {
      setClientError(check.error);
      return;
    }

    setClientError(null);
    const url = URL.createObjectURL(file);
    previewUrls.current.push(url);
    if (type === "header") setHeaderPreview(url);
    else setLogoPreview(url);
  }

  return (
    <form action={action} className="rounded-lg border border-line bg-white p-5">
      <div className="flex flex-col gap-1">
        <h2 className="text-lg font-semibold">Identité de la page de vérification</h2>
        <p className="text-sm text-ink-soft">
          Téléverse la barre header et le logo qui apparaîtront sur toutes les pages publiques de vérification.
        </p>
      </div>

      <div className="mt-5 grid gap-5 md:grid-cols-2">
        <label className="block">
          <span className="mb-2 block text-sm font-medium">Barre header</span>
          <input
            type="file"
            name="header"
            accept={ACCEPT_ATTRIBUTE}
            className="block w-full text-sm text-ink-soft file:mr-3 file:rounded-md file:border file:border-line file:bg-white file:px-3 file:py-2 file:text-sm file:font-medium file:text-ink"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) previewFile(file, "header");
            }}
          />
          <div className="mt-3 flex h-24 items-center justify-center overflow-hidden rounded-md border border-dashed border-line bg-canvas">
            {headerPreview ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={headerPreview} alt="Aperçu du header" className="h-full w-full object-cover" />
            ) : (
              <span className="text-xs text-ink-soft">Aucun header</span>
            )}
          </div>
        </label>

        <label className="block">
          <span className="mb-2 block text-sm font-medium">Logo</span>
          <input
            type="file"
            name="logo"
            accept={ACCEPT_ATTRIBUTE}
            className="block w-full text-sm text-ink-soft file:mr-3 file:rounded-md file:border file:border-line file:bg-white file:px-3 file:py-2 file:text-sm file:font-medium file:text-ink"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) previewFile(file, "logo");
            }}
          />
          <div className="mt-3 flex h-24 items-center justify-center overflow-hidden rounded-md border border-dashed border-line bg-canvas">
            {logoPreview ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logoPreview} alt="Aperçu du logo" className="h-20 w-20 object-contain" />
            ) : (
              <span className="text-xs text-ink-soft">Aucun logo</span>
            )}
          </div>
        </label>
      </div>

      <label className="mt-5 block max-w-md">
        <span className="mb-2 block text-sm font-medium">Texte de statut</span>
        <input
          name="status_text"
          type="text"
          defaultValue={branding.status_text || "FIRMADO - VIGENTE"}
          maxLength={80}
          className="w-full rounded-md border border-line bg-white px-3 py-2 text-sm outline-none focus:border-accent"
        />
      </label>

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <Button type="submit" variant="primary" disabled={pending}>
          {pending ? "Enregistrement…" : "Enregistrer l’apparence"}
        </Button>
        {state?.ok && <p className="text-sm text-ink-soft">{state.message}</p>}
      </div>

      <div className="mt-3 space-y-2">
        {clientError && <ErrorText>{clientError}</ErrorText>}
        {state && !state.ok && <ErrorText>{state.error}</ErrorText>}
      </div>
    </form>
  );
}
