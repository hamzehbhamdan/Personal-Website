import type { NextConfig } from "next";

// Content-Security-Policy for the dashboard shell. Enforcing (see Task 18):
// live-verified as Report-Only against a production build (dashboard, login,
// command palette, /api/ai, Supabase search) with zero violations before flipping.
// Origins: self by default; 'unsafe-inline' scripts for Next.js hydration/RSC (no nonce
// infra) and Plausible; 'unsafe-inline' styles for the Task 3 primitives' style={...};
// Plausible analytics (script + beacon); Supabase browser/auth client (connect);
// data:/blob:/https: images for avatars; self-hosted next/font.
// Dev-only: React/Next dev tooling uses eval() for debugging features (never in
// production — Netlify builds with NODE_ENV=production, which stays strict); allow
// 'unsafe-eval' in development so `next dev` isn't broken by the enforced policy.
const isDev = process.env.NODE_ENV === "development";
const contentSecurityPolicy = [
  "default-src 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "frame-ancestors 'none'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""} https://plausible.io`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data:",
  "connect-src 'self' https://*.supabase.co https://plausible.io",
  "form-action 'self'",
].join("; ");

const securityHeaders = [
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  { key: "Content-Security-Policy", value: contentSecurityPolicy },
];

const nextConfig: NextConfig = {
  images: { unoptimized: true },
  async headers() {
    return [
      { source: "/:path*", headers: securityHeaders },
      { source: "/playground/mcp-injection-lab/:path*", headers: [{ key: "X-Robots-Tag", value: "noindex" }] },
    ];
  },
};

export default nextConfig;
