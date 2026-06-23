"use client";

import * as React from "react";
import { Container } from "@/components/ui/container";
import { Button } from "@/components/ui/button";
import { ScriptureEyebrow } from "@/components/ui/scripture-eyebrow";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  React.useEffect(() => {
    // TODO: wire to error reporting service
    console.error(error);
  }, [error]);

  return (
    <section className="bg-navy text-cream">
      <Container>
        <div className="mx-auto max-w-xl space-y-6 py-24 text-center lg:py-32">
          <ScriptureEyebrow reference="Psalm 46:1" label="Refuge" />
          <h1 className="font-display text-4xl font-bold text-gold sm:text-5xl">
            Something went wrong
          </h1>
          <p className="text-lg text-cream/80">
            An unexpected error occurred. Please try again.
          </p>
          <div className="flex justify-center gap-3">
            <Button variant="gold" onClick={() => reset()}>
              Try again
            </Button>
            <Button href="/" variant="outline">
              Back home
            </Button>
          </div>
        </div>
      </Container>
    </section>
  );
}
