import * as React from "react";
import Link from "next/link";

import { Arch } from "@/components/ui/arch";
import { Container } from "@/components/ui/container";
import { ScriptureEyebrow } from "@/components/ui/scripture-eyebrow";

export type AuthShellProps = {
  reference: string;
  label: string;
  title: string;
  subtitle: string;
  children: React.ReactNode;
  /** Footer link row (e.g. "Already have an account? Sign in"). */
  footer: React.ReactNode;
};

/**
 * Branded navy auth panel with the cathedral Arch motif and a ScriptureEyebrow.
 * Shared by the login and register pages for a consistent premium feel.
 */
export function AuthShell({
  reference,
  label,
  title,
  subtitle,
  children,
  footer,
}: AuthShellProps) {
  return (
    <main className="min-h-screen bg-navy py-16 text-cream sm:py-24">
      <Container className="max-w-md">
        <div className="mb-8 flex justify-center">
          <Arch className="h-20 w-16">
            <div className="flex h-full w-full items-center justify-center">
              <span className="font-display text-2xl text-gold">CE</span>
            </div>
          </Arch>
        </div>

        <div className="mb-8 text-center">
          <ScriptureEyebrow
            reference={reference}
            label={label}
            className="justify-center"
          />
          <h1 className="mt-3 font-display text-3xl text-cream sm:text-4xl">
            {title}
          </h1>
          <p className="mt-2 font-body text-sm text-cream/70">{subtitle}</p>
        </div>

        <div className="rounded-2xl border border-gold/20 bg-cream p-6 text-ink shadow-lg shadow-black/20 sm:p-8">
          {children}
        </div>

        <div className="mt-6 text-center font-body text-sm text-cream/70">
          {footer}
        </div>

        <p className="mt-8 text-center font-mono text-xs uppercase tracking-[0.2em] text-cream/40">
          <Link href="/" className="hover:text-gold">
            Return home
          </Link>
        </p>
      </Container>
    </main>
  );
}
