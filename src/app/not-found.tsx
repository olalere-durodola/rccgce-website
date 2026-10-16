import { Container } from "@/components/ui/container";
import { Arch } from "@/components/ui/arch";
import { Button } from "@/components/ui/button";
import { ScriptureEyebrow } from "@/components/ui/scripture-eyebrow";

const KEY_LINKS = [
  { href: "/about", label: "About" },
  { href: "/sermons", label: "Sermons" },
  { href: "/events", label: "Events" },
  { href: "/visit", label: "Visit" },
] as const;

export default function NotFound() {
  return (
    <section className="bg-navy text-cream">
      <Container>
        <div className="grid items-center gap-12 py-20 md:grid-cols-2 lg:py-28">
          <div className="space-y-6">
            <ScriptureEyebrow reference="Psalm 23:3" label="He Restores" />
            <h1 className="font-display text-4xl font-bold text-gold sm:text-5xl">
              404
            </h1>
            <p className="max-w-md text-lg text-cream/80">
              This page wandered off — here&apos;s the way home.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button href="/" variant="gold">
                Back home
              </Button>
              {KEY_LINKS.map((link) => (
                <Button key={link.href} href={link.href} variant="outline">
                  {link.label}
                </Button>
              ))}
            </div>
          </div>

          <div className="mx-auto w-full max-w-xs">
            <Arch className="aspect-[3/4] w-full">
              <div className="flex h-full w-full items-center justify-center">
                <span className="font-display text-7xl text-gold/40">✝</span>
              </div>
            </Arch>
          </div>
        </div>
      </Container>
    </section>
  );
}
