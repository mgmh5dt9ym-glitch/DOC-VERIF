import { notFound } from "next/navigation";
import { getPublicImageUrl } from "@/lib/documents";
import { getVerificationBranding } from "@/lib/branding";

export const dynamic = "force-dynamic";

export async function generateMetadata() {
  return { title: "Document", robots: { index: false, follow: false } };
}

export default async function VerifyPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const [imageUrl, branding] = await Promise.all([
    getPublicImageUrl(code.toUpperCase()),
    getVerificationBranding(),
  ]);

  if (!imageUrl) notFound();

  return (
    <main className="verification-page">
      <div className="verification-shell">
        <div className="verification-header-slot">
          {branding.header_url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={branding.header_url}
              alt=""
              className="verification-header-image"
              decoding="async"
            />
          )}
        </div>

        <section className="verification-card">
          <div className="verification-green-zone">
            {branding.logo_url && (
              <div className="verification-logo-wrap">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={branding.logo_url}
                  alt="Logo"
                  className="verification-logo"
                  decoding="async"
                />
              </div>
            )}

            {branding.status_text && (
              <p className="verification-status">{branding.status_text}</p>
            )}
          </div>

          <div className="verification-document-zone">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={imageUrl}
              alt="Document"
              decoding="async"
              className="verification-document"
            />
          </div>
        </section>
      </div>
    </main>
  );
}
