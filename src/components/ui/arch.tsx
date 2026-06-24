import * as React from "react";
import { cn } from "@/lib/utils";

export type ArchProps = React.HTMLAttributes<HTMLDivElement>;

/**
 * Cathedral-arch frame. Clips children (typically an <img> or next/image)
 * to a church-window silhouette and traces a 1px gold keyline around it.
 * Dependency-free CSS; responsive and reduced-motion safe.
 *
 * The rounded top is produced by an asymmetric border-radius
 * (`50% 50% 0 0 / 30% 30% 0 0`) applied to both the clipping wrapper and
 * the gold keyline border so the outline follows the arch exactly.
 */
const archShape = "[border-radius:50%_50%_0_0_/_30%_30%_0_0]";

export function Arch({ className, children, style, ...props }: ArchProps) {
  return (
    <div
      className={cn(
        "relative isolate overflow-hidden border border-gold bg-navy",
        archShape,
        className,
      )}
      style={style}
      {...props}
    >
      {/* Inner gold keyline echo for a refined double-line cathedral feel */}
      <span
        aria-hidden="true"
        className={cn(
          "pointer-events-none absolute inset-1.5 z-10 border border-gold/40",
          archShape,
        )}
      />
      {/* Children are clipped to the arch via the wrapper's overflow + radius.
          Force img/figure children to cover the frame. */}
      <div className={cn("h-full w-full [&>img]:h-full [&>img]:w-full [&>img]:object-cover", archShape)}>
        {children}
      </div>
    </div>
  );
}
