import Link from "next/link";
import Image from "next/image";
import { format } from "date-fns";

import { requireUser } from "@/lib/rbac";
import { prisma } from "@/lib/db";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Arch } from "@/components/ui/arch";
import { ScriptureEyebrow } from "@/components/ui/scripture-eyebrow";
import { UnsaveSermonButton } from "@/components/site/unsave-sermon-button";

/**
 * The member's saved sermons (SavedSermon joined to Sermon), newest-saved
 * first. Each item links to the sermon detail page and offers an unsave
 * control. Scoped to `userId = session user id`.
 */
export default async function SavedSermonsPage() {
  const user = await requireUser();
  const userId = user.id;

  const saved = await prisma.savedSermon.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    include: { sermon: { include: { series: { select: { title: true } } } } },
  });

  return (
    <div className="space-y-10">
      <header>
        <ScriptureEyebrow reference="Joshua 1:8" label="Meditate" />
        <h1 className="mt-3 font-display text-3xl text-navy sm:text-4xl">
          Saved sermons
        </h1>
        <p className="mt-2 max-w-prose font-body text-muted">
          Messages you&apos;ve bookmarked to revisit and meditate on.
        </p>
      </header>

      {saved.length === 0 ? (
        <Card hairline className="p-10 text-center">
          <p className="font-display text-xl text-navy">
            No saved sermons yet
          </p>
          <p className="mt-2 font-body text-muted">
            Browse the library and tap &ldquo;Save&rdquo; to keep messages here.
          </p>
          <div className="mt-6 flex justify-center">
            <Button href="/sermons" variant="gold">
              Explore sermons
            </Button>
          </div>
        </Card>
      ) : (
        <ul className="space-y-4">
          {saved.map(({ sermon }) => (
            <li key={sermon.id}>
              <Card hairline className="flex gap-4 p-4 sm:gap-5">
                <Link
                  href={`/sermons/${sermon.slug}`}
                  className="block shrink-0 rounded-sm focus-ring-gold"
                  aria-label={`View sermon: ${sermon.title}`}
                >
                  <Arch className="h-24 w-20">
                    {sermon.thumbnailUrl ? (
                      <Image
                        src={sermon.thumbnailUrl}
                        alt=""
                        width={160}
                        height={200}
                        className="h-full w-full object-cover"
                      />
                    ) : null}
                  </Arch>
                </Link>

                <div className="flex min-w-0 flex-1 flex-col">
                  {sermon.series ? (
                    <p className="font-mono text-xs uppercase tracking-[0.15em] text-gold-deep">
                      {sermon.series.title}
                    </p>
                  ) : null}
                  <h2 className="mt-0.5 font-display text-lg leading-snug text-navy">
                    <Link
                      href={`/sermons/${sermon.slug}`}
                      className="rounded-sm transition-colors hover:text-royal focus-ring-gold"
                    >
                      {sermon.title}
                    </Link>
                  </h2>
                  <p className="mt-1 font-body text-sm text-muted">
                    <span className="font-medium text-ink">
                      {sermon.speaker}
                    </span>
                    <span aria-hidden="true" className="mx-2">
                      &middot;
                    </span>
                    <time dateTime={sermon.date.toISOString()}>
                      {format(sermon.date, "MMMM d, yyyy")}
                    </time>
                  </p>
                  <div className="mt-auto pt-3">
                    <UnsaveSermonButton sermonId={sermon.id} />
                  </div>
                </div>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
