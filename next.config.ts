import type { NextConfig } from "next";

const securityHeaders = [
  // Verhindert Clickjacking — Seite darf nicht in einem iframe eingebettet werden
  { key: 'X-Frame-Options', value: 'DENY' },
  // Browser soll Dateitypen nicht selbst erraten (verhindert MIME-Sniffing-Angriffe)
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  // Kein Referrer bei Cross-Origin-Anfragen — schützt interne URLs
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  // Erlaubt nur HTTPS für 1 Jahr (nur in Produktion sinnvoll, schadet im Dev nicht)
  { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains' },
  // Schränkt Browser-Features ein (Kamera, Mikrofon etc. — wir nutzen keine)
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
];

const nextConfig: NextConfig = {
  productionBrowserSourceMaps: false,
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
