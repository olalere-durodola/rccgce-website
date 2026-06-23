"use server";

import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/db";
import { toggleSavedSermonCore } from "@/app/(marketing)/sermons/save-core";

/**
 * Server action: remove a sermon from the current member's saved list.
 *
 * Reuses the shared `toggleSavedSermonCore`, which scopes the row to the
 * session user id (never client input). After toggling we revalidate the
 * account saved page so the removed item disappears on refresh. Returns the
 * resulting status so the client can reconcile.
 */
export async function unsaveSermon(sermonId: string) {
  const result = await toggleSavedSermonCore(sermonId, { db: prisma });

  if (result.status !== "unauthenticated") {
    revalidatePath("/account/saved");
  }

  return result;
}
