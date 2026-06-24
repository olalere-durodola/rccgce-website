import { prisma } from "@/lib/db";
import { getCurrentUser, type GetSession } from "@/lib/rbac";

/**
 * Result of a save-sermon toggle.
 *
 * - `unauthenticated` — no session; the client should redirect to /login.
 * - `saved` / `unsaved` — the new state of the SavedSermon row for this user.
 */
export type ToggleSavedResult =
  | { status: "unauthenticated" }
  | { status: "saved" }
  | { status: "unsaved" };

/**
 * Minimal Prisma surface needed by the core toggle, so it can be unit-tested
 * with a hand-rolled mock instead of the full client.
 */
export type SavedSermonStore = {
  savedSermon: {
    findUnique: (args: {
      where: { userId_sermonId: { userId: string; sermonId: string } };
    }) => Promise<unknown | null>;
    create: (args: {
      data: { userId: string; sermonId: string };
    }) => Promise<unknown>;
    delete: (args: {
      where: { userId_sermonId: { userId: string; sermonId: string } };
    }) => Promise<unknown>;
  };
};

/**
 * Core toggle logic, decoupled from the Next runtime so it is unit-testable.
 *
 * Auth handling: we resolve the current user from the session. When there is
 * no session we never touch the database and signal `unauthenticated` so the
 * caller can route the visitor to /login — we never act on another user's data.
 *
 * Toggling: if the (userId, sermonId) row exists we delete it (unsave),
 * otherwise we create it (save). Idempotent against races via try/catch on the
 * unique composite key.
 */
export async function toggleSavedSermonCore(
  sermonId: string,
  deps: {
    db: SavedSermonStore;
    getSession?: GetSession;
  },
): Promise<ToggleSavedResult> {
  const user = await getCurrentUser(deps.getSession);
  if (!user?.id) {
    return { status: "unauthenticated" };
  }

  const userId = user.id;
  const where = { userId_sermonId: { userId, sermonId } } as const;

  const existing = await deps.db.savedSermon.findUnique({ where });

  if (existing) {
    await deps.db.savedSermon.delete({ where });
    return { status: "unsaved" };
  }

  await deps.db.savedSermon.create({ data: { userId, sermonId } });
  return { status: "saved" };
}

/**
 * Returns whether the current user has saved a given sermon. Returns false for
 * anonymous visitors so the detail page never leaks another user's state.
 */
export async function isSermonSaved(
  sermonId: string,
  getSession?: GetSession,
): Promise<boolean> {
  const user = await getCurrentUser(getSession);
  if (!user?.id) return false;
  const row = await prisma.savedSermon.findUnique({
    where: { userId_sermonId: { userId: user.id, sermonId } },
  });
  return Boolean(row);
}
