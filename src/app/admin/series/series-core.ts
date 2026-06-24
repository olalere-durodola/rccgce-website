import { type GetSession } from "@/lib/rbac";
import { seriesSchema } from "@/lib/validation";
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
export type SeriesMutationResult = MutationResult;

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

function toData(parsed: ReturnType<typeof seriesSchema.parse>) {
  return {
    title: parsed.title,
    slug: parsed.slug,
    description: nz(parsed.description),
    imageUrl: nz(parsed.imageUrl),
  };
}

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
