import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Dev-only: allow phone smoke tests over the LAN IP. Without this Next
  // blocks cross-origin dev requests (/__nextjs internals, HMR websocket)
  // from non-localhost hosts. No effect in production builds.
  allowedDevOrigins: ["192.168.*.*", "10.*.*.*"],
};

export default nextConfig;
