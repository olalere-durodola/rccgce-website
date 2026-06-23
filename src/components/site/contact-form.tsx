"use client";

import { useActionState, useId } from "react";
import { Input, Textarea, Label } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  submitContact,
  type ContactState,
} from "@/app/(marketing)/contact/actions";

const initialState: ContactState = { status: "idle" };

/**
 * Accessible contact form. Posts to the `submitContact` server action and
 * announces success/error via a live region. Field-level errors are surfaced
 * with aria-invalid + aria-describedby hints.
 */
export function ContactForm() {
  const [state, formAction, pending] = useActionState(
    submitContact,
    initialState,
  );
  const nameId = useId();
  const emailId = useId();
  const messageId = useId();
  const nameErrId = `${nameId}-err`;
  const emailErrId = `${emailId}-err`;
  const messageErrId = `${messageId}-err`;

  return (
    <form action={formAction} className="space-y-5" noValidate>
      <div>
        <Label htmlFor={nameId}>Name</Label>
        <Input
          id={nameId}
          name="name"
          required
          autoComplete="name"
          aria-invalid={Boolean(state.errors?.name)}
          aria-describedby={state.errors?.name ? nameErrId : undefined}
        />
        {state.errors?.name ? (
          <p id={nameErrId} className="mt-1 text-sm text-red-600">
            {state.errors.name}
          </p>
        ) : null}
      </div>

      <div>
        <Label htmlFor={emailId}>Email</Label>
        <Input
          id={emailId}
          name="email"
          type="email"
          required
          autoComplete="email"
          aria-invalid={Boolean(state.errors?.email)}
          aria-describedby={state.errors?.email ? emailErrId : undefined}
        />
        {state.errors?.email ? (
          <p id={emailErrId} className="mt-1 text-sm text-red-600">
            {state.errors.email}
          </p>
        ) : null}
      </div>

      <div>
        <Label htmlFor={messageId}>Message</Label>
        <Textarea
          id={messageId}
          name="message"
          rows={5}
          required
          aria-invalid={Boolean(state.errors?.message)}
          aria-describedby={state.errors?.message ? messageErrId : undefined}
        />
        {state.errors?.message ? (
          <p id={messageErrId} className="mt-1 text-sm text-red-600">
            {state.errors.message}
          </p>
        ) : null}
      </div>

      <Button type="submit" variant="navy" disabled={pending}>
        {pending ? "Sending..." : "Send Message"}
      </Button>

      {/* Live region: announces submission feedback without moving focus. */}
      <p
        role={state.status === "error" ? "alert" : "status"}
        aria-live="polite"
        className={
          "min-h-[1.25rem] text-sm " +
          (state.status === "error"
            ? "text-red-600"
            : state.status === "success"
              ? "text-gold-deep"
              : "sr-only")
        }
      >
        {state.message}
      </p>
    </form>
  );
}
