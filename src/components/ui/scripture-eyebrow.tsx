import * as React from "react";
import { cn } from "@/lib/utils";

export type ScriptureEyebrowProps = React.HTMLAttributes<HTMLParagraphElement> & {
  /** A scripture reference, e.g. "Genesis 17:7". */
  reference: string;
  /** A short theme label, e.g. "Covenant". */
  label: string;
};

/**
 * Signature gold, monospaced, uppercase eyebrow.
 * Renders "GENESIS 17:7 — COVENANT".
 */
export function ScriptureEyebrow({
  reference,
  label,
  className,
  ...props
}: ScriptureEyebrowProps) {
  return (
    <p
      className={cn(
        "font-mono text-xs uppercase tracking-[0.2em] text-gold",
        className,
      )}
      {...props}
    >
      <span>{reference}</span>
      <span aria-hidden="true" className="mx-2 text-gold/70">
        &mdash;
      </span>
      <span>{label}</span>
    </p>
  );
}
