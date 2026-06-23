"use client";

import { useActionState, useId, useRef, useState } from "react";

import { Input, Label, Textarea } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { slugify } from "@/lib/utils";
import {
  createEvent,
  updateEvent,
  type EventFormState,
} from "@/app/admin/events/actions";

export type EventFormValues = {
  id?: string;
  title?: string;
  slug?: string;
  description?: string;
  startsAt?: string; // yyyy-MM-ddTHH:mm
  endsAt?: string;
  location?: string;
  imageUrl?: string;
  isFeatured?: boolean;
};

type Props = {
  defaults?: EventFormValues;
};

const initialState: EventFormState = { status: "idle" };

function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return (
    <p id={id} className="mt-1 text-sm text-red-600">
      {message}
    </p>
  );
}

/**
 * Shared create/edit form for events. Posts to `createEvent` or `updateEvent`
 * (bound with the id) via `useActionState`. Slug auto-suggests from the title
 * until the user edits it; the server re-derives a blank slug from the title.
 */
export function EventForm({ defaults }: Props) {
  const isEdit = Boolean(defaults?.id);
  const action = isEdit ? updateEvent.bind(null, defaults!.id!) : createEvent;

  const [state, formAction, pending] = useActionState(action, initialState);

  const ids = {
    title: useId(),
    slug: useId(),
    description: useId(),
    startsAt: useId(),
    endsAt: useId(),
    location: useId(),
    imageUrl: useId(),
    imageFile: useId(),
    isFeatured: useId(),
  };

  const [slug, setSlug] = useState(defaults?.slug ?? "");
  const slugEdited = useRef(Boolean(defaults?.slug));

  function onTitleChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (!slugEdited.current) setSlug(slugify(e.target.value));
  }

  const err = (k: string) => state.errors?.[k];
  const describe = (k: string) =>
    err(k) ? `${ids[k as keyof typeof ids]}-err` : undefined;

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
            Used in the public URL: /events/{slug || "…"}
          </p>
        </div>

        <div>
          <Label htmlFor={ids.startsAt}>Starts at</Label>
          <Input
            id={ids.startsAt}
            name="startsAt"
            type="datetime-local"
            defaultValue={defaults?.startsAt}
            required
            aria-invalid={Boolean(err("startsAt"))}
            aria-describedby={describe("startsAt")}
          />
          <FieldError id={`${ids.startsAt}-err`} message={err("startsAt")} />
        </div>

        <div>
          <Label htmlFor={ids.endsAt}>Ends at (optional)</Label>
          <Input
            id={ids.endsAt}
            name="endsAt"
            type="datetime-local"
            defaultValue={defaults?.endsAt}
            aria-invalid={Boolean(err("endsAt"))}
            aria-describedby={describe("endsAt")}
          />
          <FieldError id={`${ids.endsAt}-err`} message={err("endsAt")} />
        </div>

        <div className="sm:col-span-2">
          <Label htmlFor={ids.location}>Location</Label>
          <Input
            id={ids.location}
            name="location"
            placeholder="e.g. Main Auditorium"
            defaultValue={defaults?.location}
          />
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

        <div className="sm:col-span-2">
          <Label htmlFor={ids.imageUrl}>Image URL</Label>
          <Input
            id={ids.imageUrl}
            name="imageUrl"
            type="url"
            inputMode="url"
            placeholder="https://…"
            defaultValue={defaults?.imageUrl}
            aria-invalid={Boolean(err("imageUrl"))}
            aria-describedby={describe("imageUrl")}
          />
          <FieldError id={`${ids.imageUrl}-err`} message={err("imageUrl")} />
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

        <div className="sm:col-span-2">
          <label className="flex items-center gap-2.5 font-body text-sm text-ink">
            <input
              id={ids.isFeatured}
              name="isFeatured"
              type="checkbox"
              value="on"
              defaultChecked={defaults?.isFeatured}
              className="h-4 w-4 rounded border-navy/30 text-navy focus-ring-gold"
            />
            Feature this event
          </label>
        </div>
      </div>

      <div className="flex items-center gap-3 pt-2">
        <Button type="submit" variant="navy" disabled={pending}>
          {pending ? "Saving…" : isEdit ? "Save changes" : "Create event"}
        </Button>
        <Button href="/admin/events" variant="ghost">
          Cancel
        </Button>
      </div>
    </form>
  );
}
