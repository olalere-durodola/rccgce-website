import { type GetSession } from "@/lib/rbac";
import { sermonSchema } from "@/lib/validation";
import { slugify } from "@/lib/utils";
import {
  type MutationResult,
  nz,
  ensureAdmin,
  fieldErrorsFrom,
  isUniqueViolation,
  isForeignKeyViolation,
  SLUG_TAKEN,
} from "@/app/admin/crud-helpers";

/**
 * Result of a sermon create/update/delete operation.
 *
 * - `forbidden` — no admin session; the DB is NEVER touched.
 * - `error` — validation, a slug collision, or a missing related series;
 *   `errors` carries field messages.
 * - `ok` — the write succeeded; `slug` is the persisted slug (for revalidation).
 */
export type SermonMutationResult = MutationResult;

/**
 * Minimal Prisma surface the core needs, so it can be unit-tested with a
 * hand-rolled mock instead of the full client.
 */
/* eslint-disable @typescript-eslint/no-explicit-any */
export type SermonStore = {
  sermon: {
    create: (args: any) => Promise<{ slug: string }>;
    update: (args: any) => Promise<{ slug: string }>;
    delete: (args: any) => Promise<any>;
  };
};
/* eslint-enable @typescript-eslint/no-explicit-any */

type CoreDeps = {
  db: SermonStore;
  getSession?: GetSession;
};

/** Map a parsed sermon into the prisma data shape (empty optionals -> null). */
function toData(parsed: ReturnType<typeof sermonSchema.parse>) {
  return {
    title: parsed.title,
    slug: parsed.slug,
    speaker: parsed.speaker,
    date: parsed.date,
    scripture: nz(parsed.scripture),
    description: nz(parsed.description),
    videoUrl: nz(parsed.videoUrl),
    audioUrl: nz(parsed.audioUrl),
    thumbnailUrl: nz(parsed.thumbnailUrl),
    seriesId: nz(parsed.seriesId),
  };
}

/**
 * Friendly result when the chosen series no longer exists (FK / P2003) — e.g.
 * it was deleted between form load and submit.
 */
const SERIES_MISSING: SermonMutationResult = {
  status: "error",
  message: "That series no longer exists — please pick another.",
  errors: { seriesId: "That series no longer exists — please pick another." },
};

/** Normalise + validate raw input. Auto-derives slug from title when blank. */
function parseInput(input: Record<string, unknown>) {
  const rawSlug = typeof input.slug === "string" ? input.slug.trim() : "";
  const rawTitle = typeof input.title === "string" ? input.title : "";
  const slug = rawSlug ? slugify(rawSlug) : slugify(rawTitle);
  return sermonSchema.safeParse({ ...input, slug });
}

export async function createSermonCore(
  input: Record<string, unknown>,
  deps: CoreDeps,
): Promise<SermonMutationResult> {
  if (!(await ensureAdmin(deps.getSession))) return { status: "forbidden" };

  const parsed = parseInput(input);
  if (!parsed.success) {
    const { message, errors } = fieldErrorsFrom(parsed.error);
    return { status: "error", message, errors };
  }

  try {
    const created = await deps.db.sermon.create({ data: toData(parsed.data) });
    return { status: "ok", slug: created.slug };
  } catch (err) {
    if (isUniqueViolation(err)) return SLUG_TAKEN;
    if (isForeignKeyViolation(err)) return SERIES_MISSING;
    throw err;
  }
}

export async function updateSermonCore(
  id: string,
  input: Record<string, unknown>,
  deps: CoreDeps,
): Promise<SermonMutationResult> {
  if (!(await ensureAdmin(deps.getSession))) return { status: "forbidden" };

  const parsed = parseInput(input);
  if (!parsed.success) {
    const { message, errors } = fieldErrorsFrom(parsed.error);
    return { status: "error", message, errors };
  }

  try {
    const updated = await deps.db.sermon.update({
      where: { id },
      data: toData(parsed.data),
    });
    return { status: "ok", slug: updated.slug };
  } catch (err) {
    if (isUniqueViolation(err)) return SLUG_TAKEN;
    if (isForeignKeyViolation(err)) return SERIES_MISSING;
    throw err;
  }
}

export async function deleteSermonCore(
  id: string,
  deps: CoreDeps,
): Promise<SermonMutationResult> {
  if (!(await ensureAdmin(deps.getSession))) return { status: "forbidden" };
  if (!id) {
    return { status: "error", message: "Missing sermon id." };
  }
  const removed = (await deps.db.sermon.delete({ where: { id } })) as {
    slug?: string;
  } | null;
  return { status: "ok", slug: removed?.slug ?? "" };
}
