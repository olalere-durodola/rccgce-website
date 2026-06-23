import type { Metadata } from "next";
import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";
import { ScriptureEyebrow } from "@/components/ui/scripture-eyebrow";
import { GiveWidget } from "@/components/site/give-widget";

export const metadata: Metadata = {
  title: "Give | RCCG Covenant Embassy",
  description:
    "Partner with RCCG Covenant Embassy through your generosity. Give a one-time or recurring gift securely online to the Tithe, Offering, Missions, or Building fund.",
};

const FUND_NOTES = [
  {
    name: "Tithe",
    body: "Returning the first tenth in worship, honoring God as the source of all we have.",
  },
  {
    name: "Offering",
    body: "Free-will gifts that fuel weekly worship, discipleship, and the life of the church.",
  },
  {
    name: "Missions",
    body: "Taking the gospel beyond our walls — supporting outreach at home and abroad.",
  },
  {
    name: "Building",
    body: "Investing in the spaces where our church family gathers, grows, and serves.",
  },
];

export default function GivePage() {
  return (
    <>
      {/* Hero */}
      <section className="bg-navy text-cream">
        <Container className="max-w-3xl py-16 text-center sm:py-24">
          <ScriptureEyebrow
            reference="2 Corinthians 9:7"
            label="Cheerful Giver"
            className="justify-center"
          />
          <h1 className="mt-5 font-display text-4xl font-bold leading-tight sm:text-5xl">
            Give with a Joyful Heart
          </h1>
          <p className="mt-6 text-lg leading-relaxed text-cream/80">
            &ldquo;Each one must give as he has decided in his heart, not
            reluctantly or under compulsion, for God loves a cheerful giver.&rdquo;
            Your generosity fuels worship, discipleship, and outreach that
            transforms lives across Plano and beyond.
          </p>
        </Container>
      </section>

      {/* Giving form + funds */}
      <Section tone="cream">
        <Container className="grid gap-12 lg:grid-cols-[1fr_0.9fr] lg:gap-16">
          <div>
            <ScriptureEyebrow
              reference="Malachi 3:10"
              label="Give Online"
              className="text-gold-deep"
            />
            <h2 className="mt-5 font-display text-3xl font-bold text-navy sm:text-4xl">
              Make Your Gift
            </h2>
            <p className="mt-4 max-w-lg text-ink/80">
              Choose a fund, select a one-time or monthly gift, and give securely
              through PayPal — no account required. Every gift, large or small, is
              received with gratitude.
            </p>
            <div className="mt-8">
              <GiveWidget />
            </div>
          </div>

          {/* Funds explainer */}
          <aside className="lg:pt-2">
            <h3 className="font-display text-xl font-bold text-navy">
              Where Your Gift Goes
            </h3>
            <ul className="mt-5 space-y-4">
              {FUND_NOTES.map((fund) => (
                <li
                  key={fund.name}
                  className="rounded-2xl border border-gold/30 bg-white/60 p-5"
                >
                  <p className="font-mono text-xs uppercase tracking-[0.2em] text-gold-deep">
                    {fund.name}
                  </p>
                  <p className="mt-2 leading-relaxed text-ink/80">
                    {fund.body}
                  </p>
                </li>
              ))}
            </ul>
            <p className="mt-6 text-sm text-ink/60">
              Prefer to give in person? You can give during any service. Thank
              you for partnering in what God is doing.
            </p>
          </aside>
        </Container>
      </Section>
    </>
  );
}
