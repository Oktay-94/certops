import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Dev-only: allow phone smoke tests over the LAN IP. Without this Next
  // blocks cross-origin dev requests (/__nextjs internals, HMR websocket)
  // from non-localhost hosts. No effect in production builds.
  allowedDevOrigins: ["192.168.*.*", "10.*.*.*"],

  // Legacy root routes → /clf/* (307, deliberately not permanent until the
  // exam-track split has settled). Skript/services/uebersicht exist only
  // under /clf — the [exam] pages guard the /saa variants with notFound.
  async redirects() {
    const legacy = [
      "quiz",
      "cards",
      "stats",
      "skript",
      "services",
      "uebersicht",
    ];
    return [
      { source: "/", destination: "/clf", permanent: false },
      ...legacy.flatMap((seg) => [
        {
          source: `/${seg}`,
          destination: `/clf/${seg}`,
          permanent: false,
        },
        {
          source: `/${seg}/:path*`,
          destination: `/clf/${seg}/:path*`,
          permanent: false,
        },
      ]),
    ];
  },
};

export default nextConfig;
