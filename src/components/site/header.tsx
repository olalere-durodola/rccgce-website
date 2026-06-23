"use client";

import * as React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { cn } from "@/lib/utils";

const NAV_LINKS = [
  { href: "/about", label: "About" },
  { href: "/ministries", label: "Ministries" },
  { href: "/sermons", label: "Sermons" },
  { href: "/events", label: "Events" },
  { href: "/visit", label: "Visit" },
] as const;

export function Header() {
  const [open, setOpen] = React.useState(false);

  return (
    <header className="sticky top-0 z-50 bg-navy text-cream shadow-sm shadow-navy/20">
      <Container>
        <div className="flex h-16 items-center justify-between gap-4">
          <Link
            href="/"
            className="font-display text-xl font-bold tracking-tight text-gold focus-ring-gold"
          >
            Covenant Embassy
          </Link>

          {/* Desktop nav */}
          <nav
            aria-label="Primary"
            className="hidden items-center gap-7 md:flex"
          >
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm font-medium text-cream/90 transition-colors hover:text-gold focus-ring-gold"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <Button href="/give" variant="gold" size="sm" className="hidden sm:inline-flex">
              Give
            </Button>

            {/* Mobile toggle */}
            <button
              type="button"
              aria-label="Toggle menu"
              aria-expanded={open}
              aria-controls="mobile-nav"
              onClick={() => setOpen((v) => !v)}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full text-cream focus-ring-gold md:hidden"
            >
              <span aria-hidden="true" className="text-xl leading-none">
                {open ? "✕" : "☰"}
              </span>
            </button>
          </div>
        </div>
      </Container>

      {/* Mobile drawer */}
      <nav
        id="mobile-nav"
        aria-label="Mobile"
        className={cn(
          "border-t border-white/10 md:hidden",
          open ? "block" : "hidden",
        )}
      >
        <Container>
          <ul className="flex flex-col gap-1 py-4">
            {NAV_LINKS.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className="block rounded-lg px-3 py-2 text-base font-medium text-cream/90 transition-colors hover:bg-white/5 hover:text-gold focus-ring-gold"
                >
                  {link.label}
                </Link>
              </li>
            ))}
            <li className="mt-2">
              <Button
                href="/give"
                variant="gold"
                size="md"
                className="w-full"
                onClick={() => setOpen(false)}
              >
                Give
              </Button>
            </li>
          </ul>
        </Container>
      </nav>
    </header>
  );
}
