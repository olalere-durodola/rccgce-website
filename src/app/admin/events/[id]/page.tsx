import { notFound } from "next/navigation";
import { format } from "date-fns";

import { prisma } from "@/lib/db";
import { ScriptureEyebrow } from "@/components/ui/scripture-eyebrow";
import { EventForm } from "@/components/site/event-form";

export const dynamic = "force-dynamic";

/** Format a date for a <input type="datetime-local"> default value. */
const dtLocal = (d: Date) => format(d, "yyyy-MM-dd'T'HH:mm");

/** Edit an existing event. */
export default async function EditEventPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const event = await prisma.event.findUnique({ where: { id } });
  if (!event) notFound();

  return (
    <div className="space-y-8">
      <header>
        <ScriptureEyebrow reference="Ecclesiastes 3:1" label="Gather" />
        <h1 className="mt-2 font-display text-3xl text-ink sm:text-4xl">
          Edit event
        </h1>
      </header>
      <EventForm
        defaults={{
          id: event.id,
          title: event.title,
          slug: event.slug,
          description: event.description ?? "",
          startsAt: dtLocal(event.startsAt),
          endsAt: event.endsAt ? dtLocal(event.endsAt) : "",
          location: event.location ?? "",
          imageUrl: event.imageUrl ?? "",
          isFeatured: event.isFeatured,
        }}
      />
    </div>
  );
}
