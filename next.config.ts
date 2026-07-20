import type { NextConfig } from "next";

// Content-Security-Policy for the dashboard shell. Enforcing (see Task 18):
// live-verified as Report-Only against a production build (dashboard, login,
// command palette, /api/ai, Supabase search) with zero violations before flipping.
// COVERAGE (verified live 2026-07-19): headers() applies ONLY to Next-served routes.
// On Netlify, public/ static files (all of /playground/**) are served from the CDN
// and NEVER receive these headers — their headers come from the [[headers]] blocks
// in netlify.toml, which must be kept in sync with the values below.
// Frame policy is 'self'/SAMEORIGIN (not 'none'/DENY): /blog/fourier-drawing-machine
// iframes /playground/fourier-drawing-machine/phase{1,2,3}.html same-origin, and
// DENY / frame-ancestors 'none' block even same-origin framing. Cross-origin
// framing remains blocked.
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
  "frame-ancestors 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""} https://plausible.io`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data:",
  "connect-src 'self' https://*.supabase.co https://plausible.io",
  "form-action 'self'",
].join("; ");

const securityHeaders = [
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
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
      { source: "/playground/mcp-injection-lab/:path*", headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }] },
    ];
  },
};

export default nextConfig;
