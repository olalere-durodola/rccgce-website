"use server";

import { redirect } from "next/navigation";
import { AuthError } from "next-auth";

import { signIn } from "@/lib/auth";
import { createUser } from "@/app/(auth)/register-core";

/**
 * Shape returned to the client form via `useActionState`.
 * `error` is set on failure; on success the action redirects (throws), so a
 * non-error return only happens when something is wrong.
 */
export type AuthFormState = { error?: string };

/**
 * Register a new member. On success, redirects to the login page with a
 * `registered=1` flag so the login form can show a success notice.
 */
export async function registerAction(
  _prev: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const result = await createUser({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!result.ok) {
    return { error: result.error };
  }

  // Successful registration — send them to login.
  redirect("/login?registered=1");
}

/**
 * Sign in with credentials. On success NextAuth redirects to /account; on
 * failure we return a friendly error for the form to announce.
 */
export async function loginAction(
  _prev: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  try {
    await signIn("credentials", {
      email: formData.get("email"),
      password: formData.get("password"),
      redirectTo: "/account",
    });
  } catch (error) {
    if (error instanceof AuthError) {
      // CredentialsSignin (and other auth errors) → invalid credentials.
      return { error: "Invalid email or password." };
    }
    // NEXT_REDIRECT is thrown by signIn on success — rethrow so Next handles it.
    throw error;
  }
  return {};
}

/** Start the Google OAuth flow (only rendered when Google is enabled). */
export async function googleSignInAction() {
  await signIn("google", { redirectTo: "/account" });
}
