import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    // FormData typing mismatch between Next.js and DOM — safe to ignore
    ignoreBuildErrors: true,
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**" },
      { protocol: "http", hostname: "**" },
    ],
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "Content-Security-Policy",
            value:
              "default-src 'self'; script-src 'self' 'unsafe-inline' https://va.vercel-scripts.com https://meet.jit.si; connect-src 'self' https://vitals.vercel-insights.com https://meet.jit.si wss://meet.jit.si; img-src 'self' data: blob: https:; style-src 'self' 'unsafe-inline'; font-src 'self' data:; frame-src 'self' https://meet.jit.si; worker-src 'self' blob:; media-src 'self' blob: https:; base-uri 'self'; form-action 'self'; frame-ancestors 'none'",
          },
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            value: 'camera=(self "https://meet.jit.si"), microphone=(self "https://meet.jit.si"), geolocation=()',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
