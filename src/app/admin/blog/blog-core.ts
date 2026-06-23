import { Prisma } from "@prisma/client";

import { getCurrentUser, type GetSession } from "@/lib/rbac";
import { blogPostSchema } from "@/lib/validation";
import { slugify } from "@/lib/utils";

/** See sermon-core for the shape rationale. */
export type BlogMutationResult =
  | { status: "forbidden" }
  | { status: "error"; message: string; errors?: Record<string, string> }
  | { status: "ok"; slug: string };

/* eslint-disable @typescript-eslint/no-explicit-any */
export type BlogStore = {
  blogPost: {
    create: (args: any) => Promise<{ slug: string }>;
    update: (args: any) => Promise<{ slug: string }>;
    delete: (args: any) => Promise<any>;
  };
};
/* eslint-enable @typescript-eslint/no-explicit-any */

type CoreDeps = { db: BlogStore; getSession?: GetSession };

/**
 * SECURITY: every mutation re-checks the admin role from the SERVER session
 * (defence in depth). Returns the authenticated user so create can stamp the
 * authorId from the session — NEVER from client input.
 */
async function adminUser(getSession?: GetSession) {
  const user = await getCurrentUser(getSession);
  return user?.role === "ADMIN" ? user : null;
}

function toData(parsed: ReturnType<typeof blogPostSchema.parse>) {
  const nz = (v?: string) => (v && v.length > 0 ? v : null);
  return {
    title: parsed.title,
    slug: parsed.slug,
    excerpt: nz(parsed.excerpt),
    body: parsed.body,
    coverImage: nz(parsed.coverImage),
    // empty datetime-local -> undefined here -> null (draft / unpublished)
    publishedAt: parsed.publishedAt ?? null,
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

const SLUG_TAKEN: BlogMutationResult = {
  status: "error",
  message: "That slug is already in use. Choose a different one.",
  errors: { slug: "This slug is already taken." },
};

/** Normalise + validate. Slug auto-derives from the title; empty date dropped. */
function parseInput(input: Record<string, unknown>) {
  const rawSlug = typeof input.slug === "string" ? input.slug.trim() : "";
  const rawTitle = typeof input.title === "string" ? input.title : "";
  const slug = rawSlug ? slugify(rawSlug) : slugify(rawTitle);
  const next: Record<string, unknown> = { ...input, slug };
  if (typeof next.publishedAt === "string" && next.publishedAt.trim() === "") {
    delete next.publishedAt;
  }
  return blogPostSchema.safeParse(next);
}

export async function createBlogPostCore(
  input: Record<string, unknown>,
  deps: CoreDeps,
): Promise<BlogMutationResult> {
  const user = await adminUser(deps.getSession);
  if (!user) return { status: "forbidden" };

  const parsed = parseInput(input);
  if (!parsed.success) {
    const { message, errors } = fieldErrorsFrom(parsed.error);
    return { status: "error", message, errors };
  }

  try {
    // authorId comes ONLY from the server session — never from client input.
    const created = await deps.db.blogPost.create({
      data: { ...toData(parsed.data), authorId: user.id ?? null },
    });
    return { status: "ok", slug: created.slug };
  } catch (err) {
    if (isUniqueViolation(err)) return SLUG_TAKEN;
    throw err;
  }
}

export async function updateBlogPostCore(
  id: string,
  input: Record<string, unknown>,
  deps: CoreDeps,
): Promise<BlogMutationResult> {
  const user = await adminUser(deps.getSession);
  if (!user) return { status: "forbidden" };

  const parsed = parseInput(input);
  if (!parsed.success) {
    const { message, errors } = fieldErrorsFrom(parsed.error);
    return { status: "error", message, errors };
  }

  try {
    // authorId is intentionally not changed on update (preserves original author).
    const updated = await deps.db.blogPost.update({
      where: { id },
      data: toData(parsed.data),
    });
    return { status: "ok", slug: updated.slug };
  } catch (err) {
    if (isUniqueViolation(err)) return SLUG_TAKEN;
    throw err;
  }
}

export async function deleteBlogPostCore(
  id: string,
  deps: CoreDeps,
): Promise<BlogMutationResult> {
  const user = await adminUser(deps.getSession);
  if (!user) return { status: "forbidden" };
  if (!id) return { status: "error", message: "Missing post id." };
  const removed = (await deps.db.blogPost.delete({ where: { id } })) as {
    slug?: string;
  } | null;
  return { status: "ok", slug: removed?.slug ?? "" };
}
