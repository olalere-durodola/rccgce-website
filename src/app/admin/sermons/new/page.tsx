import { prisma } from "@/lib/db";
import { ScriptureEyebrow } from "@/components/ui/scripture-eyebrow";
import { SermonForm } from "@/components/site/sermon-form";

export const dynamic = "force-dynamic";

/** Create a new sermon. */
export default async function NewSermonPage() {
  const series = await prisma.series.findMany({
    orderBy: { title: "asc" },
    select: { id: true, title: true },
  });

  return (
    <div className="space-y-8">
      <header>
        <ScriptureEyebrow reference="2 Timothy 4:2" label="Preach" />
        <h1 className="mt-2 font-display text-3xl text-ink sm:text-4xl">
          New sermon
        </h1>
      </header>
      <SermonForm series={series} />
    </div>
  );
}
