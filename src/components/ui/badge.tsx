import * as React from "react";
import { cn } from "@/lib/utils";

type Tone = "navy" | "gold" | "outline";

const tones: Record<Tone, string> = {
  navy: "bg-navy text-cream",
  gold: "bg-gold text-navy",
  outline: "border border-gold text-gold bg-transparent",
};

export type BadgeProps = React.HTMLAttributes<HTMLSpanElement> & {
  tone?: Tone;
};

export function Badge({ tone = "navy", className, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium font-mono uppercase tracking-wide",
        tones[tone],
        className,
      )}
      {...props}
    />
  );
}
