"use client";

import { useActionState, useId, useRef, useState } from "react";

import { Input, Label, Textarea } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { slugify } from "@/lib/utils";
import {
  createSermon,
  updateSermon,
  type SermonFormState,
} from "@/app/admin/sermons/actions";

export type SermonFormValues = {
  id?: string;
  title?: string;
  slug?: string;
  speaker?: string;
  date?: string; // yyyy-mm-dd
  scripture?: string;
  description?: string;
  videoUrl?: string;
  audioUrl?: string;
  thumbnailUrl?: string;
  seriesId?: string;
};

type SeriesOption = { id: string; title: string };

type Props = {
  /** Present in edit mode; absent in create mode. */
  defaults?: SermonFormValues;
  series: SeriesOption[];
};

const initialState: SermonFormState = { status: "idle" };

/** Inline field-level error message, wired to the field via aria-describedby. */
function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return (
    <p id={id} className="mt-1 text-sm text-red-600">
      {message}
    </p>
  );
}

/**
 * Shared create/edit form for sermons. Posts to `createSermon` or
 * `updateSermon` (bound with the id) via `useActionState`.
 *
 * Accessibility: every field has a <Label>; invalid fields get aria-invalid +
 * aria-describedby; a top-of-form error summary uses role="alert" so screen
 * readers announce it on submit failure.
 *
 * Slug UX: auto-suggested from the title until the user edits the slug field
 * (after which we stop overwriting their choice). The server re-derives the
 * slug from the title when the slug is left blank, so this is purely a
 * convenience.
 */
