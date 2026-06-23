import type { Metadata } from "next";
import Image from "next/image";
import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";
import { Button } from "@/components/ui/button";
import { Arch } from "@/components/ui/arch";
import { ScriptureEyebrow } from "@/components/ui/scripture-eyebrow";

export const metadata: Metadata = {
  title: "Plan Your Visit",
  description:
    "Planning your first visit to RCCG Covenant Embassy in Plano, Texas? Here's everything you need to know — service times, what to expect, parking, and kids.",
};

// TODO: confirm church address
const ADDRESS = "3900 Pebblecreek Court #102, Plano, TX 75023";
const MAP_EMBED_URL = `https://www.google.com/maps?q=${encodeURIComponent(
  ADDRESS,
)}&output=embed`;

const SERVICE_TIMES = [
  // TODO: confirm service times
  { day: "Sunday", label: "Celebration Services", time: "9:00 & 11:00 AM" },
  { day: "Wednesday", label: "Bible Study & Prayer", time: "7:00 PM" },
];

const EXPECT = [
  {
    title: "Warm Welcome",
    body: "From the parking lot to the lobby, our team is ready to greet you, answer questions, and help you feel at home.",
  },
  {
    title: "Heartfelt Worship",
    body: "Expect a Spirit-filled time of contemporary and gospel worship that lifts your eyes to Jesus.",
  },
  {
    title: "Practical Teaching",
    body: "Clear, encouraging messages rooted in the Bible that you can take into your everyday life.",
  },
  {
    title: "Real Community",
    body: "People of every age and background who genuinely care and would love to get to know you.",
  },
];

export default function VisitPage() {
  return (
    <>
      {/* Hero */}
      <section className="bg-navy text-cream">
        <Container className="max-w-3xl py-16 text-center sm:py-24">
          <ScriptureEyebrow
            reference="Psalm 122:1"
            label="Welcome"
            className="justify-center"
          />
          <h1 className="mt-5 font-display text-4xl font-bold leading-tight sm:text-5xl">
            Plan Your Visit
          </h1>
          <p className="mt-6 text-lg leading-relaxed text-cream/80">
            We can&rsquo;t wait to meet you. Whether it&rsquo;s your first time
            in church or you&rsquo;re looking for a new home, there is a place
            for you at Covenant Embassy.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Button href="#service-times" variant="gold" size="lg">
              Service Times
            </Button>
            <Button href="/contact" variant="outline" size="lg">
              Ask a Question
            </Button>
          </div>
        </Container>
      </section>

      {/* What to expect */}
      <Section tone="cream">
        <Container>
          <div className="max-w-2xl">
            <ScriptureEyebrow
              reference="Romans 15:7"
              label="What to Expect"
              className="text-gold-deep"
            />
            <h2 className="mt-5 font-display text-3xl font-bold text-navy sm:text-4xl">
              Come As You Are
            </h2>
            <p className="mt-4 text-ink/80">
              No matter where you are on your journey of faith, you are welcome
              here. Here&rsquo;s a glimpse of what a visit looks like.
            </p>
          </div>

          <div className="mt-10 grid gap-6 sm:grid-cols-2">
            {EXPECT.map((item) => (
              <div
                key={item.title}
                className="rounded-2xl border border-gold/30 bg-white/60 p-6 sm:p-7"
              >
                <h3 className="font-display text-xl font-bold text-navy">
                  {item.title}
                </h3>
                <p className="mt-2 leading-relaxed text-ink/80">{item.body}</p>
              </div>
            ))}
          </div>
        </Container>
      </Section>

      {/* Service times + good-to-know */}
      <Section tone="navy" id="service-times">
        <Container className="grid gap-12 lg:grid-cols-2 lg:gap-16">
          <div>
            <ScriptureEyebrow reference="Hebrews 10:25" label="Join Us" />
            <h2 className="mt-5 font-display text-3xl font-bold text-cream sm:text-4xl">
              Service Times
            </h2>
            <ul className="mt-8 space-y-5">
              {SERVICE_TIMES.map((s) => (
                <li
                  key={s.day}
                  className="flex items-baseline justify-between gap-4 border-b border-white/10 pb-5"
                >
                  <div>
                    <p className="font-display text-xl font-bold text-cream">
                      {s.day}
                    </p>
                    <p className="text-sm text-cream/70">{s.label}</p>
                  </div>
                  <p className="font-mono text-sm uppercase tracking-wider text-gold">
                    {s.time}
                  </p>
                </li>
              ))}
            </ul>
            <address className="mt-8 not-italic text-cream/80">
              {/* TODO: confirm church address */}
              {ADDRESS}
            </address>
          </div>

          {/* Good to know */}
          <div className="space-y-6">
            <GoodToKnow
              title="Parking & Accessibility"
              body="Free parking is available on-site, with accessible spaces near the main entrance. Our building and restrooms are wheelchair accessible — let a team member know if you need any assistance."
            />
            <GoodToKnow
              title="What to Wear"
              body="Come comfortable. You'll see everything from jeans to Sunday best — wear whatever helps you focus on worship."
            />
            <GoodToKnow
              title="Kids & Family"
              body="We offer a safe, fun, and Bible-centered children's environment during services. Our screened team will help you check your children in when you arrive."
            />
          </div>
        </Container>
      </Section>

      {/* Find us — map + photo */}
      <Section tone="cream">
        <Container className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          <div>
            <ScriptureEyebrow
              reference="Isaiah 56:7"
              label="Find Us"
              className="text-gold-deep"
            />
            <h2 className="mt-5 font-display text-3xl font-bold text-navy sm:text-4xl">
              We&rsquo;d Love to See You
            </h2>
            <p className="mt-4 text-ink/80">
              We gather in Plano, Texas. Use the map below for directions, and
              don&rsquo;t hesitate to reach out if you have any questions before
              you come.
            </p>
            <div className="mt-6 overflow-hidden rounded-2xl border border-gold/30 shadow-md shadow-navy/10">
              <iframe
                title={`Map to RCCG Covenant Embassy, ${ADDRESS}`}
                src={MAP_EMBED_URL}
                className="aspect-[4/3] w-full"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
            <div className="mt-6">
              <Button
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                  ADDRESS,
                )}`}
                variant="navy"
              >
                Get Directions
              </Button>
            </div>
          </div>

          <div className="mx-auto w-full max-w-sm">
            {/* TODO: replace with real church photography */}
            <Arch className="aspect-[4/5] w-full shadow-xl shadow-navy/10">
              <Image
                src="https://images.unsplash.com/photo-1529070538774-1843cb3265df?w=1000&q=80"
                alt="The Covenant Embassy church family welcoming guests"
                width={800}
                height={1000}
                className="h-full w-full object-cover"
              />
            </Arch>
          </div>
        </Container>
      </Section>
    </>
  );
}

function GoodToKnow({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
      <h3 className="font-mono text-xs uppercase tracking-[0.2em] text-gold">
        {title}
      </h3>
      <p className="mt-3 leading-relaxed text-cream/80">{body}</p>
    </div>
  );
}
