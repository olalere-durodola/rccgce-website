import { Prisma } from "@prisma/client";

import { getCurrentUser, type GetSession } from "@/lib/rbac";
import { ministrySchema } from "@/lib/validation";
import { slugify } from "@/lib/utils";

/** See sermon-core for the shape rationale. */
export type MinistryMutationResult =
  | { status: "forbidden" }
  | { status: "error"; message: string; errors?: Record<string, string> }
  | { status: "ok"; slug: string };

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

/**
 * SECURITY: every mutation re-checks the admin role from the SERVER session
 * (defence in depth). A non-admin / unauthenticated caller returns `forbidden`
 * and we never reach the database.
 */
async function ensureAdmin(getSession?: GetSession): Promise<boolean> {
  const user = await getCurrentUser(getSession);
  return user?.role === "ADMIN";
}

function toData(parsed: ReturnType<typeof ministrySchema.parse>) {
  const nz = (v?: string) => (v && v.length > 0 ? v : null);
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

const SLUG_TAKEN: MinistryMutationResult = {
  status: "error",
  message: "That slug is already in use. Choose a different one.",
  errors: { slug: "This slug is already taken." },
};

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
