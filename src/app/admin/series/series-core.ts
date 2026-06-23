import { Prisma } from "@prisma/client";

import { getCurrentUser, type GetSession } from "@/lib/rbac";
import { seriesSchema } from "@/lib/validation";
import { slugify } from "@/lib/utils";

/** See sermon-core for the shape rationale. */
export type SeriesMutationResult =
  | { status: "forbidden" }
  | { status: "error"; message: string; errors?: Record<string, string> }
  | { status: "ok"; slug: string };

/**
 * Minimal Prisma surface the core needs. The arg/return types are intentionally
 * loose (`any`) so BOTH the real `PrismaClient` (whose generated input types are
 * far stricter) and a hand-rolled test mock satisfy this contract. The core
 * always builds the `data`/`where` shapes itself, so the looseness here never
 * leaks untyped data into the database.
 */
/* eslint-disable @typescript-eslint/no-explicit-any */
export type SeriesStore = {
  series: {
    create: (args: any) => Promise<{ slug: string }>;
    update: (args: any) => Promise<{ slug: string }>;
    delete: (args: any) => Promise<any>;
  };
};
/* eslint-enable @typescript-eslint/no-explicit-any */

type CoreDeps = { db: SeriesStore; getSession?: GetSession };

async function ensureAdmin(getSession?: GetSession): Promise<boolean> {
  const user = await getCurrentUser(getSession);
  return user?.role === "ADMIN";
}

function toData(parsed: ReturnType<typeof seriesSchema.parse>) {
  const nz = (v?: string) => (v && v.length > 0 ? v : null);
  return {
    title: parsed.title,
    slug: parsed.slug,
    description: nz(parsed.description),
    imageUrl: nz(parsed.imageUrl),
  };
}

function fieldErrorsFrom(error: import("zod").ZodError) {
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

function isUniqueViolation(err: unknown): boolean {
  return (
    err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002"
  );
}

const SLUG_TAKEN: SeriesMutationResult = {
  status: "error",
  message: "That slug is already in use. Choose a different one.",
  errors: { slug: "This slug is already taken." },
};

function parseInput(input: Record<string, unknown>) {
  const rawSlug = typeof input.slug === "string" ? input.slug.trim() : "";
  const rawTitle = typeof input.title === "string" ? input.title : "";
  const slug = rawSlug ? slugify(rawSlug) : slugify(rawTitle);
  return seriesSchema.safeParse({ ...input, slug });
}

export async function createSeriesCore(
  input: Record<string, unknown>,
  deps: CoreDeps,
): Promise<SeriesMutationResult> {
  if (!(await ensureAdmin(deps.getSession))) return { status: "forbidden" };

  const parsed = parseInput(input);
  if (!parsed.success) {
    const { message, errors } = fieldErrorsFrom(parsed.error);
    return { status: "error", message, errors };
  }

  try {
    const created = await deps.db.series.create({ data: toData(parsed.data) });
    return { status: "ok", slug: created.slug };
  } catch (err) {
    if (isUniqueViolation(err)) return SLUG_TAKEN;
    throw err;
  }
}

export async function updateSeriesCore(
  id: string,
  input: Record<string, unknown>,
  deps: CoreDeps,
): Promise<SeriesMutationResult> {
  if (!(await ensureAdmin(deps.getSession))) return { status: "forbidden" };

  const parsed = parseInput(input);
  if (!parsed.success) {
    const { message, errors } = fieldErrorsFrom(parsed.error);
    return { status: "error", message, errors };
  }

  try {
    const updated = await deps.db.series.update({
      where: { id },
      data: toData(parsed.data),
    });
    return { status: "ok", slug: updated.slug };
  } catch (err) {
    if (isUniqueViolation(err)) return SLUG_TAKEN;
    throw err;
  }
}

export async function deleteSeriesCore(
  id: string,
  deps: CoreDeps,
): Promise<SeriesMutationResult> {
  if (!(await ensureAdmin(deps.getSession))) return { status: "forbidden" };
  if (!id) return { status: "error", message: "Missing series id." };
  const removed = (await deps.db.series.delete({ where: { id } })) as {
    slug?: string;
  } | null;
  return { status: "ok", slug: removed?.slug ?? "" };
}
