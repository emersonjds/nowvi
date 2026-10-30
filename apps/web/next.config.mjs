import { PHASE_PRODUCTION_BUILD } from "next/constants.js";

const isDev = process.env.NODE_ENV === "development";
const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "";

const contentSecurityPolicy = [
  "default-src 'self'",
  // Next.js inlines its bootstrap scripts; the Adsterra banner loads invoke.js inside a srcdoc iframe, which inherits this policy.
  `script-src 'self' 'unsafe-inline' https://www.highperformanceformat.com${isDev ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  `connect-src 'self' ${apiUrl}${isDev ? " ws:" : ""}`,
  "img-src 'self' https: data:",
  "font-src 'self'",
  "frame-src https:",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: contentSecurityPolicy },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=(), usb=()" },
];

/** @type {(phase: string) => import('next').NextConfig} */
const nextConfig = (phase) => {
  if (phase === PHASE_PRODUCTION_BUILD) {
    const missing = ["NEXT_PUBLIC_API_URL", "NEXT_PUBLIC_SITE_URL"].filter((name) => !process.env[name]);
    if (missing.length > 0) throw new Error(`Missing env for the production build: ${missing.join(", ")}`);
  }

  return {
    output: "standalone",
    poweredByHeader: false,
    reactCompiler: true,
    // Every root layout sits under [lang]; unmatched URLs need a 404 with its own <html>.
    experimental: { globalNotFound: true },
    compiler: {
      removeConsole: process.env.NODE_ENV === "production",
    },
    headers: async () => [{ source: "/:path*", headers: securityHeaders }],
    // Temporary while Instagram is paused (NOWVI-20); drop it when the landing comes back.
    redirects: async () => [{ source: "/baixar-video-instagram", destination: "/", statusCode: 302 }],
  };
};

export default nextConfig;
