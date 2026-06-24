import { Prisma } from "@prisma/client";

import { getCurrentUser, type GetSession, type SessionUser } from "@/lib/rbac";

/**
 * Shared building blocks for the admin CRUD cores (sermons, series, events,
 * ministries, blog). Each core keeps its own entity-specific `toData` /
 * `parseInput`; everything that was previously copy-pasted verbatim lives here
 * so the cores can't drift apart.
 */

/** The result shape every CRUD core returns. */
export type MutationResult =
  | { status: "forbidden" }
  | { status: "error"; message: string; errors?: Record<string, string> }
  | { status: "ok"; slug: string };

/** Coerce an empty/blank optional string to null for the DB layer. */
export const nz = (v?: string) => (v && v.length > 0 ? v : null);

/**
 * SECURITY: re-check the admin role from the SERVER session (defence in depth —
 * the layout gate doesn't protect a directly-invoked action). Returns true only
 * for an authenticated ADMIN.
 */
export async function ensureAdmin(getSession?: GetSession): Promise<boolean> {
  const user = await getCurrentUser(getSession);
  return user?.role === "ADMIN";
}

/**
 * Like {@link ensureAdmin} but returns the admin user (or null) so callers that
 * must stamp a server-derived field (e.g. blog authorId) can read its id —
 * NEVER from client input.
 */
export async function adminUser(
  getSession?: GetSession,
): Promise<SessionUser | null> {
  const user = await getCurrentUser(getSession);
  return user?.role === "ADMIN" ? user : null;
}

/** Flatten a ZodError into { message, errors: { field -> first message } }. */
export function fieldErrorsFrom(error: import("zod").ZodError) {
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
export function isUniqueViolation(err: unknown): boolean {
  return (
    err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002"
  );
}

/**
 * True when a thrown error is a Prisma foreign-key (P2003) violation — e.g. a
 * relation id (seriesId) that no longer exists because the parent was deleted
 * between form load and submit.
 */
export function isForeignKeyViolation(err: unknown): boolean {
  return (
    err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2003"
  );
}

/** Friendly result for a duplicate-slug collision (P2002 on the slug column). */
export const SLUG_TAKEN: MutationResult = {
  status: "error",
  message: "That slug is already in use. Choose a different one.",
  errors: { slug: "This slug is already taken." },
};
