import { notFound } from "next/navigation";
import { format } from "date-fns";

import { prisma } from "@/lib/db";
import { ScriptureEyebrow } from "@/components/ui/scripture-eyebrow";
import { SermonForm } from "@/components/site/sermon-form";

export const dynamic = "force-dynamic";

/** Edit an existing sermon. */
export default async function EditSermonPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [sermon, series] = await Promise.all([
    prisma.sermon.findUnique({ where: { id } }),
    prisma.series.findMany({
      orderBy: { title: "asc" },
      select: { id: true, title: true },
    }),
  ]);

  if (!sermon) notFound();

  return (
    <div className="space-y-8">
      <header>
        <ScriptureEyebrow reference="2 Timothy 4:2" label="Preach" />
        <h1 className="mt-2 font-display text-3xl text-ink sm:text-4xl">
          Edit sermon
        </h1>
      </header>
      <SermonForm
        series={series}
        defaults={{
          id: sermon.id,
          title: sermon.title,
          slug: sermon.slug,
          speaker: sermon.speaker,
          date: format(sermon.date, "yyyy-MM-dd"),
          scripture: sermon.scripture ?? "",
          description: sermon.description ?? "",
          videoUrl: sermon.videoUrl ?? "",
          audioUrl: sermon.audioUrl ?? "",
          thumbnailUrl: sermon.thumbnailUrl ?? "",
          seriesId: sermon.seriesId ?? "",
        }}
      />
    </div>
  );
}
