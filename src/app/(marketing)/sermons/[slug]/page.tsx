import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import { prisma } from "@/lib/db";
import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScriptureEyebrow } from "@/components/ui/scripture-eyebrow";
import { SaveSermonButton } from "@/components/site/save-sermon-button";
import { getCurrentUser } from "@/lib/rbac";
import { isSermonSaved } from "../save-core";
import { toYouTubeEmbedUrl } from "@/lib/youtube";

// The save control is per-user, so render dynamically (never statically cache
// one visitor's saved state for everyone).
export const dynamic = "force-dynamic";

type Params = { slug: string };

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { slug } = await params;
  const sermon = await prisma.sermon.findUnique({ where: { slug } });
  if (!sermon) return { title: "Sermon not found | RCCG Covenant Embassy" };
  return {
    title: `${sermon.title} | RCCG Covenant Embassy`,
    description:
      sermon.description ??
      `${sermon.title} — a message by ${sermon.speaker}.`,
  };
}

export default async function SermonDetailPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { slug } = await params;
  const sermon = await prisma.sermon.findUnique({
    where: { slug },
    include: { series: { select: { title: true, slug: true } } },
  });

  if (!sermon) {
    notFound();
  }

  const [user, saved] = await Promise.all([
    getCurrentUser(),
    isSermonSaved(sermon.id),
  ]);

  const embedUrl = toYouTubeEmbedUrl(sermon.videoUrl);
  const series = sermon.series;

  return (
    <>
      {/* Header */}
      <section className="bg-navy text-cream">
        <Container className="max-w-3xl py-14 text-center sm:py-20">
          <ScriptureEyebrow
            reference={sermon.scripture ?? "2 Timothy 4:2"}
            label={series?.title ?? "Sermon"}
            className="justify-center"
          />
          <h1 className="mt-5 font-display text-3xl font-bold leading-tight sm:text-4xl lg:text-5xl">
            {sermon.title}
          </h1>
          <p className="mt-5 text-cream/80">
            <span className="font-medium">{sermon.speaker}</span>
            <span aria-hidden="true" className="mx-2 text-gold/60">
              &middot;
            </span>
            <time dateTime={sermon.date.toISOString()}>
              {format(sermon.date, "MMMM d, yyyy")}
            </time>
          </p>
          {series ? (
            <div className="mt-4 flex justify-center">
              <Link
                href={`/sermons?series=${series.slug}`}
                className="rounded-full focus-ring-gold"
              >
                <Badge tone="outline">{series.title}</Badge>
              </Link>
            </div>
          ) : null}
        </Container>
      </section>

      {/* Video + body */}
      <Section tone="cream">
        <Container className="max-w-4xl">
          {embedUrl ? (
            <div className="overflow-hidden rounded-2xl border border-gold/30 bg-navy shadow-xl shadow-navy/10">
              {/* Responsive 16:9 video wrapper */}
              <div className="relative w-full" style={{ aspectRatio: "16 / 9" }}>
                <iframe
                  src={embedUrl}
                  title={`Sermon video: ${sermon.title}`}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                  className="absolute inset-0 h-full w-full"
                  loading="lazy"
                />
              </div>
            </div>
          ) : (
            <div
              className="flex aspect-video w-full items-center justify-center rounded-2xl border border-gold/30 bg-navy/90 text-cream/70"
              role="note"
            >
              {/* TODO: add the real sermon video */}
              Video coming soon.
            </div>
          )}

          {/* Actions */}
          <div className="mt-8 flex flex-wrap items-center gap-4">
            <SaveSermonButton
              sermonId={sermon.id}
              slug={sermon.slug}
              isLoggedIn={Boolean(user)}
              initialSaved={saved}
            />
            {sermon.audioUrl ? (
              <a
                href={sermon.audioUrl}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-navy px-6 font-body font-medium text-cream transition-colors hover:bg-royal focus-ring-gold"
              >
                Listen to audio
              </a>
            ) : null}
          </div>

          {/* Description + scripture */}
          {sermon.description ? (
            <div className="mt-12 max-w-2xl">
              <h2 className="font-display text-2xl font-bold text-navy">
                About this message
              </h2>
              {sermon.scripture ? (
                <p className="mt-3 font-mono text-sm uppercase tracking-[0.12em] text-gold-deep">
                  {sermon.scripture}
                </p>
              ) : null}
              <div className="mt-4 space-y-4 leading-relaxed text-ink/85">
                {sermon.description
                  .split("\n")
                  .filter(Boolean)
                  .map((para, i) => (
                    <p key={i}>{para}</p>
                  ))}
              </div>
            </div>
          ) : null}

          <div className="mt-12 border-t border-navy/10 pt-8">
            <Link
              href="/sermons"
              className="font-mono text-sm uppercase tracking-[0.15em] text-gold-deep transition-colors hover:text-navy focus-ring-gold"
            >
              &larr; Back to all sermons
            </Link>
          </div>
        </Container>
      </Section>
    </>
  );
}
