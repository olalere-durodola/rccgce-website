"use client";

import { useId, useMemo, useState } from "react";
import { SermonCard, type SermonCardData } from "@/components/site/sermon-card";

/** A sermon row enriched with the searchable fields and series id. */
export type FilterableSermon = SermonCardData & {
  id: string;
  seriesId: string | null;
};

export type SeriesOption = { id: string; title: string };

type Props = {
  sermons: FilterableSermon[];
  series: SeriesOption[];
};

/**
 * Client-side searchable + series-filterable grid of sermons.
 *
 * Filtering runs entirely in the browser over the serialized list passed from
 * the server component (no network round-trips). Search matches title, speaker
 * and scripture; the series filter is a set of keyboard-operable buttons.
 * Accessible: the search field has an associated label and the result count is
 * announced via an aria-live region.
 */
export function SermonFilter({ sermons, series }: Props) {
  const searchId = useId();
  const [query, setQuery] = useState("");
  const [activeSeries, setActiveSeries] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return sermons.filter((s) => {
      if (activeSeries && s.seriesId !== activeSeries) return false;
      if (!q) return true;
      const haystack = [s.title, s.speaker, s.scripture ?? ""]
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [sermons, query, activeSeries]);

  return (
    <div>
      <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        {/* Search */}
        <div className="w-full max-w-md">
          <label
            htmlFor={searchId}
            className="mb-1.5 block font-mono text-xs uppercase tracking-[0.18em] text-gold-deep"
          >
            Search sermons
          </label>
          <input
            id={searchId}
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Title, speaker, or scripture..."
            className="w-full rounded-lg border border-navy/20 bg-cream px-3.5 py-2.5 text-base text-ink placeholder:text-muted transition-colors focus-ring-gold"
          />
        </div>

        {/* Series filter */}
        <div
          role="group"
          aria-label="Filter by series"
          className="flex flex-wrap gap-2"
        >
          <FilterChip
            active={activeSeries === null}
            onClick={() => setActiveSeries(null)}
          >
            All series
          </FilterChip>
          {series.map((s) => (
            <FilterChip
              key={s.id}
              active={activeSeries === s.id}
              onClick={() =>
                setActiveSeries((cur) => (cur === s.id ? null : s.id))
              }
            >
              {s.title}
            </FilterChip>
          ))}
        </div>
      </div>

      {/* Live result count for assistive tech */}
      <p aria-live="polite" className="sr-only">
        {filtered.length} sermon{filtered.length === 1 ? "" : "s"} found
      </p>

      {filtered.length > 0 ? (
        <div className="mt-10 grid gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((sermon) => (
            <SermonCard key={sermon.id} sermon={sermon} />
          ))}
        </div>
      ) : (
        <p className="mt-12 text-center text-ink/70">
          No sermons match your search. Try a different term or series.
        </p>
      )}
    </div>
  );
}

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={
        "rounded-full border px-4 py-1.5 font-mono text-xs uppercase tracking-[0.12em] transition-colors focus-ring-gold " +
        (active
          ? "border-navy bg-navy text-cream"
          : "border-navy/25 text-ink/80 hover:border-navy/60 hover:text-navy")
      }
    >
      {children}
    </button>
  );
}
