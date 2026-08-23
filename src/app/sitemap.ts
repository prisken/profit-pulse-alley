import type { MetadataRoute } from "next";

const BASE = "https://profitpulseally.com";

export default function sitemap(): MetadataRoute.Sitemap {
  const staticRoutes = [
    "",
    "/market-pulse",
    "/market-pulse/play",
    "/market-pulse/leaderboard",
    "/market-pulse/rules",
    "/matching-pulse",
    "/concept",
    "/events",
    "/book",
    "/blog",
    "/faq",
    "/contact",
    "/careers",
    "/contest-rules",
    "/investment-disclaimer",
    "/privacy",
    "/terms",
    "/pitch",
    "/links",
  ];

  return staticRoutes.map((route) => ({
    url: `${BASE}${route}`,
    lastModified: new Date(),
    changeFrequency: route === "" ? "daily" : "weekly",
    priority: route === "" ? 1 : 0.7,
  }));
}
