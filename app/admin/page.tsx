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
    <main className="mx-auto w-full max-w-5xl px-5 py-8 sm:px-8">
      <header className="flex items-center justify-between gap-4 border-b border-line pb-5">
        <div>
          <h1 className="text-xl font-semibold">Documents vérifiables</h1>
          <p className="mt-0.5 text-sm text-ink-soft">
            {documents.length === 0
              ? "Aucun document pour l’instant."
              : `${documents.length} document${documents.length > 1 ? "s" : ""}`}
          </p>
        </div>
        <form action={logoutAction}>
          <button
            type="submit"
            className="rounded-md px-3 py-1.5 text-sm text-ink-soft transition-colors hover:bg-white hover:text-ink focus-visible:outline-2 focus-visible:outline-accent"
          >
            Déconnexion
          </button>
        </form>
      </header>

      <section className="mt-8">
        <BrandingForm branding={branding} />
      </section>

      <section className="mt-8">
        <UploadForm />
      </section>

      <section className="mt-10">
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
