"use server";

import { contactSchema } from "@/lib/validation";

/**
 * State returned to the ContactForm via `useActionState`.
 * `status` drives which message (and aria role) the form announces.
 */
export type ContactState = {
  status: "idle" | "success" | "error";
  message?: string;
  /** Field-level errors keyed by field name (for aria-invalid + hints). */
  errors?: Partial<Record<"name" | "email" | "message", string>>;
};

/**
 * Handle a contact form submission.
 *
 * There is intentionally no Contact model in the schema, so we validate the
 * payload with Zod and acknowledge success. Wiring this to email/storage is a
 * TODO — but the validation (and thus the public contract + security posture)
 * is real and unit-tested here.
 */
export async function submitContact(
  _prev: ContactState,
  formData: FormData,
): Promise<ContactState> {
  const parsed = contactSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    message: formData.get("message"),
  });

  if (!parsed.success) {
    const fieldErrors = parsed.error.flatten().fieldErrors;
    return {
      status: "error",
      message: "Please correct the highlighted fields and try again.",
      errors: {
        name: fieldErrors.name?.[0],
        email: fieldErrors.email?.[0],
        message: fieldErrors.message?.[0],
      },
    };
  }

  // TODO: deliver to a mailbox or persist (no Contact model exists yet).
  // For now we log on the server so submissions are not silently lost in dev.
  console.info("[contact] submission received", {
    name: parsed.data.name,
    email: parsed.data.email,
  });

  return {
    status: "success",
    message:
      "Thank you for reaching out. Someone from our team will be in touch soon.",
  };
}
