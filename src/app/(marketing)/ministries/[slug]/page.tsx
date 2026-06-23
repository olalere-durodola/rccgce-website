import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";
import { Button } from "@/components/ui/button";
import { ScriptureEyebrow } from "@/components/ui/scripture-eyebrow";

type Params = { slug: string };

export async function generateStaticParams() {
  const ministries = await prisma.ministry.findMany({ select: { slug: true } });
  return ministries.map((m) => ({ slug: m.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { slug } = await params;
  const ministry = await prisma.ministry.findUnique({ where: { slug } });
  if (!ministry) return { title: "Ministry not found | RCCG Covenant Embassy" };
  return {
    title: `${ministry.name} | RCCG Covenant Embassy`,
    description: ministry.summary ?? undefined,
  };
}

export default async function MinistryDetailPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { slug } = await params;
  const ministry = await prisma.ministry.findUnique({ where: { slug } });

  if (!ministry) {
    notFound();
  }

  return (
    <>
      {/* Hero */}
      <section className="relative isolate overflow-hidden bg-navy text-cream">
        {ministry.imageUrl ? (
          <>
            {/* TODO: replace with real church photography */}
            <Image
              src={ministry.imageUrl}
              alt=""
              fill
              priority
              sizes="100vw"
              className="object-cover opacity-30"
            />
            <div
              aria-hidden="true"
              className="absolute inset-0 bg-gradient-to-t from-navy via-navy/80 to-navy/50"
            />
          </>
        ) : null}

        <Container className="relative max-w-3xl py-20 text-center sm:py-28">
          <ScriptureEyebrow
            reference="Romans 12:6"
            label="Ministry"
            className="justify-center"
          />
          <h1 className="mt-5 font-display text-4xl font-bold leading-tight sm:text-5xl">
            {ministry.name}
          </h1>
          {ministry.summary ? (
            <p className="mt-6 text-lg leading-relaxed text-cream/85">
              {ministry.summary}
            </p>
          ) : null}
        </Container>
      </section>

      {/* Body */}
      <Section tone="cream">
        <Container className="grid gap-12 lg:grid-cols-[1.6fr_1fr] lg:gap-16">
          <div>
            <h2 className="font-display text-2xl font-bold text-navy sm:text-3xl">
              About this ministry
            </h2>
            <div className="mt-5 space-y-4 leading-relaxed text-ink/85">
              {(ministry.description ?? ministry.summary ?? "")
                .split("\n")
                .filter(Boolean)
                .map((para, i) => (
                  <p key={i}>{para}</p>
                ))}
            </div>
          </div>

          {/* Details + CTA */}
          <aside className="lg:pt-1">
            <div className="rounded-2xl border border-gold/40 bg-white/70 p-6 sm:p-7">
              <h2 className="font-mono text-xs uppercase tracking-[0.2em] text-gold-deep">
                Details
              </h2>
              <dl className="mt-4 space-y-4 text-sm">
                {ministry.leader ? (
                  <div>
                    <dt className="font-medium text-muted">Led by</dt>
                    {/* TODO: confirm leader */}
                    <dd className="mt-0.5 text-ink">{ministry.leader}</dd>
                  </div>
                ) : null}
                {ministry.meetingTime ? (
                  <div>
                    <dt className="font-medium text-muted">Meets</dt>
                    {/* TODO: confirm meeting time */}
                    <dd className="mt-0.5 text-ink">{ministry.meetingTime}</dd>
                  </div>
                ) : null}
              </dl>

              <div className="mt-6 space-y-3">
                <Button href="/contact" variant="navy" className="w-full">
                  Get Involved
                </Button>
                <Button href="/ministries" variant="ghost" className="w-full text-gold-deep hover:bg-navy/5">
                  &larr; All ministries
                </Button>
              </div>
            </div>
          </aside>
        </Container>
      </Section>
    </>
  );
}
