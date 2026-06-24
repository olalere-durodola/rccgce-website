import { notFound } from "next/navigation";

import { prisma } from "@/lib/db";
import { ScriptureEyebrow } from "@/components/ui/scripture-eyebrow";
import { MinistryForm } from "@/components/site/ministry-form";

export const dynamic = "force-dynamic";

/** Edit an existing ministry. */
export default async function EditMinistryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const ministry = await prisma.ministry.findUnique({ where: { id } });
  if (!ministry) notFound();

  return (
    <div className="space-y-8">
      <header>
        <ScriptureEyebrow reference="Ephesians 4:12" label="Serve" />
        <h1 className="mt-2 font-display text-3xl text-ink sm:text-4xl">
          Edit ministry
        </h1>
      </header>
      <MinistryForm
        defaults={{
          id: ministry.id,
          name: ministry.name,
          slug: ministry.slug,
          summary: ministry.summary ?? "",
          description: ministry.description ?? "",
          leader: ministry.leader ?? "",
          meetingTime: ministry.meetingTime ?? "",
          imageUrl: ministry.imageUrl ?? "",
        }}
      />
    </div>
  );
}
