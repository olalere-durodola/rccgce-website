import { ScriptureEyebrow } from "@/components/ui/scripture-eyebrow";
import { SeriesForm } from "@/components/site/series-form";

/** Create a new series. */
export default function NewSeriesPage() {
  return (
    <div className="space-y-8">
      <header>
        <ScriptureEyebrow reference="Ecclesiastes 3:1" label="Seasons" />
        <h1 className="mt-2 font-display text-3xl text-ink sm:text-4xl">
          New series
        </h1>
      </header>
      <SeriesForm />
    </div>
  );
}
