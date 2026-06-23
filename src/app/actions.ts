"use server";

import { newsletterSchema } from "@/lib/validation";
import { prisma } from "@/lib/db";

/**
 * State returned to the NewsletterForm via `useActionState`.
 * `status` drives which message (and aria role) the form announces.
 */
export type NewsletterState = {
  status: "idle" | "success" | "error";
  message?: string;
};

/**
 * Subscribe an email to the newsletter. Idempotent: re-subscribing an existing
 * address succeeds quietly (upsert), so we never leak who is already signed up.
 */
export async function subscribeNewsletter(
  _prev: NewsletterState,
  formData: FormData,
): Promise<NewsletterState> {
  const parsed = newsletterSchema.safeParse({
    email: formData.get("email"),
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: "Please enter a valid email address.",
    };
  }

  const email = parsed.data.email.toLowerCase().trim();

  try {
    await prisma.newsletterSignup.upsert({
      where: { email },
      update: {},
      create: { email },
    });
  } catch {
    return {
      status: "error",
      message: "Something went wrong. Please try again.",
    };
  }

  return {
    status: "success",
    message: "You're subscribed. Watch your inbox for what God is doing here.",
  };
}
