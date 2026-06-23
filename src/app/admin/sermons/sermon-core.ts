import { Prisma } from "@prisma/client";

import { getCurrentUser, type GetSession } from "@/lib/rbac";
import { sermonSchema } from "@/lib/validation";
import { slugify } from "@/lib/utils";

/**
 * Result of a sermon create/update/delete operation.
 *
 * - `forbidden` — no admin session; the DB is NEVER touched.
 * - `error` — validation or a slug collision; `errors` carries field messages.
 * - `ok` — the write succeeded; `slug` is the persisted slug (for revalidation).
 */
export type SermonMutationResult =
  | { status: "forbidden" }
  | { status: "error"; message: string; errors?: Record<string, string> }
  | { status: "ok"; slug: string };

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

/**
 * SECURITY: every mutation re-checks the admin role from the SERVER session
 * (defence in depth — the middleware only proves authentication, and the layout
 * gate doesn't protect a directly-invoked action). A non-admin / unauthenticated
 * caller returns `forbidden` and we never reach the database.
 */
async function ensureAdmin(getSession?: GetSession): Promise<boolean> {
  const user = await getCurrentUser(getSession);
  return user?.role === "ADMIN";
}

/** Map a parsed sermon into the prisma data shape (empty optionals -> null). */
function toData(parsed: ReturnType<typeof sermonSchema.parse>) {
  const nz = (v?: string) => (v && v.length > 0 ? v : null);
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

function fieldErrorsFrom(
  error: import("zod").ZodError,
): { message: string; errors: Record<string, string> } {
  const fieldErrors = error.flatten().fieldErrors as Record<
    string,
    string[] | undefined
  >;
  const errors: Record<string, string> = {};
  for (const key of Object.keys(fieldErrors)) {
    const msg = fieldErrors[key]?.[0];
    if (msg) errors[key] = msg;
  }
  return {
    message: "Please correct the highlighted fields and try again.",
    errors,
  };
}

/** True when a thrown error is a Prisma unique-constraint (P2002) violation. */
function isUniqueViolation(err: unknown): boolean {
  return (
    err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002"
  );
}

const SLUG_TAKEN: SermonMutationResult = {
  status: "error",
  message: "That slug is already in use. Choose a different one.",
  errors: { slug: "This slug is already taken." },
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
