import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Vérification de document",
  description: "Vérification de documents par QR code",
  robots: { index: false, follow: false },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fr" className="h-full">
      <body className="min-h-full">{children}</body>
    </html>
  );
}
