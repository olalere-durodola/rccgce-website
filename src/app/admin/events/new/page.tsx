import { ScriptureEyebrow } from "@/components/ui/scripture-eyebrow";
import { EventForm } from "@/components/site/event-form";

export const dynamic = "force-dynamic";

/** Create a new event. */
export default function NewEventPage() {
  return (
    <div className="space-y-8">
      <header>
        <ScriptureEyebrow reference="Ecclesiastes 3:1" label="Gather" />
        <h1 className="mt-2 font-display text-3xl text-ink sm:text-4xl">
          New event
        </h1>
      </header>
      <EventForm />
    </div>
  );
}
