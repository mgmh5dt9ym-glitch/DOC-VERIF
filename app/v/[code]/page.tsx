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
    <main className="min-h-screen bg-[#fbf3f1] px-3 py-3 sm:px-6 sm:py-6">
      <div className="mx-auto w-full max-w-5xl">
        {branding.header_url && (
          <div className="mb-4 overflow-hidden rounded-sm border border-[#efc9c3] bg-white">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={branding.header_url}
              alt=""
              className="block h-auto max-h-40 w-full object-cover"
              decoding="async"
            />
          </div>
        )}

        <section className="overflow-hidden rounded-md border border-[#d9dedb] bg-white shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
          <div className="relative flex min-h-52 flex-col items-center justify-end overflow-hidden bg-gradient-to-r from-[#48d397] via-[#35bd7b] to-[#249c61] px-5 pb-5 pt-4 sm:min-h-56">
            {branding.logo_url && (
              <div className="absolute left-1/2 top-2 flex h-32 w-32 -translate-x-1/2 items-center justify-center overflow-hidden bg-white/0 sm:h-36 sm:w-36">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={branding.logo_url}
                  alt="Logo"
                  className="max-h-full max-w-full object-contain"
                  decoding="async"
                />
              </div>
            )}

            <p className="relative z-10 text-center text-xl font-medium tracking-tight text-white sm:text-2xl">
              {branding.status_text}
            </p>
          </div>

          <div className="flex justify-center bg-white px-3 py-6 sm:px-8 sm:py-8">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={imageUrl}
              alt="Document"
              decoding="async"
              className="h-auto w-full max-w-3xl object-contain"
            />
          </div>
        </section>
      </div>
    </main>
  );
}
