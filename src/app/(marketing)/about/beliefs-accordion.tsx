"use client";

import { useId, useState } from "react";

export type Belief = {
  heading: string;
  body: string;
};

/**
 * Accessible disclosure list for the Statement of Beliefs. Each item is a
 * button with aria-expanded controlling a region; only one need be open at a
 * time but multiple may be opened independently.
 */
export function BeliefsAccordion({ beliefs }: { beliefs: Belief[] }) {
  const [open, setOpen] = useState<number | null>(0);
  const baseId = useId();

  return (
    <div className="divide-y divide-navy/10 border-y border-navy/10">
      {beliefs.map((belief, i) => {
        const isOpen = open === i;
        const panelId = `${baseId}-panel-${i}`;
        const btnId = `${baseId}-btn-${i}`;
        return (
          <div key={belief.heading}>
            <h3>
              <button
                id={btnId}
                type="button"
                aria-expanded={isOpen}
                aria-controls={panelId}
                onClick={() => setOpen(isOpen ? null : i)}
                className="flex w-full items-center justify-between gap-4 py-5 text-left focus-ring-gold"
              >
                <span className="font-display text-lg font-bold text-navy">
                  {belief.heading}
                </span>
                <span
                  aria-hidden="true"
                  className={
                    "shrink-0 text-2xl leading-none text-gold-ink transition-transform duration-200 motion-reduce:transition-none " +
                    (isOpen ? "rotate-45" : "")
                  }
                >
                  +
                </span>
              </button>
            </h3>
            <div
              id={panelId}
              role="region"
              aria-labelledby={btnId}
              hidden={!isOpen}
              className="pb-5"
            >
              <p className="max-w-2xl leading-relaxed text-ink/80">
                {belief.body}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
