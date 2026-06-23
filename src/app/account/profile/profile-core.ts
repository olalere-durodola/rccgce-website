import { z } from "zod";

import { getCurrentUser, type GetSession } from "@/lib/rbac";
import { profileSchema } from "@/lib/validation";

/**
 * Result of a profile update.
 *
 * - `unauthenticated` — no session; the caller should route to /login. We never
 *   touch the database, and we NEVER act on another user's record.
 * - `error` — validation failed; `errors` carries field-level messages.
 * - `ok` — the session user's own record was updated.
 */
export type UpdateProfileResult =
  | { status: "unauthenticated" }
  | { status: "error"; message: string; errors?: Record<string, string> }
  | { status: "ok" };

/**
 * Minimal Prisma surface the core needs, so it can be unit-tested with a
 * hand-rolled mock instead of the full client.
 */
export type ProfileStore = {
  user: {
    update: (args: {
      where: { id: string };
      data: { name: string; image: string | null };
    }) => Promise<unknown>;
  };
};

/**
 * Core profile-update logic, decoupled from the Next runtime so it is
 * unit-testable.
 *
 * SECURITY: the update `where` clause is built ONLY from the session user id
 * resolved from the server session — never from client-supplied input. A
 * caller cannot pass a user id to mutate someone else's record.
 *
 * EMAIL EDITING — design choice: email is intentionally NOT editable in v1.
 * The email is the login identity (Credentials authorize() looks the user up by
 * it, and OAuth account linking keys on it), so letting members change it adds
 * uniqueness-collision and identity-drift risk for little member value. The
 * profile form renders email read-only. (TODO: a verified email-change flow.)
 * We therefore only ever write `name` and `image`.
 */
export async function updateProfileCore(
  input: unknown,
  deps: {
    db: ProfileStore;
    getSession?: GetSession;
  },
): Promise<UpdateProfileResult> {
  const user = await getCurrentUser(deps.getSession);
  if (!user?.id) {
    return { status: "unauthenticated" };
  }

  const parsed = profileSchema.safeParse(input);
  if (!parsed.success) {
    const fieldErrors = parsed.error.flatten().fieldErrors as Record<
      string,
      string[] | undefined
    >;
    const errors: Record<string, string> = {};
    for (const key of Object.keys(fieldErrors)) {
      const msg = fieldErrors[key]?.[0];
      if (msg) errors[key] = msg;
    }
    return {
      status: "error",
      message: "Please correct the highlighted fields and try again.",
      errors,
    };
  }

  // `image` is optional and may be an empty string (cleared input) → store null.
  const image = parsed.data.image ? parsed.data.image : null;

  await deps.db.user.update({
    // Scoped to the SESSION user id only. No client-provided id is honoured.
    where: { id: user.id },
    data: { name: parsed.data.name, image },
  });

  return { status: "ok" };
}

export type ProfileInput = z.infer<typeof profileSchema>;
