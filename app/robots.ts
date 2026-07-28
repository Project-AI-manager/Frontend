import type { MetadataRoute } from "next";

import { getSiteUrl } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: ["/", "/legal/privacy", "/legal/terms"],
      disallow: [
        "/analytics",
        "/channels",
        "/inbox",
        "/knowledge",
        "/login",
        "/onboarding",
        "/profile",
        "/register",
        "/settings",
        "/verify-email",
      ],
    },
    sitemap: getSiteUrl("/sitemap.xml"),
    host: getSiteUrl("/"),
  };
}
