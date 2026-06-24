import { ScriptureEyebrow } from "@/components/ui/scripture-eyebrow";
import { MinistryForm } from "@/components/site/ministry-form";

export const dynamic = "force-dynamic";

/** Create a new ministry. */
export default function NewMinistryPage() {
  return (
    <div className="space-y-8">
      <header>
        <ScriptureEyebrow reference="Ephesians 4:12" label="Serve" />
        <h1 className="mt-2 font-display text-3xl text-ink sm:text-4xl">
          New ministry
        </h1>
      </header>
      <MinistryForm />
    </div>
  );
}
