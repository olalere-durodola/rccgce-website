import * as React from "react";
import { cn } from "@/lib/utils";

export type CardProps = React.HTMLAttributes<HTMLDivElement> & {
  /** Adds a thin gold hairline border. */
  hairline?: boolean;
};

export function Card({ hairline, className, ...props }: CardProps) {
  return (
    <div
      className={cn(
        "rounded-xl bg-cream text-ink shadow-sm shadow-navy/5",
        hairline ? "border border-gold/40" : "border border-black/5",
        className,
      )}
      {...props}
    />
  );
}
