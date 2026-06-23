import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";
import { Button } from "@/components/ui/button";
import { Arch } from "@/components/ui/arch";
import { ScriptureEyebrow } from "@/components/ui/scripture-eyebrow";
import { SermonCard } from "@/components/site/sermon-card";
import { MinistryCard } from "@/components/site/ministry-card";
import { EventCard } from "@/components/site/event-card";
import { NewsletterForm } from "@/components/site/newsletter-form";

export const metadata: Metadata = {
  // Home uses the layout's default title (no template suffix) and canonical.
  alternates: { canonical: "/" },
  description:
    "Welcome to RCCG Covenant Embassy in Plano, Texas — a house of covenant " +
    "and destiny. Join us for worship, watch the latest sermon, explore our " +
    "ministries, plan your visit, and give online.",
};

export default async function Home() {
  const now = new Date();

  const [featuredSermon, ministries, events] = await Promise.all([
    prisma.sermon.findFirst({
      orderBy: { date: "desc" },
      include: { series: { select: { title: true } } },
    }),
    prisma.ministry.findMany({ orderBy: { createdAt: "asc" }, take: 3 }),
    prisma.event.findMany({
      where: { startsAt: { gte: now } },
      orderBy: { startsAt: "asc" },
      take: 3,
    }),
  ]);

  return (
    <>
      {/* ===================================================================
          1. HERO
          =================================================================== */}
      <section className="relative overflow-hidden bg-navy text-cream">
        <Container className="grid items-center gap-12 py-16 sm:py-20 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16 lg:py-28">
          <div className="max-w-xl">
            <ScriptureEyebrow reference="Genesis 17:7" label="Covenant" />
            <h1 className="mt-5 font-display text-4xl font-bold leading-[1.1] sm:text-5xl lg:text-6xl">
              A House of Covenant <span className="text-gold">&amp;</span> Destiny
            </h1>
            <p className="mt-6 max-w-lg text-lg leading-relaxed text-cream/80">
              We are a Spirit-filled family in Plano, Texas, anchored in the
              faithfulness of God and called to help you discover the destiny He
              has written over your life. There is a place for you here.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Button href="/visit" variant="gold" size="lg">
                Plan Your Visit
              </Button>
              <Button href="/sermons" variant="outline" size="lg">
                Watch Sermons
              </Button>
            </div>
          </div>

          <div className="mx-auto w-full max-w-sm lg:max-w-md">
            {/* TODO: replace with real church photography */}
            <Arch className="aspect-[3/4] w-full shadow-2xl shadow-black/40">
              <Image
                src="https://images.unsplash.com/photo-1438232992991-995b7058bbb3?w=1200&q=80"
                alt="The congregation gathered in worship"
                width={900}
                height={1200}
                priority
                className="h-full w-full object-cover"
              />
            </Arch>
          </div>
        </Container>

        {/* Service-times strip */}
        <div className="border-t border-white/10 bg-royal/40">
          <Container className="flex flex-col items-center justify-center gap-2 py-4 text-center text-sm sm:flex-row sm:gap-8">
            {/* TODO: confirm service times */}
            <span className="font-mono text-xs uppercase tracking-[0.2em] text-gold">
              Join us
            </span>
            <span className="text-cream/85">Sundays 9:00 &amp; 11:00 AM</span>
            <span aria-hidden="true" className="hidden text-gold/40 sm:inline">
              &bull;
            </span>
            <span className="text-cream/85">Wednesday Bible Study 7:00 PM</span>
          </Container>
        </div>
      </section>

      {/* ===================================================================
          2. WELCOME
          =================================================================== */}
      <Section tone="cream">
        <Container className="max-w-3xl text-center">
          <ScriptureEyebrow
            reference="Psalm 100:4"
            label="Welcome"
            className="justify-center text-gold-deep"
          />
          <h2 className="mt-5 font-display text-3xl font-bold text-navy sm:text-4xl">
            You&rsquo;re Welcome Home
          </h2>
          <p className="mt-6 text-lg leading-relaxed text-ink/85">
            RCCG Covenant Embassy is a warm, multi-generational community where
            people from every background come to encounter God, grow in faith,
            and serve our city. Whether you are exploring faith for the first
            time or have walked with Jesus for decades, you will find authentic
            worship, sound teaching, and people who genuinely care.
          </p>
          <p className="mt-4 text-base leading-relaxed text-ink/75">
            {/* TODO: confirm lead pastor name */}
            Led by Pastor [Name], we are committed to building a house where the
            presence of God transforms lives and destinies are fulfilled.
          </p>
          <div className="mt-8">
            <Button href="/about" variant="navy">
              Discover Our Story
            </Button>
          </div>
        </Container>
      </Section>

      {/* ===================================================================
          3. FEATURED SERMON
          =================================================================== */}
      {featuredSermon ? (
        <Section tone="navy">
          <Container className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
            <div className="order-2 mx-auto w-full max-w-xs lg:order-1 lg:max-w-sm">
              {/* TODO: replace with real church photography */}
              <Arch className="aspect-[4/5] w-full shadow-xl shadow-black/40">
                {featuredSermon.thumbnailUrl ? (
                  <Image
                    src={featuredSermon.thumbnailUrl}
                    alt={`Sermon: ${featuredSermon.title}`}
                    width={600}
                    height={750}
                    className="h-full w-full object-cover"
                  />
                ) : null}
              </Arch>
            </div>

            <div className="order-1 lg:order-2">
              <ScriptureEyebrow
                reference={featuredSermon.scripture ?? "2 Timothy 4:2"}
                label="Latest Message"
              />
              <h2 className="mt-5 font-display text-3xl font-bold text-cream sm:text-4xl">
                {featuredSermon.title}
              </h2>
              <p className="mt-3 text-cream/70">
                {featuredSermon.speaker}
                {featuredSermon.series ? (
                  <>
                    <span aria-hidden="true" className="mx-2">
                      &middot;
                    </span>
                    {featuredSermon.series.title}
                  </>
                ) : null}
              </p>
              {featuredSermon.description ? (
                <p className="mt-5 max-w-lg leading-relaxed text-cream/80">
                  {featuredSermon.description}
                </p>
              ) : null}
              <div className="mt-8 flex flex-wrap gap-4">
                <Button href={`/sermons/${featuredSermon.slug}`} variant="gold">
                  Watch This Message
                </Button>
                <Button href="/sermons" variant="ghost">
                  Browse All Sermons
                </Button>
              </div>
            </div>
          </Container>
        </Section>
      ) : null}

      {/* ===================================================================
          4. MINISTRIES PREVIEW
          =================================================================== */}
      {ministries.length > 0 ? (
        <Section tone="cream">
          <Container>
            <div className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-end">
              <div className="max-w-xl">
                <ScriptureEyebrow
                  reference="1 Corinthians 12:27"
                  label="Get Involved"
                  className="text-gold-deep"
                />
                <h2 className="mt-5 font-display text-3xl font-bold text-navy sm:text-4xl">
                  Find Your Place to Belong
                </h2>
                <p className="mt-4 text-ink/80">
                  Every member matters. Explore the ministries where you can
                  grow, serve, and build life-giving relationships.
                </p>
              </div>
              <Link
                href="/ministries"
                className="shrink-0 rounded-sm font-mono text-sm uppercase tracking-[0.15em] text-gold-deep transition-colors hover:text-navy focus-ring-gold"
              >
                Explore all ministries &rarr;
              </Link>
            </div>

            <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {ministries.map((ministry) => (
                <MinistryCard key={ministry.id} ministry={ministry} />
              ))}
            </div>
          </Container>
        </Section>
      ) : null}

      {/* ===================================================================
          5. UPCOMING EVENTS
          =================================================================== */}
      {events.length > 0 ? (
        <Section tone="cream" className="pt-0">
          <Container>
            <div className="rounded-2xl border border-gold/30 bg-white/60 p-6 sm:p-10">
              <div className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-end">
                <div>
                  <ScriptureEyebrow
                    reference="Hebrews 10:25"
                    label="Gather"
                    className="text-gold-deep"
                  />
                  <h2 className="mt-5 font-display text-3xl font-bold text-navy sm:text-4xl">
                    Upcoming Events
                  </h2>
                </div>
                <Link
                  href="/events"
                  className="shrink-0 rounded-sm font-mono text-sm uppercase tracking-[0.15em] text-gold-deep transition-colors hover:text-navy focus-ring-gold"
                >
                  View calendar &rarr;
                </Link>
              </div>

              <div className="mt-8 grid gap-5 lg:grid-cols-3">
                {events.map((event) => (
                  <EventCard key={event.id} event={event} />
                ))}
              </div>
            </div>
          </Container>
        </Section>
      ) : null}

      {/* ===================================================================
          6. GIVING CTA BAND
          =================================================================== */}
      <section className="bg-navy text-cream">
        <Container className="flex flex-col items-center gap-6 py-16 text-center sm:py-20">
          <ScriptureEyebrow reference="2 Corinthians 9:7" label="Generosity" />
          <h2 className="max-w-2xl font-display text-3xl font-bold sm:text-4xl">
            Partner in What God Is Doing
          </h2>
          <p className="max-w-xl text-cream/80">
            Your generosity fuels worship, discipleship, and outreach that
            transforms lives across Plano and beyond. Give with a joyful heart.
          </p>
          <Button href="/give" variant="gold" size="lg">
            Give Online
          </Button>
        </Container>
      </section>

      {/* ===================================================================
          7. NEWSLETTER
          =================================================================== */}
      <Section tone="navy" className="border-t border-white/10">
        <Container className="grid gap-8 lg:grid-cols-2 lg:items-center lg:gap-16">
          <div>
            <ScriptureEyebrow reference="Proverbs 4:18" label="Stay Connected" />
            <h2 className="mt-5 font-display text-3xl font-bold text-cream sm:text-4xl">
              Don&rsquo;t Miss What&rsquo;s Next
            </h2>
            <p className="mt-4 max-w-md text-cream/80">
              Subscribe for occasional updates on services, events, and stories
              of what God is doing in our church family.
            </p>
          </div>
          <div className="lg:justify-self-end lg:max-w-md lg:w-full">
            <NewsletterForm />
          </div>
        </Container>
      </Section>
    </>
  );
}
