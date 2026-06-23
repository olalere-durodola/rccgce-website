import type { Metadata } from "next";
import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";
import { ScriptureEyebrow } from "@/components/ui/scripture-eyebrow";
import { ContactForm } from "@/components/site/contact-form";

export const metadata: Metadata = {
  title: "Contact | RCCG Covenant Embassy",
  description:
    "Get in touch with RCCG Covenant Embassy in Plano, Texas. Send us a message, find our address, or connect with us online.",
};

// TODO: confirm contact details
const ADDRESS = "3900 Pebblecreek Court #102, Plano, TX 75023";
const PHONE = "(000) 000-0000"; // TODO: confirm phone
const EMAIL = "info@covenantembassy.org"; // TODO: confirm email

const SOCIALS = [
  // TODO: replace with real social profile URLs
  { href: "#", label: "Facebook" },
  { href: "#", label: "Instagram" },
  { href: "#", label: "YouTube" },
];

export default function ContactPage() {
  return (
    <>
      {/* Hero */}
      <section className="bg-navy text-cream">
        <Container className="max-w-3xl py-16 text-center sm:py-24">
          <ScriptureEyebrow
            reference="Jeremiah 33:3"
            label="Reach Out"
            className="justify-center"
          />
          <h1 className="mt-5 font-display text-4xl font-bold leading-tight sm:text-5xl">
            Get in Touch
          </h1>
          <p className="mt-6 text-lg leading-relaxed text-cream/80">
            Have a question, a prayer request, or just want to say hello?
            We&rsquo;d love to hear from you.
          </p>
        </Container>
      </section>

      <Section tone="cream">
        <Container className="grid gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:gap-16">
          {/* Form */}
          <div>
            <h2 className="font-display text-2xl font-bold text-navy sm:text-3xl">
              Send us a message
            </h2>
            <p className="mt-3 text-ink/80">
              Fill out the form below and a member of our team will get back to
              you as soon as we can.
            </p>
            <div className="mt-8">
              <ContactForm />
            </div>
          </div>

          {/* Details */}
          <aside className="lg:pt-1">
            <div className="rounded-2xl border border-gold/40 bg-white/70 p-6 sm:p-8">
              <h2 className="font-mono text-xs uppercase tracking-[0.2em] text-gold-deep">
                Church Details
              </h2>
              <dl className="mt-5 space-y-5 text-sm">
                <div>
                  <dt className="font-medium text-muted">Address</dt>
                  {/* TODO: confirm church address */}
                  <dd className="mt-1 not-italic text-ink">
                    <address className="not-italic">{ADDRESS}</address>
                  </dd>
                </div>
                <div>
                  <dt className="font-medium text-muted">Phone</dt>
                  {/* TODO: confirm phone */}
                  <dd className="mt-1 text-ink">
                    <a
                      href={`tel:${PHONE.replace(/[^\d+]/g, "")}`}
                      className="rounded-sm transition-colors hover:text-royal focus-ring-gold"
                    >
                      {PHONE}
                    </a>
                  </dd>
                </div>
                <div>
                  <dt className="font-medium text-muted">Email</dt>
                  {/* TODO: confirm email */}
                  <dd className="mt-1 text-ink">
                    <a
                      href={`mailto:${EMAIL}`}
                      className="rounded-sm transition-colors hover:text-royal focus-ring-gold"
                    >
                      {EMAIL}
                    </a>
                  </dd>
                </div>
                <div>
                  <dt className="font-medium text-muted">Service Times</dt>
                  {/* TODO: confirm service times */}
                  <dd className="mt-1 text-ink">
                    Sundays 9:00 &amp; 11:00 AM
                    <br />
                    Wednesday 7:00 PM
                  </dd>
                </div>
              </dl>

              <div className="mt-6 border-t border-navy/10 pt-5">
                <h3 className="font-mono text-xs uppercase tracking-[0.2em] text-gold-deep">
                  Follow Along
                </h3>
                <ul className="mt-3 flex flex-wrap gap-3 text-sm">
                  {SOCIALS.map((s) => (
                    <li key={s.label}>
                      <a
                        href={s.href}
                        className="rounded-sm text-ink/80 underline-offset-4 transition-colors hover:text-royal hover:underline focus-ring-gold"
                      >
                        {s.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </aside>
        </Container>
      </Section>
    </>
  );
}
