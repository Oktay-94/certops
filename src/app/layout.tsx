import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { BRAND_ORANGE } from "@/lib/brand";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "CertOps",
  description: "Lern-App für AWS-Zertifizierungen (CLF-C02, SAA-C03).",
  // Apple ignores the manifest for icons → needs its own touch icon.
  appleWebApp: { capable: true, statusBarStyle: "default", title: "CertOps" },
  icons: { apple: "/apple-icon-180.png" },
};

// themeColor belongs in viewport (metadata.themeColor deprecated since Next 14).
export const viewport: Viewport = {
  themeColor: BRAND_ORANGE,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
