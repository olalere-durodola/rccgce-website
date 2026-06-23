"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { prisma } from "@/lib/db";
import { updateProfileCore, type UpdateProfileResult } from "./profile-core";

/**
 * State returned to the ProfileForm via `useActionState`.
 * `status` drives which message (and aria role) the form announces.
 */
export type ProfileState = {
  status: "idle" | "success" | "error";
  message?: string;
  errors?: Record<string, string>;
};

/**
 * Server action: update the current member's display name (and optional avatar
 * image URL).
 *
 * SECURITY: the underlying core resolves the target id from the server session
 * only — never from the form payload — so a member can only edit their own
 * record. Email is read-only (see profile-core for the rationale).
 *
 * On success we revalidate the account shell (so the greeting/avatar refresh)
 * and redirect with a `?updated=1` flag the page reads to confirm the save.
 */
export async function updateProfile(
  _prev: ProfileState,
  formData: FormData,
): Promise<ProfileState> {
  const result: UpdateProfileResult = await updateProfileCore(
    {
      name: formData.get("name"),
      image: formData.get("image"),
    },
    { db: prisma },
  );

  if (result.status === "unauthenticated") {
    redirect("/login?callbackUrl=/account/profile");
  }

  if (result.status === "error") {
    return {
      status: "error",
      message: result.message,
      errors: result.errors,
    };
  }

  revalidatePath("/account", "layout");
  redirect("/account/profile?updated=1");
}
