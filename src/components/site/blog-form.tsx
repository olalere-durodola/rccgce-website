"use client";

import { useActionState, useId, useRef, useState } from "react";

import { Input, Label, Textarea } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { slugify } from "@/lib/utils";
import {
  createBlogPost,
  updateBlogPost,
  type BlogFormState,
} from "@/app/admin/blog/actions";

export type BlogFormValues = {
  id?: string;
  title?: string;
  slug?: string;
  excerpt?: string;
  body?: string;
  coverImage?: string;
  publishedAt?: string; // yyyy-MM-ddTHH:mm
};

type Props = {
  defaults?: BlogFormValues;
};

const initialState: BlogFormState = { status: "idle" };

function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return (
    <p id={id} className="mt-1 text-sm text-red-600">
      {message}
    </p>
  );
}

/**
 * Shared create/edit form for blog posts. Posts to `createBlogPost` or
 * `updateBlogPost` (bound with the id) via `useActionState`. The author is set
 * server-side from the session — there is no author field here. Leaving
 * "Published at" empty keeps the post as a draft.
 */
export function BlogForm({ defaults }: Props) {
  const isEdit = Boolean(defaults?.id);
  const action = isEdit
    ? updateBlogPost.bind(null, defaults!.id!)
    : createBlogPost;

  const [state, formAction, pending] = useActionState(action, initialState);

  const ids = {
    title: useId(),
    slug: useId(),
    excerpt: useId(),
    body: useId(),
    coverImage: useId(),
    coverFile: useId(),
    publishedAt: useId(),
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
            Used in the public URL: /blog/{slug || "…"}
          </p>
        </div>

        <div className="sm:col-span-2">
          <Label htmlFor={ids.excerpt}>Excerpt</Label>
          <Textarea
            id={ids.excerpt}
            name="excerpt"
            rows={2}
            defaultValue={defaults?.excerpt}
          />
        </div>

        <div className="sm:col-span-2">
          <Label htmlFor={ids.body}>Body</Label>
          <Textarea
            id={ids.body}
            name="body"
            rows={14}
            defaultValue={defaults?.body}
            required
            className="font-mono text-sm"
            aria-invalid={Boolean(err("body"))}
            aria-describedby={describe("body")}
          />
          <FieldError id={`${ids.body}-err`} message={err("body")} />
          <p className="mt-1 text-sm text-muted">Markdown is supported.</p>
        </div>

        <div>
          <Label htmlFor={ids.publishedAt}>Published at</Label>
          <Input
            id={ids.publishedAt}
            name="publishedAt"
            type="datetime-local"
            defaultValue={defaults?.publishedAt}
            aria-invalid={Boolean(err("publishedAt"))}
            aria-describedby={describe("publishedAt")}
          />
          <FieldError
            id={`${ids.publishedAt}-err`}
            message={err("publishedAt")}
          />
          <p className="mt-1 text-sm text-muted">
            Leave empty to keep this post as a draft.
          </p>
        </div>

        <div className="sm:col-span-2">
          <Label htmlFor={ids.coverImage}>Cover image URL</Label>
          <Input
            id={ids.coverImage}
            name="coverImage"
            type="url"
            inputMode="url"
            placeholder="https://…"
            defaultValue={defaults?.coverImage}
            aria-invalid={Boolean(err("coverImage"))}
            aria-describedby={describe("coverImage")}
          />
          <FieldError
            id={`${ids.coverImage}-err`}
            message={err("coverImage")}
          />
          <Label htmlFor={ids.coverFile} className="mt-3">
            …or upload an image (overrides the URL above)
          </Label>
          <input
            id={ids.coverFile}
            name="coverFile"
            type="file"
            accept="image/*"
            className="block w-full text-sm text-ink file:mr-3 file:rounded-full file:border-0 file:bg-navy file:px-4 file:py-2 file:text-cream hover:file:bg-royal"
          />
        </div>
      </div>

      <div className="flex items-center gap-3 pt-2">
        <Button type="submit" variant="navy" disabled={pending}>
          {pending ? "Saving…" : isEdit ? "Save changes" : "Create post"}
        </Button>
        <Button href="/admin/blog" variant="ghost">
          Cancel
        </Button>
      </div>
    </form>
  );
}
