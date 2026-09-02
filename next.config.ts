import type { NextConfig } from "next";

const supabaseHost = (() => {
  try {
    return process.env.NEXT_PUBLIC_SUPABASE_URL
      ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname
      : "*.supabase.co";
  } catch {
    return "*.supabase.co";
  }
})();

const nextConfig: NextConfig = {
  // Autorise next/image sur Supabase Storage si vous choisissez de l'utiliser.
  // La page publique utilise un <img> classique pour conserver la qualité
  // originale du document (aucune recompression).
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: supabaseHost,
        pathname: "/storage/v1/object/**",
      },
    ],
  },
  experimental: {
    serverActions: {
      // Upload de 15 MB max (marge incluse pour l'encodage multipart).
      bodySizeLimit: "20mb",
    },
  },
};

export default nextConfig;
