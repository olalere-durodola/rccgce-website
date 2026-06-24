import { notFound } from "next/navigation";

import { prisma } from "@/lib/db";
import { ScriptureEyebrow } from "@/components/ui/scripture-eyebrow";
import { SeriesForm } from "@/components/site/series-form";

export const dynamic = "force-dynamic";

/** Edit an existing series. */
export default async function EditSeriesPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const series = await prisma.series.findUnique({ where: { id } });
  if (!series) notFound();

  return (
    <div className="space-y-8">
      <header>
        <ScriptureEyebrow reference="Ecclesiastes 3:1" label="Seasons" />
        <h1 className="mt-2 font-display text-3xl text-ink sm:text-4xl">
          Edit series
        </h1>
      </header>
      <SeriesForm
        defaults={{
          id: series.id,
          title: series.title,
          slug: series.slug,
          description: series.description ?? "",
          imageUrl: series.imageUrl ?? "",
        }}
      />
    </div>
  );
}
