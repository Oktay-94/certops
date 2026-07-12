import type { Metadata, Viewport } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import { BRAND_ORANGE } from "@/lib/brand";
import "./globals.css";

export const metadata: Metadata = {
  title: "CertOps",
  description: "Lern-App für AWS-Zertifizierungen (CLF-C02, SAA-C03).",
  // Apple ignores the manifest for icons → needs its own touch icon.
  appleWebApp: { capable: true, statusBarStyle: "default", title: "CertOps" },
  icons: { apple: "/apple-icon-180.png" },
};

// themeColor belongs in viewport (metadata.themeColor deprecated since Next 14).
// No colorScheme pin anymore — globals.css sets color-scheme per data-theme.
export const viewport: Viewport = {
  themeColor: BRAND_ORANGE,
};

// No-flash theme init. MUST stay a static inline script (never cookies() from
// next/headers here): a server-side cookie read in the root layout would flip
// every SSG route to dynamic rendering. Light is the default; dark only via
// explicit cookie (no prefers-color-scheme until the re-skin lands — DESIGN.md).
const THEME_INIT_SCRIPT = `try{if(document.cookie.split("; ").includes("certops_theme=dark"))document.documentElement.dataset.theme="dark"}catch(e){}`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      data-exam="clf"
      suppressHydrationWarning
      className={`${GeistSans.variable} ${GeistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
        {children}
      </body>
    </html>
  );
}
