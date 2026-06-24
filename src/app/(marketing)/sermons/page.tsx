import type { Metadata } from "next";
import Image from "next/image";
import { format } from "date-fns";
import { prisma } from "@/lib/db";
import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";
import { Button } from "@/components/ui/button";
import { Arch } from "@/components/ui/arch";
import { ScriptureEyebrow } from "@/components/ui/scripture-eyebrow";
import {
  SermonFilter,
  type FilterableSermon,
  type SeriesOption,
} from "@/components/site/sermon-filter";

// Content is DB-backed and edited via the CMS, so render at request time rather
// than statically at build. On Railway the DB is migrated on deploy (after the
// build), and new content should appear without a rebuild.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Sermons",
  description:
    "Watch and listen to messages from RCCG Covenant Embassy. Search our sermon library by title, speaker, scripture, or series.",
};

export default async function SermonsPage({
  searchParams,
}: {
  searchParams: Promise<{ series?: string }>;
}) {
  const [{ series: seriesSlug }, [sermons, series]] = await Promise.all([
    searchParams,
    Promise.all([
      prisma.sermon.findMany({
        orderBy: { date: "desc" },
        include: { series: { select: { title: true } } },
      }),
      prisma.series.findMany({ orderBy: { createdAt: "asc" } }),
    ]),
  ]);

  const featured = sermons[0] ?? null;

  // Serialize a minimal, client-safe subset for the filter component. The full
  // list (including the featured sermon) is included so search finds every
  // sermon — the hero above is just an additional highlight.
  const filterable: FilterableSermon[] = sermons.map((s) => ({
    id: s.id,
    slug: s.slug,
    title: s.title,
    speaker: s.speaker,
    date: s.date,
    scripture: s.scripture,
    thumbnailUrl: s.thumbnailUrl,
    seriesId: s.seriesId,
    series: s.series ? { title: s.series.title } : null,
  }));

  const seriesOptions: SeriesOption[] = series.map((s) => ({
    id: s.id,
    title: s.title,
  }));

  // Translate a `?series=<slug>` deep link into the series id the filter keys
  // on, so the grid loads pre-filtered when arriving from a series badge.
  const initialSeries =
    series.find((s) => s.slug === seriesSlug)?.id ?? null;

  return (
    <>
      {/* Hero */}
      <section className="bg-navy text-cream">
        <Container className="max-w-3xl py-16 text-center sm:py-24">
          <ScriptureEyebrow
            reference="2 Timothy 4:2"
            label="The Word"
            className="justify-center"
          />
          <h1 className="mt-5 font-display text-4xl font-bold leading-tight sm:text-5xl">
            Sermon Library
          </h1>
          <p className="mt-6 text-lg leading-relaxed text-cream/80">
            Be encouraged and equipped by the Word of God. Revisit a message,
            catch up on a series, or share a sermon that spoke to you.
          </p>
        </Container>
      </section>

      {/* Featured / latest sermon */}
      {featured ? (
        <Section tone="cream">
          <Container className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
            <div className="mx-auto w-full max-w-xs lg:max-w-sm">
              {/* TODO: replace with real church photography */}
              <Arch className="aspect-[4/5] w-full shadow-xl shadow-navy/10">
                {featured.thumbnailUrl ? (
                  <Image
                    src={featured.thumbnailUrl}
                    alt={`Sermon: ${featured.title}`}
                    width={600}
                    height={750}
                    priority
                    className="h-full w-full object-cover"
                  />
                ) : null}
              </Arch>
            </div>

            <div>
              <ScriptureEyebrow
                reference={featured.scripture ?? "2 Timothy 4:2"}
                label="Latest Message"
                className="text-gold-ink"
              />
              <h2 className="mt-5 font-display text-3xl font-bold text-navy sm:text-4xl">
                {featured.title}
              </h2>
              <p className="mt-3 text-muted">
                <span className="font-medium text-ink">{featured.speaker}</span>
                <span aria-hidden="true" className="mx-2">
                  &middot;
                </span>
                <time dateTime={featured.date.toISOString()}>
                  {format(featured.date, "MMMM d, yyyy")}
                </time>
                {featured.series ? (
                  <>
                    <span aria-hidden="true" className="mx-2">
                      &middot;
                    </span>
                    {featured.series.title}
                  </>
                ) : null}
              </p>
              {featured.description ? (
                <p className="mt-5 max-w-lg leading-relaxed text-ink/85">
                  {featured.description}
                </p>
              ) : null}
              <div className="mt-8">
                <Button href={`/sermons/${featured.slug}`} variant="navy">
                  Watch This Message
                </Button>
              </div>
            </div>
          </Container>
        </Section>
      ) : null}

      {/* Searchable / filterable library */}
      <Section tone="cream" className={featured ? "pt-0" : undefined}>
        <Container>
          <div className="mb-10 max-w-xl">
            <ScriptureEyebrow
              reference="Psalm 119:105"
              label="Browse All"
              className="text-gold-ink"
            />
            <h2 className="mt-5 font-display text-3xl font-bold text-navy sm:text-4xl">
              Explore the Library
            </h2>
          </div>

          {sermons.length > 0 ? (
            <SermonFilter
              sermons={filterable}
              series={seriesOptions}
              initialSeries={initialSeries}
            />
          ) : (
            <p className="text-center text-ink/70">
              Sermons are coming soon. Please check back shortly.
            </p>
          )}
        </Container>
      </Section>
    </>
  );
}
