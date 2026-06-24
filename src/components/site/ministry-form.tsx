"use client";

import { useActionState, useId, useRef, useState } from "react";

import { Input, Label, Textarea } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { slugify } from "@/lib/utils";
import {
  createMinistry,
  updateMinistry,
  type MinistryFormState,
} from "@/app/admin/ministries/actions";

export type MinistryFormValues = {
  id?: string;
  name?: string;
  slug?: string;
  summary?: string;
  description?: string;
  leader?: string;
  meetingTime?: string;
  imageUrl?: string;
};

type Props = {
  defaults?: MinistryFormValues;
};

const initialState: MinistryFormState = { status: "idle" };

function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return (
    <p id={id} className="mt-1 text-sm text-red-600">
      {message}
    </p>
  );
}

/**
 * Shared create/edit form for ministries. Posts to `createMinistry` or
 * `updateMinistry` (bound with the id) via `useActionState`. Slug auto-suggests
 * from the name until the user edits it.
 */
export function MinistryForm({ defaults }: Props) {
  const isEdit = Boolean(defaults?.id);
  const action = isEdit
    ? updateMinistry.bind(null, defaults!.id!)
    : createMinistry;

  const [state, formAction, pending] = useActionState(action, initialState);

  const ids = {
    name: useId(),
    slug: useId(),
    summary: useId(),
    description: useId(),
    leader: useId(),
    meetingTime: useId(),
    imageUrl: useId(),
    imageFile: useId(),
  };

  const [slug, setSlug] = useState(defaults?.slug ?? "");
  const slugEdited = useRef(Boolean(defaults?.slug));

  function onNameChange(e: React.ChangeEvent<HTMLInputElement>) {
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
          <Label htmlFor={ids.name}>Name</Label>
          <Input
            id={ids.name}
            name="name"
            defaultValue={defaults?.name}
            onChange={onNameChange}
            required
            aria-invalid={Boolean(err("name"))}
            aria-describedby={describe("name")}
          />
          <FieldError id={`${ids.name}-err`} message={err("name")} />
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
            placeholder="auto-generated-from-name"
            aria-invalid={Boolean(err("slug"))}
            aria-describedby={describe("slug")}
          />
          <FieldError id={`${ids.slug}-err`} message={err("slug")} />
          <p className="mt-1 text-sm text-muted">
            Used in the public URL: /ministries/{slug || "…"}
          </p>
        </div>

        <div>
          <Label htmlFor={ids.leader}>Leader</Label>
          <Input
            id={ids.leader}
            name="leader"
            placeholder="e.g. Pastor Jane"
            defaultValue={defaults?.leader}
          />
        </div>

        <div>
          <Label htmlFor={ids.meetingTime}>Meeting time</Label>
          <Input
            id={ids.meetingTime}
            name="meetingTime"
            placeholder="e.g. Sundays 9am"
            defaultValue={defaults?.meetingTime}
          />
        </div>

        <div className="sm:col-span-2">
          <Label htmlFor={ids.summary}>Summary</Label>
          <Textarea
            id={ids.summary}
            name="summary"
            rows={2}
            defaultValue={defaults?.summary}
          />
        </div>

        <div className="sm:col-span-2">
          <Label htmlFor={ids.description}>Description</Label>
          <Textarea
            id={ids.description}
            name="description"
            rows={5}
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
      </div>

      <div className="flex items-center gap-3 pt-2">
        <Button type="submit" variant="navy" disabled={pending}>
          {pending ? "Saving…" : isEdit ? "Save changes" : "Create ministry"}
        </Button>
        <Button href="/admin/ministries" variant="ghost">
          Cancel
        </Button>
      </div>
    </form>
  );
}