export function SermonForm({ defaults, series }: Props) {
  const isEdit = Boolean(defaults?.id);
  const action = isEdit
    ? updateSermon.bind(null, defaults!.id!)
    : createSermon;

  const [state, formAction, pending] = useActionState(action, initialState);

  const ids = {
    title: useId(),
    slug: useId(),
    speaker: useId(),
    date: useId(),
    scripture: useId(),
    description: useId(),
    videoUrl: useId(),
    audioUrl: useId(),
    thumbnailUrl: useId(),
    thumbnailFile: useId(),
    seriesId: useId(),
  };

  const [slug, setSlug] = useState(defaults?.slug ?? "");
  const slugEdited = useRef(Boolean(defaults?.slug));

  function onTitleChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (!slugEdited.current) setSlug(slugify(e.target.value));
  }

  const err = (k: string) => state.errors?.[k];
  const describe = (k: string) => (err(k) ? `${ids[k as keyof typeof ids]}-err` : undefined);

  return (
    <form action={formAction} className="space-y-6" noValidate>
      {state.status === "error" && state.message ? (
        <div
          role="alert"
          className="rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          {state.message}
        </div>
      ) : null}

      <div className="grid gap-5 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <Label htmlFor={ids.title}>Title</Label>
          <Input
            id={ids.title}
            name="title"
            defaultValue={defaults?.title}
            onChange={onTitleChange}
            required
            aria-invalid={Boolean(err("title"))}
            aria-describedby={describe("title")}
          />
          <FieldError id={`${ids.title}-err`} message={err("title")} />
        </div>

        <div className="sm:col-span-2">
          <Label htmlFor={ids.slug}>Slug</Label>
          <Input
            id={ids.slug}
            name="slug"
            value={slug}
            onChange={(e) => {
              slugEdited.current = true;
              setSlug(e.target.value);
            }}
            placeholder="auto-generated-from-title"
            aria-invalid={Boolean(err("slug"))}
            aria-describedby={describe("slug")}
          />
          <FieldError id={`${ids.slug}-err`} message={err("slug")} />
          <p className="mt-1 text-sm text-muted">
            Used in the public URL: /sermons/{slug || "…"}
          </p>
        </div>

        <div>
          <Label htmlFor={ids.speaker}>Speaker</Label>
          <Input
            id={ids.speaker}
            name="speaker"
            defaultValue={defaults?.speaker}
            required
            aria-invalid={Boolean(err("speaker"))}
            aria-describedby={describe("speaker")}
          />
          <FieldError id={`${ids.speaker}-err`} message={err("speaker")} />
        </div>

        <div>
          <Label htmlFor={ids.date}>Date</Label>
          <Input
            id={ids.date}
            name="date"
            type="date"
            defaultValue={defaults?.date}
            required
            aria-invalid={Boolean(err("date"))}
            aria-describedby={describe("date")}
          />
          <FieldError id={`${ids.date}-err`} message={err("date")} />
        </div>

        <div>
          <Label htmlFor={ids.scripture}>Scripture</Label>
          <Input
            id={ids.scripture}
            name="scripture"
            placeholder="e.g. Genesis 17:7"
            defaultValue={defaults?.scripture}
            aria-invalid={Boolean(err("scripture"))}
            aria-describedby={describe("scripture")}
          />
          <FieldError id={`${ids.scripture}-err`} message={err("scripture")} />
        </div>

        <div>
          <Label htmlFor={ids.seriesId}>Series</Label>
          <select
            id={ids.seriesId}
            name="seriesId"
            defaultValue={defaults?.seriesId ?? ""}
            className="w-full rounded-lg border border-navy/20 bg-cream px-3.5 py-2.5 text-ink font-body text-base focus-ring-gold"
          >
            <option value="">— None —</option>
            {series.map((s) => (
              <option key={s.id} value={s.id}>
                {s.title}
              </option>
            ))}
          </select>
        </div>

        <div className="sm:col-span-2">
          <Label htmlFor={ids.description}>Description</Label>
          <Textarea
            id={ids.description}
            name="description"
            rows={4}
            defaultValue={defaults?.description}
          />
        </div>

        <div>
          <Label htmlFor={ids.videoUrl}>Video URL</Label>
          <Input
            id={ids.videoUrl}
            name="videoUrl"
            type="url"
            inputMode="url"
            placeholder="https://…"
            defaultValue={defaults?.videoUrl}
            aria-invalid={Boolean(err("videoUrl"))}
            aria-describedby={describe("videoUrl")}
          />
          <FieldError id={`${ids.videoUrl}-err`} message={err("videoUrl")} />
        </div>

        <div>
          <Label htmlFor={ids.audioUrl}>Audio URL</Label>
          <Input
            id={ids.audioUrl}
            name="audioUrl"
            type="url"
            inputMode="url"
            placeholder="https://…"
            defaultValue={defaults?.audioUrl}
            aria-invalid={Boolean(err("audioUrl"))}
            aria-describedby={describe("audioUrl")}
          />
          <FieldError id={`${ids.audioUrl}-err`} message={err("audioUrl")} />
        </div>

        <div className="sm:col-span-2">
          <Label htmlFor={ids.thumbnailUrl}>Thumbnail image URL</Label>
          <Input
            id={ids.thumbnailUrl}
            name="thumbnailUrl"
            type="url"
            inputMode="url"
            placeholder="https://…"
            defaultValue={defaults?.thumbnailUrl}
            aria-invalid={Boolean(err("thumbnailUrl"))}
            aria-describedby={describe("thumbnailUrl")}
          />
          <FieldError id={`${ids.thumbnailUrl}-err`} message={err("thumbnailUrl")} />
          <Label htmlFor={ids.thumbnailFile} className="mt-3">
            …or upload an image (overrides the URL above)
          </Label>
          <input
            id={ids.thumbnailFile}
            name="thumbnailFile"
            type="file"
            accept="image/*"
            className="block w-full text-sm text-ink file:mr-3 file:rounded-full file:border-0 file:bg-navy file:px-4 file:py-2 file:text-cream hover:file:bg-royal"
          />
        </div>
      </div>

      <div className="flex items-center gap-3 pt-2">
        <Button type="submit" variant="navy" disabled={pending}>
          {pending ? "Saving…" : isEdit ? "Save changes" : "Create sermon"}
        </Button>
        <Button href="/admin/sermons" variant="ghost">
          Cancel
        </Button>
      </div>
    </form>
  );
}
