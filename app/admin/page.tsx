import { requireAdmin } from "@/lib/admin-auth";
import { listDocumentsForAdmin } from "@/lib/documents";
import { getBrandingForAdmin } from "@/lib/branding";
import { logoutAction } from "@/app/admin/actions";
import { UploadForm } from "@/components/admin/UploadForm";
import { DocumentList } from "@/components/admin/DocumentList";
import { BrandingForm } from "@/components/admin/BrandingForm";
import type { AdminDocument } from "@/types/document";

export const metadata = { title: "Documents — Admin" };
export const dynamic = "force-dynamic";

export default async function AdminPage() {
  await requireAdmin();

  let documents: AdminDocument[] = [];
  let loadError: string | null = null;
  let branding = {
    header_url: null as string | null,
    logo_url: null as string | null,
    status_text: "FIRMADO - VIGENTE",
  };

  try {
    [documents, branding] = await Promise.all([
      listDocumentsForAdmin(),
      getBrandingForAdmin(),
    ]);
  } catch (e) {
    loadError = e instanceof Error ? e.message : "Connexion à Supabase impossible.";
  }

  return (
    <main className="mx-auto w-full max-w-5xl px-3 pb-8 pt-4 sm:px-8 sm:py-8">
      <header className="flex items-start justify-between gap-3 border-b border-line pb-4 sm:items-center sm:gap-4 sm:pb-5">
        <div className="min-w-0">
          <h1 className="text-lg font-semibold leading-tight sm:text-xl">Documents vérifiables</h1>
          <p className="mt-1 text-xs text-ink-soft sm:text-sm">
            {documents.length === 0
              ? "Aucun document pour l’instant."
              : `${documents.length} document${documents.length > 1 ? "s" : ""}`}
          </p>
        </div>
        <form action={logoutAction} className="shrink-0">
          <button
            type="submit"
            className="min-h-10 rounded-md px-3 py-2 text-sm text-ink-soft transition-colors hover:bg-white hover:text-ink focus-visible:outline-2 focus-visible:outline-accent"
          >
            Déconnexion
          </button>
        </form>
      </header>

      <section className="mt-5 sm:mt-8">
        <BrandingForm branding={branding} />
      </section>

      <section className="mt-5 sm:mt-8">
        <UploadForm />
      </section>

      <section className="mt-7 sm:mt-10">
        {loadError ? (
          <p className="rounded-md border border-danger/30 bg-red-50 px-4 py-3 text-sm text-danger">
            Impossible de charger la liste : {loadError}
          </p>
        ) : (
          <DocumentList documents={documents} />
        )}
      </section>
    </main>
  );
}
