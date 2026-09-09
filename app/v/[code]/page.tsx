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
    <main className="min-h-dvh bg-[#fbf3f1] px-0 py-0 sm:px-6 sm:py-6">
      <div className="mx-auto w-full max-w-5xl">
        {branding.header_url && (
          <div className="overflow-hidden bg-white sm:mb-4 sm:rounded-md sm:border sm:border-[#efc9c3]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={branding.header_url}
              alt=""
              className="block h-auto max-h-28 w-full object-cover sm:max-h-40"
              decoding="async"
            />
          </div>
        )}

        <section className="overflow-hidden bg-white sm:rounded-lg sm:border sm:border-[#d9dedb] sm:shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
          <div className="relative flex min-h-40 flex-col items-center justify-end overflow-hidden bg-gradient-to-r from-[#48d397] via-[#35bd7b] to-[#249c61] px-4 pb-4 pt-3 sm:min-h-56 sm:px-5 sm:pb-5 sm:pt-4">
            {branding.logo_url && (
              <div className="absolute left-1/2 top-2 flex h-24 w-24 -translate-x-1/2 items-center justify-center overflow-hidden sm:h-36 sm:w-36">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={branding.logo_url}
                  alt="Logo"
                  className="max-h-full max-w-full object-contain"
                  decoding="async"
                />
              </div>
            )}

            <p className="relative z-10 max-w-full text-center text-lg font-semibold tracking-tight text-white sm:text-2xl">
              {branding.status_text}
            </p>
          </div>

          <div className="flex justify-center bg-white px-0 py-0 sm:px-8 sm:py-8">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={imageUrl}
              alt="Document"
              decoding="async"
              className="block h-auto w-full max-w-3xl object-contain"
            />
          </div>
        </section>
      </div>
    </main>
  );
}
