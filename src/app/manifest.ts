import type { MetadataRoute } from "next";
import { BRAND_ORANGE } from "@/lib/brand";

// Web App Manifest — Next serves this as /manifest.webmanifest and injects the
// <link rel="manifest"> automatically; no manual <link> in the layout needed.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "CertOps",
    short_name: "CertOps",
    description: "Lern-App für AWS-Zertifizierungen (CLF-C02, SAA-C03).",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: BRAND_ORANGE,
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icon-maskable.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
