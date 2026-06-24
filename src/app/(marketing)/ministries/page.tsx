import type { Metadata } from "next";
import { prisma } from "@/lib/db";
import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";
import { ScriptureEyebrow } from "@/components/ui/scripture-eyebrow";
import { MinistryCard } from "@/components/site/ministry-card";

// Content is DB-backed and edited via the CMS, so render at request time rather
// than statically at build. On Railway the DB is migrated on deploy (after the
// build), and new content should appear without a rebuild.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Ministries",
  description:
    "Find your place to belong. Explore the ministries of RCCG Covenant Embassy for every age and season of life.",
};

export default async function MinistriesPage() {
  const ministries = await prisma.ministry.findMany({
    orderBy: { createdAt: "asc" },
  });

  return (
    <>
      <section className="bg-navy text-cream">
        <Container className="max-w-3xl py-16 text-center sm:py-24">
          <ScriptureEyebrow
            reference="1 Corinthians 12:27"
            label="Ministries"
            className="justify-center"
          />
          <h1 className="mt-5 font-display text-4xl font-bold leading-tight sm:text-5xl">
            Find Your Place to Belong
          </h1>
          <p className="mt-6 text-lg leading-relaxed text-cream/80">
            God has given every person gifts to share and a community in which to
            grow. Whatever your age or season, there is a place for you to
            connect, serve, and thrive at Covenant Embassy.
          </p>
        </Container>
      </section>

      <Section tone="cream">
        <Container>
          {ministries.length > 0 ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {ministries.map((ministry) => (
                <MinistryCard key={ministry.id} ministry={ministry} />
              ))}
            </div>
          ) : (
            <p className="text-center text-ink/70">
              Ministry details are coming soon. Please check back shortly.
            </p>
          )}
        </Container>
      </Section>
    </>
  );
}
