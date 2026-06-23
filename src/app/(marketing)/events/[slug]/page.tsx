import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { format, isSameDay } from "date-fns";
import { prisma } from "@/lib/db";
import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";
import { Button } from "@/components/ui/button";
import { ScriptureEyebrow } from "@/components/ui/scripture-eyebrow";
import { Paragraphs } from "@/components/ui/paragraphs";

type Params = { slug: string };

export async function generateStaticParams() {
  const events = await prisma.event.findMany({ select: { slug: true } });
  return events.map((e) => ({ slug: e.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { slug } = await params;
  const event = await prisma.event.findUnique({ where: { slug } });
  if (!event) return { title: "Event not found | RCCG Covenant Embassy" };
  return {
    title: `${event.title} | RCCG Covenant Embassy`,
    description: event.description ?? undefined,
  };
}

/** Human-friendly date + time range, collapsing same-day ranges. */
function formatRange(startsAt: Date, endsAt: Date | null): string {
  const start = format(startsAt, "EEEE, MMMM d, yyyy");
  const startTime = format(startsAt, "h:mm a");
  if (!endsAt) return `${start} · ${startTime}`;

  if (isSameDay(startsAt, endsAt)) {
    return `${start} · ${startTime} – ${format(endsAt, "h:mm a")}`;
  }
  return `${start}, ${startTime} – ${format(endsAt, "EEEE, MMMM d, yyyy")}, ${format(endsAt, "h:mm a")}`;
}

export default async function EventDetailPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { slug } = await params;
  const event = await prisma.event.findUnique({ where: { slug } });

  if (!event) {
    notFound();
  }

  const dateLabel = formatRange(event.startsAt, event.endsAt);
  const mapsUrl = event.location
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(event.location)}`
    : null;

  return (
    <>
      {/* Hero */}
      <section className="relative isolate overflow-hidden bg-navy text-cream">
        {event.imageUrl ? (
          <>
            {/* TODO: replace with real church photography */}
            <Image
              src={event.imageUrl}
              alt=""
              fill
              priority
              sizes="100vw"
              className="object-cover opacity-30"
            />
            <div
              aria-hidden="true"
              className="absolute inset-0 bg-gradient-to-t from-navy via-navy/85 to-navy/55"
            />
          </>
        ) : null}

        <Container className="relative max-w-3xl py-20 text-center sm:py-28">
          <ScriptureEyebrow
            reference="Psalm 122:1"
            label="Event"
            className="justify-center"
          />
          <h1 className="mt-5 font-display text-4xl font-bold leading-tight sm:text-5xl">
            {event.title}
          </h1>
          <p className="mt-5 text-cream/85">
            <time dateTime={event.startsAt.toISOString()}>{dateLabel}</time>
          </p>
        </Container>
      </section>

      {/* Body + details */}
      <Section tone="cream">
        <Container className="grid gap-12 lg:grid-cols-[1.6fr_1fr] lg:gap-16">
          <div>
            <h2 className="font-display text-2xl font-bold text-navy sm:text-3xl">
              About this event
            </h2>
            <div className="mt-5 space-y-4 leading-relaxed text-ink/85">
              {event.description ? (
                <Paragraphs text={event.description} />
              ) : (
                <p>Details are coming soon. Check back for more information.</p>
              )}
            </div>

            <div className="mt-10 flex flex-wrap gap-4">
              <Button href="/visit" variant="navy">
                Plan Your Visit
              </Button>
              <Link
                href="/events"
                className="inline-flex items-center font-mono text-sm uppercase tracking-[0.15em] text-gold-deep transition-colors hover:text-navy focus-ring-gold"
              >
                &larr; All events
              </Link>
            </div>
          </div>

          {/* Details card */}
          <aside className="lg:pt-1">
            <div className="rounded-2xl border border-gold/40 bg-white/70 p-6 sm:p-7">
              <h2 className="font-mono text-xs uppercase tracking-[0.2em] text-gold-deep">
                Details
              </h2>
              <dl className="mt-4 space-y-4 text-sm">
                <div>
                  <dt className="font-medium text-muted">When</dt>
                  <dd className="mt-0.5 text-ink">{dateLabel}</dd>
                </div>
                {event.location ? (
                  <div>
                    <dt className="font-medium text-muted">Where</dt>
                    {/* TODO: confirm venue */}
                    <dd className="mt-0.5 text-ink">{event.location}</dd>
                  </div>
                ) : null}
              </dl>

              {mapsUrl ? (
                <a
                  href={mapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-6 inline-flex h-11 w-full items-center justify-center gap-2 rounded-full border border-navy/20 bg-navy text-cream font-body font-medium transition-colors hover:bg-royal focus-ring-gold"
                >
                  Get directions
                </a>
              ) : null}
            </div>
          </aside>
        </Container>
      </Section>
    </>
  );
}
