import * as React from "react";
import { cn } from "@/lib/utils";

type Tone = "navy" | "cream";

const tones: Record<Tone, string> = {
  navy: "bg-navy text-cream",
  cream: "bg-cream text-ink",
};

export type SectionProps = React.HTMLAttributes<HTMLElement> & {
  tone?: Tone;
};

export function Section({
  tone = "cream",
  className,
  children,
  ...props
}: SectionProps) {
  return (
    <section
      className={cn("py-16 sm:py-20 lg:py-24", tones[tone], className)}
      {...props}
    >
      {children}
    </section>
  );
}
