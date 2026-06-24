import type { MetadataRoute } from "next";
import { prisma } from "@/lib/db";
import { SITE_URL } from "@/lib/site";

// Sitemap is generated on demand so newly published content appears without a
// rebuild. Excludes auth/account/admin/api (non-indexable, gated routes).
export const dynamic = "force-dynamic";

const STATIC_ROUTES: Array<{
  path: string;
  priority: number;
  changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"];
}> = [
  { path: "/", priority: 1.0, changeFrequency: "weekly" },
  { path: "/about", priority: 0.7, changeFrequency: "monthly" },
  { path: "/ministries", priority: 0.7, changeFrequency: "monthly" },
  { path: "/sermons", priority: 0.8, changeFrequency: "weekly" },
  { path: "/events", priority: 0.8, changeFrequency: "weekly" },
  { path: "/blog", priority: 0.7, changeFrequency: "weekly" },
  { path: "/visit", priority: 0.6, changeFrequency: "monthly" },
  { path: "/contact", priority: 0.5, changeFrequency: "monthly" },
  { path: "/give", priority: 0.6, changeFrequency: "monthly" },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const url = (path: string) => `${SITE_URL}${path}`;

  const staticEntries: MetadataRoute.Sitemap = STATIC_ROUTES.map((r) => ({
    url: url(r.path),
    lastModified: now,
    changeFrequency: r.changeFrequency,
    priority: r.priority,
  }));

  // Dynamic entries — only published / publicly visible content.
  const [sermons, events, ministries, posts] = await Promise.all([
    prisma.sermon.findMany({ select: { slug: true, updatedAt: true } }),
    prisma.event.findMany({ select: { slug: true, updatedAt: true } }),
    prisma.ministry.findMany({ select: { slug: true, updatedAt: true } }),
    prisma.blogPost.findMany({
      where: { publishedAt: { not: null, lte: now } },
      select: { slug: true, updatedAt: true },
    }),
  ]);

  const dynamicEntries: MetadataRoute.Sitemap = [
    ...sermons.map((s) => ({
      url: url(`/sermons/${s.slug}`),
      lastModified: s.updatedAt,
      changeFrequency: "monthly" as const,
      priority: 0.6,
    })),
    ...events.map((e) => ({
      url: url(`/events/${e.slug}`),
      lastModified: e.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.6,
    })),
    ...ministries.map((m) => ({
      url: url(`/ministries/${m.slug}`),
      lastModified: m.updatedAt,
      changeFrequency: "monthly" as const,
      priority: 0.5,
    })),
    ...posts.map((p) => ({
      url: url(`/blog/${p.slug}`),
      lastModified: p.updatedAt,
      changeFrequency: "monthly" as const,
      priority: 0.5,
    })),
  ];

  return [...staticEntries, ...dynamicEntries];
}
