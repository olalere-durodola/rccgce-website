import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

// Allow indexing of public marketing pages; keep gated/internal areas out of
// search results. The sitemap link points crawlers at the canonical index.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin", "/account", "/api", "/login", "/register"],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
