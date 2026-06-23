import { type GetSession } from "@/lib/rbac";
import { eventSchema } from "@/lib/validation";
import { slugify } from "@/lib/utils";
import {
  type MutationResult,
  nz,
  ensureAdmin,
  fieldErrorsFrom,
  isUniqueViolation,
  SLUG_TAKEN,
} from "@/app/admin/crud-helpers";

/** See sermon-core for the shape rationale. */
export type EventMutationResult = MutationResult;

/* eslint-disable @typescript-eslint/no-explicit-any */
export type EventStore = {
  event: {
    create: (args: any) => Promise<{ slug: string }>;
    update: (args: any) => Promise<{ slug: string }>;
    delete: (args: any) => Promise<any>;
  };
};
/* eslint-enable @typescript-eslint/no-explicit-any */

type CoreDeps = { db: EventStore; getSession?: GetSession };

function toData(parsed: ReturnType<typeof eventSchema.parse>) {
  return {
    title: parsed.title,
    slug: parsed.slug,
    description: nz(parsed.description),
    startsAt: parsed.startsAt,
    endsAt: parsed.endsAt ?? null,
    location: nz(parsed.location),
    imageUrl: nz(parsed.imageUrl),
    isFeatured: parsed.isFeatured,
  };
}

function parseInput(input: Record<string, unknown>) {
  const rawSlug = typeof input.slug === "string" ? input.slug.trim() : "";
  const rawTitle = typeof input.title === "string" ? input.title : "";
  const slug = rawSlug ? slugify(rawSlug) : slugify(rawTitle);
  // Empty optional dates arrive as "" — drop them so the coercion doesn't fail.
  const next: Record<string, unknown> = { ...input, slug };
  if (typeof next.endsAt === "string" && next.endsAt.trim() === "") {
    delete next.endsAt;
  }
  return eventSchema.safeParse(next);
}

export async function createEventCore(
  input: Record<string, unknown>,
  deps: CoreDeps,
): Promise<EventMutationResult> {
  if (!(await ensureAdmin(deps.getSession))) return { status: "forbidden" };

  const parsed = parseInput(input);
  if (!parsed.success) {
    const { message, errors } = fieldErrorsFrom(parsed.error);
    return { status: "error", message, errors };
  }

  try {
    const created = await deps.db.event.create({ data: toData(parsed.data) });
    return { status: "ok", slug: created.slug };
  } catch (err) {
    if (isUniqueViolation(err)) return SLUG_TAKEN;
    throw err;
  }
}

export async function updateEventCore(
  id: string,
  input: Record<string, unknown>,
  deps: CoreDeps,
): Promise<EventMutationResult> {
  if (!(await ensureAdmin(deps.getSession))) return { status: "forbidden" };

  const parsed = parseInput(input);
  if (!parsed.success) {
    const { message, errors } = fieldErrorsFrom(parsed.error);
    return { status: "error", message, errors };
  }

  try {
    const updated = await deps.db.event.update({
      where: { id },
      data: toData(parsed.data),
    });
    return { status: "ok", slug: updated.slug };
  } catch (err) {
    if (isUniqueViolation(err)) return SLUG_TAKEN;
    throw err;
  }
}

export async function deleteEventCore(
  id: string,
  deps: CoreDeps,
): Promise<EventMutationResult> {
  if (!(await ensureAdmin(deps.getSession))) return { status: "forbidden" };
  if (!id) return { status: "error", message: "Missing event id." };
  const removed = (await deps.db.event.delete({ where: { id } })) as {
    slug?: string;
  } | null;
  return { status: "ok", slug: removed?.slug ?? "" };
}
