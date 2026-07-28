import type { MetadataRoute } from "next";

import { getSiteUrl } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  return ["/", "/legal/privacy", "/legal/terms"].map((path) => ({
    url: getSiteUrl(path),
    changeFrequency: path === "/" ? "weekly" : "monthly",
    priority: path === "/" ? 1 : 0.4,
  }));
}
