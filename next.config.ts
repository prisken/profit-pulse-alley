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
