"use client";

import { useActionState, useId, useRef, useState } from "react";

import { Input, Label, Textarea } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { slugify } from "@/lib/utils";
import {
  createSeries,
  updateSeries,
  type SeriesFormState,
} from "@/app/admin/series/actions";

export type SeriesFormValues = {
  id?: string;
  title?: string;
  slug?: string;
  description?: string;
  imageUrl?: string;
};

type Props = { defaults?: SeriesFormValues };

const initialState: SeriesFormState = { status: "idle" };

/**
 * Shared create/edit form for series. Mirrors SermonForm: slug auto-suggested
 * from the title until edited, accessible labels + error summary, optional
 * image URL with a file-upload override.
 */
export function SeriesForm({ defaults }: Props) {
  const isEdit = Boolean(defaults?.id);
  const action = isEdit ? updateSeries.bind(null, defaults!.id!) : createSeries;

  const [state, formAction, pending] = useActionState(action, initialState);

  const ids = {
    title: useId(),
    slug: useId(),
    description: useId(),
    imageUrl: useId(),
    imageFile: useId(),
  };

  const [slug, setSlug] = useState(defaults?.slug ?? "");
  const slugEdited = useRef(Boolean(defaults?.slug));

  const err = (k: string) => state.errors?.[k];

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

      <div>
        <Label htmlFor={ids.title}>Title</Label>
        <Input
          id={ids.title}
          name="title"
          defaultValue={defaults?.title}
          onChange={(e) => {
            if (!slugEdited.current) setSlug(slugify(e.target.value));
          }}
          required
          aria-invalid={Boolean(err("title"))}
          aria-describedby={err("title") ? `${ids.title}-err` : undefined}
        />
        {err("title") ? (
          <p id={`${ids.title}-err`} className="mt-1 text-sm text-red-600">
            {err("title")}
          </p>
        ) : null}
      </div>

      <div>
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
          aria-describedby={err("slug") ? `${ids.slug}-err` : undefined}
        />
        {err("slug") ? (
          <p id={`${ids.slug}-err`} className="mt-1 text-sm text-red-600">
            {err("slug")}
          </p>
        ) : (
          <p className="mt-1 text-sm text-muted">/series/{slug || "…"}</p>
        )}
      </div>

      <div>
        <Label htmlFor={ids.description}>Description</Label>
        <Textarea
          id={ids.description}
          name="description"
          rows={4}
          defaultValue={defaults?.description}
        />
      </div>

      <div>
        <Label htmlFor={ids.imageUrl}>Image URL</Label>
        <Input
          id={ids.imageUrl}
          name="imageUrl"
          type="url"
          inputMode="url"
          placeholder="https://…"
          defaultValue={defaults?.imageUrl}
          aria-invalid={Boolean(err("imageUrl"))}
          aria-describedby={err("imageUrl") ? `${ids.imageUrl}-err` : undefined}
        />
        {err("imageUrl") ? (
          <p id={`${ids.imageUrl}-err`} className="mt-1 text-sm text-red-600">
            {err("imageUrl")}
          </p>
        ) : null}
        <Label htmlFor={ids.imageFile} className="mt-3">
          …or upload an image (overrides the URL above)
        </Label>
        <input
          id={ids.imageFile}
          name="imageFile"
          type="file"
          accept="image/*"
          className="block w-full text-sm text-ink file:mr-3 file:rounded-full file:border-0 file:bg-navy file:px-4 file:py-2 file:text-cream hover:file:bg-royal"
        />
      </div>

      <div className="flex items-center gap-3 pt-2">
        <Button type="submit" variant="navy" disabled={pending}>
          {pending ? "Saving…" : isEdit ? "Save changes" : "Create series"}
        </Button>
        <Button href="/admin/series" variant="ghost">
          Cancel
        </Button>
      </div>
    </form>
  );
}
