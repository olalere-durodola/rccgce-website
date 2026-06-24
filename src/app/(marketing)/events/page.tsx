import type { Metadata } from "next";
import { format } from "date-fns";
import { prisma } from "@/lib/db";
import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";
import { Button } from "@/components/ui/button";
import { ScriptureEyebrow } from "@/components/ui/scripture-eyebrow";
import { EventCard } from "@/components/site/event-card";

export const metadata: Metadata = {
  title: "Events",
  description:
    "See what's happening at RCCG Covenant Embassy. Browse upcoming services, studies, conferences, and outreach in Plano, Texas.",
};

export default async function EventsPage() {
  const now = new Date();

  const [upcoming, past] = await Promise.all([
    prisma.event.findMany({
      where: { startsAt: { gte: now } },
      orderBy: { startsAt: "asc" },
    }),
    prisma.event.findMany({
      where: { startsAt: { lt: now } },
      orderBy: { startsAt: "desc" },
      take: 6,
    }),
  ]);

  return (
    <>
      {/* Hero */}
      <section className="bg-navy text-cream">
        <Container className="max-w-3xl py-16 text-center sm:py-24">
          <ScriptureEyebrow
            reference="Hebrews 10:25"
            label="Gather"
            className="justify-center"
          />
          <h1 className="mt-5 font-display text-4xl font-bold leading-tight sm:text-5xl">
            Upcoming Events
          </h1>
          <p className="mt-6 text-lg leading-relaxed text-cream/80">
            There is always something happening in our church family. Come
            worship, grow, and serve with us — you are always welcome.
          </p>
        </Container>
      </section>

      {/* Upcoming */}
      <Section tone="cream">
        <Container>
          {upcoming.length > 0 ? (
            <div className="grid gap-5 lg:grid-cols-2">
              {upcoming.map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          ) : (
            <div className="mx-auto max-w-xl rounded-2xl border border-gold/30 bg-white/60 p-10 text-center">
              <ScriptureEyebrow
                reference="Psalm 27:14"
                label="Coming Soon"
                className="justify-center text-gold-ink"
              />
              <h2 className="mt-5 font-display text-2xl font-bold text-navy">
                No upcoming events just yet
              </h2>
              <p className="mt-3 text-ink/80">
                We are planning our next gatherings. In the meantime, join us
                this Sunday or plan a visit — we would love to meet you.
              </p>
              <div className="mt-6 flex flex-wrap justify-center gap-4">
                <Button href="/visit" variant="navy">
                  Plan Your Visit
                </Button>
                <Button
                  href="/sermons"
                  variant="ghost"
                  className="text-gold-ink hover:bg-navy/5"
                >
                  Watch Sermons
                </Button>
              </div>
            </div>
          )}
        </Container>
      </Section>

      {/* Past events */}
      {past.length > 0 ? (
        <Section tone="navy">
          <Container>
            <div className="mb-10 max-w-xl">
              <ScriptureEyebrow
                reference="1 Samuel 7:12"
                label="Looking Back"
              />
              <h2 className="mt-5 font-display text-3xl font-bold text-cream sm:text-4xl">
                Recent Gatherings
              </h2>
              <p className="mt-3 text-cream/75">
                A glimpse of what God has been doing among us.
              </p>
            </div>
            <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {past.map((event) => (
                <li
                  key={event.id}
                  className="rounded-xl border border-white/10 bg-white/5 p-5"
                >
                  <p className="font-mono text-xs uppercase tracking-wider text-gold">
                    <time dateTime={event.startsAt.toISOString()}>
                      {format(event.startsAt, "MMMM d, yyyy")}
                    </time>
                  </p>
                  <h3 className="mt-1 font-display text-lg font-bold text-cream">
                    {event.title}
                  </h3>
                  {event.location ? (
                    <p className="mt-1 text-sm text-cream/70">
                      {event.location}
                    </p>
                  ) : null}
                </li>
              ))}
            </ul>
          </Container>
        </Section>
      ) : null}
    </>
  );
}
