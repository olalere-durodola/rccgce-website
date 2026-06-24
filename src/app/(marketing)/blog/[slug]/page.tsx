import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import { prisma } from "@/lib/db";
import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";
import { ScriptureEyebrow } from "@/components/ui/scripture-eyebrow";
import { renderMarkdown } from "@/lib/markdown";

type Params = { slug: string };

// Content is DB-backed and edited via the CMS, so render at request time rather
// than statically at build. On Railway the DB is migrated on deploy (after the
// build), and new content should appear without a rebuild.
export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = await prisma.blogPost.findUnique({ where: { slug } });
  if (!post) return { title: "Post not found" };
  const description = post.excerpt ?? undefined;
  const image = post.coverImage ?? undefined;
  return {
    title: post.title,
    description,
    alternates: { canonical: `/blog/${post.slug}` },
    openGraph: {
      type: "article",
      title: post.title,
      description,
      url: `/blog/${post.slug}`,
      publishedTime: post.publishedAt?.toISOString(),
      ...(image ? { images: [{ url: image, alt: post.title }] } : {}),
    },
  };
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { slug } = await params;
  const post = await prisma.blogPost.findUnique({
    where: { slug },
    include: { author: { select: { name: true } } },
  });

  // Treat unpublished or future-dated posts as not found for public visitors.
  const now = new Date();
  if (!post || !post.publishedAt || post.publishedAt > now) {
    notFound();
  }

  const bodyHtml = renderMarkdown(post.body);

  return (
    <>
      {/* Header */}
      <section className="bg-navy text-cream">
        <Container className="max-w-3xl py-14 text-center sm:py-20">
          <ScriptureEyebrow
            reference="Psalm 145:4"
            label="From the Blog"
            className="justify-center"
          />
          <h1 className="mt-5 font-display text-3xl font-bold leading-tight sm:text-4xl lg:text-5xl">
            {post.title}
          </h1>
          <p className="mt-5 text-cream/80">
            {post.author?.name ? (
              <>
                <span className="font-medium">{post.author.name}</span>
                <span aria-hidden="true" className="mx-2 text-gold/60">
                  &middot;
                </span>
              </>
            ) : null}
            <time dateTime={post.publishedAt.toISOString()}>
              {format(post.publishedAt, "MMMM d, yyyy")}
            </time>
          </p>
        </Container>
      </section>

      {/* Cover image */}
      {post.coverImage ? (
        <div className="bg-cream">
          <Container className="max-w-4xl pt-12 sm:pt-16">
            {/* TODO: replace with real church photography */}
            <div className="overflow-hidden rounded-2xl border border-gold/30 shadow-md shadow-navy/10">
              <Image
                src={post.coverImage}
                alt={`Cover image for ${post.title}`}
                width={1280}
                height={720}
                priority
                className="aspect-[16/9] w-full object-cover"
              />
            </div>
          </Container>
        </div>
      ) : null}

      {/* Body */}
      <Section tone="cream" className={post.coverImage ? "pt-12 sm:pt-16" : undefined}>
        <Container className="max-w-2xl">
          <div
            className="prose-blog space-y-5 leading-relaxed text-ink/90"
            // Safe: renderMarkdown HTML-escapes all input, then re-introduces
            // only an allowlisted set of tags (see src/lib/markdown.ts).
            dangerouslySetInnerHTML={{ __html: bodyHtml }}
          />

          <div className="mt-14 border-t border-navy/10 pt-8">
            <Link
              href="/blog"
              className="font-mono text-sm uppercase tracking-[0.15em] text-gold-ink transition-colors hover:text-navy focus-ring-gold"
            >
              &larr; Back to the blog
            </Link>
          </div>
        </Container>
      </Section>
    </>
  );
}
