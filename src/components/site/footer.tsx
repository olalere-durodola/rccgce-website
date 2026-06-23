import * as React from "react";
import Link from "next/link";
import { Container } from "@/components/ui/container";
import { ScriptureEyebrow } from "@/components/ui/scripture-eyebrow";

const QUICK_LINKS = [
  { href: "/about", label: "About" },
  { href: "/ministries", label: "Ministries" },
  { href: "/sermons", label: "Sermons" },
  { href: "/events", label: "Events" },
  { href: "/visit", label: "Visit" },
  { href: "/give", label: "Give" },
] as const;

const SOCIALS = [
  // TODO: replace with real social profile URLs
  { href: "#", label: "Facebook" },
  { href: "#", label: "Instagram" },
  { href: "#", label: "YouTube" },
] as const;

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="bg-navy text-cream">
      <Container>
        <div className="grid gap-10 py-14 sm:grid-cols-2 lg:grid-cols-4">
          {/* Brand + scripture */}
          <div className="space-y-3">
            <p className="font-display text-lg font-bold text-gold">
              RCCG Covenant Embassy
            </p>
            <ScriptureEyebrow reference="Genesis 17:7" label="Covenant" />
            <p className="text-sm text-cream/70">
              The Redeemed Christian Church of God
            </p>
          </div>

          {/* Service times */}
          <div className="space-y-2">
            <h2 className="font-mono text-xs uppercase tracking-[0.2em] text-gold">
              Service Times
            </h2>
            {/* TODO: real service times */}
            <ul className="space-y-1 text-sm text-cream/80">
              <li>Sundays 9:00 AM &amp; 11:00 AM</li>
              <li>Wednesday Bible Study 7:00 PM</li>
            </ul>
            <address className="not-italic pt-2 text-sm text-cream/70">
              {/* TODO: verify church address */}
              3900 Pebblecreek Court #102
              <br />
              Plano, TX 75023
            </address>
          </div>

          {/* Quick links */}
          <nav aria-label="Footer" className="space-y-2">
            <h2 className="font-mono text-xs uppercase tracking-[0.2em] text-gold">
              Explore
            </h2>
            <ul className="space-y-1 text-sm">
              {QUICK_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-cream/80 transition-colors hover:text-gold focus-ring-gold"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* Connect + newsletter slot */}
          <div className="space-y-3">
            <h2 className="font-mono text-xs uppercase tracking-[0.2em] text-gold">
              Connect
            </h2>
            <ul className="flex flex-wrap gap-3 text-sm">
              {SOCIALS.map((s) => (
                <li key={s.label}>
                  <a
                    href={s.href}
                    className="text-cream/80 transition-colors hover:text-gold focus-ring-gold"
                  >
                    {s.label}
                  </a>
                </li>
              ))}
            </ul>
            {/* Newsletter form slot — built in Phase 4 */}
            <p className="text-xs text-cream/50">
              {/* TODO: newsletter signup form (Phase 4) */}
              Newsletter signup coming soon.
            </p>
          </div>
        </div>

        <div className="border-t border-white/10 py-6 text-center text-xs text-cream/60">
          &copy; {year} RCCG Covenant Embassy. All rights reserved.
        </div>
      </Container>
    </footer>
  );
}
