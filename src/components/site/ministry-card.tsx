import Link from "next/link";
import Image from "next/image";
import { Card } from "@/components/ui/card";

export type MinistryCardData = {
  slug: string;
  name: string;
  summary?: string | null;
  imageUrl?: string | null;
};

/**
 * Ministry teaser card: image, name, summary. Links to ministry detail.
 */
export function MinistryCard({ ministry }: { ministry: MinistryCardData }) {
  return (
    <Card
      hairline
      className="group flex h-full flex-col overflow-hidden p-0 transition-shadow hover:shadow-md hover:shadow-navy/10"
    >
      <Link
        href={`/ministries/${ministry.slug}`}
        className="flex h-full flex-col focus-ring-gold"
      >
        <div className="relative aspect-[16/10] w-full overflow-hidden">
          {/* TODO: replace with real church photography */}
          {ministry.imageUrl ? (
            <Image
              src={ministry.imageUrl}
              alt={ministry.name}
              fill
              sizes="(max-width: 768px) 100vw, 33vw"
              className="object-cover transition-transform duration-500 group-hover:scale-105 motion-reduce:transform-none"
            />
          ) : null}
        </div>

        <div className="flex flex-1 flex-col p-5 sm:p-6">
          <h3 className="font-display text-xl font-bold text-navy transition-colors group-hover:text-royal">
            {ministry.name}
          </h3>
          {ministry.summary ? (
            <p className="mt-2 flex-1 text-sm leading-relaxed text-ink/80">
              {ministry.summary}
            </p>
          ) : null}
          <span className="mt-4 font-mono text-xs uppercase tracking-[0.2em] text-gold-ink">
            Learn more &rarr;
          </span>
        </div>
      </Link>
    </Card>
  );
}
