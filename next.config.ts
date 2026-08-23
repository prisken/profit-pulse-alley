import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: "/event",
        destination: "/events",
        permanent: true,
      },
      {
        source: "/game",
        destination: "/market-pulse",
        permanent: true,
      },
      {
        source: "/investment-challenge",
        destination: "/market-pulse/play",
        permanent: true,
      },
      {
        // Legacy QR / printed URL — keep working after rename to /fortify-registration.
        source: "/fortify-survey",
        destination: "/fortify-registration",
        permanent: true,
      },
      // Legal/trust URL consolidation — legacy paths keep working, no 404s.
      {
        source: "/privacy-policy",
        destination: "/privacy",
        permanent: true,
      },
      {
        source: "/privacy-policy/",
        destination: "/privacy",
        permanent: true,
      },
      {
        source: "/cookie-policy",
        destination: "/privacy",
        permanent: true,
      },
      {
        source: "/faqs",
        destination: "/faq",
        permanent: true,
      },
      {
        source: "/faqs/",
        destination: "/faq",
        permanent: true,
      },
      {
        source: "/terms-of-service",
        destination: "/terms",
        permanent: true,
      },
      {
        source: "/terms-of-service/",
        destination: "/terms",
        permanent: true,
      },
      {
        source: "/our-philosophy",
        destination: "/concept",
        permanent: true,
      },
      {
        source: "/our-philosophy/",
        destination: "/concept",
        permanent: true,
      },
    ];
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "picsum.photos",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
