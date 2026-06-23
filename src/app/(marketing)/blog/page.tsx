import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { format } from "date-fns";
import { prisma } from "@/lib/db";
import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";
import { Arch } from "@/components/ui/arch";
import { ScriptureEyebrow } from "@/components/ui/scripture-eyebrow";

export const metadata: Metadata = {
  title: "Blog",
  description:
    "Encouragement, teaching, and stories from the RCCG Covenant Embassy church family in Plano, Texas.",
};

export default async function BlogPage() {
  const now = new Date();
  const posts = await prisma.blogPost.findMany({
    where: { publishedAt: { not: null, lte: now } },
    orderBy: { publishedAt: "desc" },
    include: { author: { select: { name: true } } },
  });

  return (
    <>
      {/* Hero */}
      <section className="bg-navy text-cream">
        <Container className="max-w-3xl py-16 text-center sm:py-24">
          <ScriptureEyebrow
            reference="Proverbs 4:18"
            label="From the Blog"
            className="justify-center"
          />
          <h1 className="mt-5 font-display text-4xl font-bold leading-tight sm:text-5xl">
            Stories &amp; Encouragement
          </h1>
          <p className="mt-6 text-lg leading-relaxed text-cream/80">
            Reflections on faith, life, and what God is doing in and through our
            church family.
          </p>
        </Container>
      </section>

      <Section tone="cream">
        <Container>
          {posts.length > 0 ? (
            <div className="grid gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
              {posts.map((post) => (
                <article key={post.id} className="group flex flex-col">
                  <Link
                    href={`/blog/${post.slug}`}
                    className="block rounded-sm focus-ring-gold"
                  >
                    {/* TODO: replace with real church photography */}
                    <Arch className="aspect-[4/3] w-full transition-transform duration-300 group-hover:-translate-y-1 motion-reduce:transform-none">
                      {post.coverImage ? (
                        <Image
                          src={post.coverImage}
                          alt={`Cover image for ${post.title}`}
                          width={600}
                          height={450}
                          className="h-full w-full object-cover"
                        />
                      ) : null}
                    </Arch>
                  </Link>

                  <div className="mt-5 space-y-2">
                    {post.publishedAt ? (
                      <p className="font-mono text-xs uppercase tracking-[0.18em] text-gold-deep">
                        <time dateTime={post.publishedAt.toISOString()}>
                          {format(post.publishedAt, "MMMM d, yyyy")}
                        </time>
                      </p>
                    ) : null}
                    <h2 className="font-display text-xl font-bold leading-snug text-navy">
                      <Link
                        href={`/blog/${post.slug}`}
                        className="rounded-sm transition-colors hover:text-royal focus-ring-gold"
                      >
                        {post.title}
                      </Link>
                    </h2>
                    {post.excerpt ? (
                      <p className="text-sm leading-relaxed text-ink/80">
                        {post.excerpt}
                      </p>
                    ) : null}
                    {post.author?.name ? (
                      <p className="text-sm text-muted">By {post.author.name}</p>
                    ) : null}
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <p className="text-center text-ink/70">
              New posts are coming soon. Please check back shortly.
            </p>
          )}
        </Container>
      </Section>
    </>
  );
}
