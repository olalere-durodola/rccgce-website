import Link from "next/link";
import { format } from "date-fns";
import { Card } from "@/components/ui/card";

export type EventCardData = {
  slug: string;
  title: string;
  description?: string | null;
  startsAt: Date;
  location?: string | null;
};

/**
 * Event teaser with a calendar-style date block. Links to event detail.
 */
export function EventCard({ event }: { event: EventCardData }) {
  return (
    <Card
      hairline
      className="group flex h-full flex-col overflow-hidden transition-shadow hover:shadow-md hover:shadow-navy/10"
    >
      <Link
        href={`/events/${event.slug}`}
        className="flex h-full gap-5 p-5 focus-ring-gold sm:p-6"
      >
        {/* Date block */}
        <div
          aria-hidden="true"
          className="flex h-16 w-16 shrink-0 flex-col items-center justify-center rounded-lg bg-navy text-cream"
        >
          <span className="font-mono text-[0.65rem] uppercase tracking-[0.2em] text-gold">
            {format(event.startsAt, "MMM")}
          </span>
          <span className="font-display text-2xl font-bold leading-none">
            {format(event.startsAt, "d")}
          </span>
        </div>

        <div className="min-w-0 flex-1">
          <p className="font-mono text-xs uppercase tracking-wider text-muted">
            <time dateTime={event.startsAt.toISOString()}>
              {format(event.startsAt, "EEEE, h:mm a")}
            </time>
          </p>
          <h3 className="mt-1 font-display text-lg font-bold leading-snug text-navy transition-colors group-hover:text-royal">
            {event.title}
          </h3>
          {event.location ? (
            <p className="mt-1 text-sm text-muted">{event.location}</p>
          ) : null}
          {event.description ? (
            <p className="mt-2 line-clamp-2 text-sm text-ink/80">
              {event.description}
            </p>
          ) : null}
        </div>
      </Link>
    </Card>
  );
}
