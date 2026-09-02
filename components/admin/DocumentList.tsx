"use client";

import type { AdminDocument } from "@/types/document";
import { DocumentCard } from "@/components/admin/DocumentCard";

export function DocumentList({ documents }: { documents: AdminDocument[] }) {
  if (documents.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-line px-5 py-10 text-center text-sm text-ink-soft">
        Ajoutez un premier document ci-dessus pour obtenir son lien et son QR code.
      </p>
    );
  }

  return (
    <ul className="space-y-4">
      {documents.map((doc) => (
        <li key={doc.id}>
          <DocumentCard doc={doc} />
        </li>
      ))}
    </ul>
  );
}
