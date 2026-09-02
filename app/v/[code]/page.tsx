import { notFound } from "next/navigation";
import { getPublicImageUrl } from "@/lib/documents";

export const dynamic = "force-dynamic";

export async function generateMetadata() {
  return { title: "Document", robots: { index: false, follow: false } };
}

/**
 * Page publique : affiche uniquement l'image du document.
 * Aucune métadonnée, aucun texte, aucun bouton.
 */
export default async function VerifyPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const imageUrl = await getPublicImageUrl(code.toUpperCase());

  if (!imageUrl) notFound();

  return (
    <main className="flex min-h-screen w-full items-start justify-center bg-canvas px-2 py-3 sm:px-6 sm:py-8">
      {/*
        <img> classique volontairement : l'image est servie telle quelle,
        sans recompression, pour garder le texte du document net.
      */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={imageUrl}
        alt="Document"
        decoding="async"
        className="h-auto w-full max-w-4xl bg-white shadow-sm"
      />
    </main>
  );
}
