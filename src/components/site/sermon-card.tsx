import Link from "next/link";
import Image from "next/image";
import { format } from "date-fns";
import { Arch } from "@/components/ui/arch";
import { Badge } from "@/components/ui/badge";
import { ScriptureEyebrow } from "@/components/ui/scripture-eyebrow";

export type SermonCardData = {
  slug: string;
  title: string;
  speaker: string;
  date: Date;
  scripture?: string | null;
  thumbnailUrl?: string | null;
  series?: { title: string } | null;
};

/**
 * Sermon teaser. Cathedral-arch thumbnail, scripture eyebrow, title, speaker
 * and date. Links to the sermon detail page.
 */
export function SermonCard({ sermon }: { sermon: SermonCardData }) {
  return (
    <article className="group flex flex-col">
      <Link
        href={`/sermons/${sermon.slug}`}
        className="block rounded-sm focus-ring-gold"
      >
        {/* TODO: replace with real church photography */}
        <Arch className="aspect-[4/5] w-full transition-transform duration-300 group-hover:-translate-y-1 motion-reduce:transform-none">
          {sermon.thumbnailUrl ? (
            <Image
              src={sermon.thumbnailUrl}
              alt={`Sermon: ${sermon.title}`}
              width={600}
              height={750}
              className="h-full w-full object-cover"
            />
          ) : null}
        </Arch>
      </Link>

      <div className="mt-5 space-y-2">
        {sermon.scripture ? (
          <ScriptureEyebrow
            reference={sermon.scripture}
            label={sermon.series?.title ?? "Sermon"}
            className="text-gold-deep"
          />
        ) : sermon.series ? (
          <Badge tone="outline" className="text-gold-deep border-gold-deep/60">
            {sermon.series.title}
          </Badge>
        ) : null}

        <h3 className="font-display text-xl font-bold leading-snug text-navy">
          <Link
            href={`/sermons/${sermon.slug}`}
            className="rounded-sm transition-colors hover:text-royal focus-ring-gold"
          >
            {sermon.title}
          </Link>
        </h3>

        <p className="text-sm text-muted">
          <span className="font-medium text-ink">{sermon.speaker}</span>
          <span aria-hidden="true" className="mx-2">
            &middot;
          </span>
          <time dateTime={sermon.date.toISOString()}>
            {format(sermon.date, "MMMM d, yyyy")}
          </time>
        </p>
      </div>
    </article>
  );
}
