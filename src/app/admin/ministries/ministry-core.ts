import { type GetSession } from "@/lib/rbac";
import { ministrySchema } from "@/lib/validation";
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
export type MinistryMutationResult = MutationResult;

/* eslint-disable @typescript-eslint/no-explicit-any */
export type MinistryStore = {
  ministry: {
    create: (args: any) => Promise<{ slug: string }>;
    update: (args: any) => Promise<{ slug: string }>;
    delete: (args: any) => Promise<any>;
  };
};
/* eslint-enable @typescript-eslint/no-explicit-any */

type CoreDeps = { db: MinistryStore; getSession?: GetSession };

function toData(parsed: ReturnType<typeof ministrySchema.parse>) {
  return {
    name: parsed.name,
    slug: parsed.slug,
    summary: nz(parsed.summary),
    description: nz(parsed.description),
    imageUrl: nz(parsed.imageUrl),
    leader: nz(parsed.leader),
    meetingTime: nz(parsed.meetingTime),
  };
}

/** Normalise + validate. Slug auto-derives from the name when blank. */
function parseInput(input: Record<string, unknown>) {
  const rawSlug = typeof input.slug === "string" ? input.slug.trim() : "";
  const rawName = typeof input.name === "string" ? input.name : "";
  const slug = rawSlug ? slugify(rawSlug) : slugify(rawName);
  return ministrySchema.safeParse({ ...input, slug });
}

export async function createMinistryCore(
  input: Record<string, unknown>,
  deps: CoreDeps,
): Promise<MinistryMutationResult> {
  if (!(await ensureAdmin(deps.getSession))) return { status: "forbidden" };

  const parsed = parseInput(input);
  if (!parsed.success) {
    const { message, errors } = fieldErrorsFrom(parsed.error);
    return { status: "error", message, errors };
  }

  try {
    const created = await deps.db.ministry.create({ data: toData(parsed.data) });
    return { status: "ok", slug: created.slug };
  } catch (err) {
    if (isUniqueViolation(err)) return SLUG_TAKEN;
    throw err;
  }
}

export async function updateMinistryCore(
  id: string,
  input: Record<string, unknown>,
  deps: CoreDeps,
): Promise<MinistryMutationResult> {
  if (!(await ensureAdmin(deps.getSession))) return { status: "forbidden" };

  const parsed = parseInput(input);
  if (!parsed.success) {
    const { message, errors } = fieldErrorsFrom(parsed.error);
    return { status: "error", message, errors };
  }

  try {
    const updated = await deps.db.ministry.update({
      where: { id },
      data: toData(parsed.data),
    });
    return { status: "ok", slug: updated.slug };
  } catch (err) {
    if (isUniqueViolation(err)) return SLUG_TAKEN;
    throw err;
  }
}

export async function deleteMinistryCore(
  id: string,
  deps: CoreDeps,
): Promise<MinistryMutationResult> {
  if (!(await ensureAdmin(deps.getSession))) return { status: "forbidden" };
  if (!id) return { status: "error", message: "Missing ministry id." };
  const removed = (await deps.db.ministry.delete({ where: { id } })) as {
    slug?: string;
  } | null;
  return { status: "ok", slug: removed?.slug ?? "" };
}
