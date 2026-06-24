"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { toggleSavedSermonCore, type ToggleSavedResult } from "./save-core";

/**
 * Server action: toggle whether the current user has saved a sermon.
 *
 * Returns `{ status: "unauthenticated" }` when there is no session so the
 * client can `router.push("/login?callbackUrl=...")`. On a successful toggle it
 * revalidates the sermon detail path so the server-rendered save state is fresh.
 */
export async function toggleSavedSermon(
  sermonId: string,
  slug: string,
): Promise<ToggleSavedResult> {
  const result = await toggleSavedSermonCore(sermonId, { db: prisma });

  if (result.status !== "unauthenticated") {
    revalidatePath(`/sermons/${slug}`);
  }

  return result;
}
