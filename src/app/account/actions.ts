"use server";

import { signOut } from "@/lib/auth";

/**
 * Sign the current member out and return them to the homepage. Posted from the
 * AccountNav "Sign out" form so the action runs on the server with the session
 * cookie available.
 */
export async function signOutAction() {
  await signOut({ redirectTo: "/" });
}
