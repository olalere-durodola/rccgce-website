"use client";

import { useActionState, useId } from "react";
import { Input, Label } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  subscribeNewsletter,
  type NewsletterState,
} from "@/app/actions";

const initialState: NewsletterState = { status: "idle" };

/**
 * Accessible newsletter signup. Posts to the `subscribeNewsletter` server
 * action and announces success/error via a live region.
 */
export function NewsletterForm({ className }: { className?: string }) {
  const [state, formAction, pending] = useActionState(
    subscribeNewsletter,
    initialState,
  );
  const emailId = useId();

  return (
    <form action={formAction} className={className} noValidate>
      <Label htmlFor={emailId} className="text-cream">
        Email address
      </Label>
      <div className="mt-1.5 flex flex-col gap-2 sm:flex-row">
        <Input
          id={emailId}
          name="email"
          type="email"
          required
          autoComplete="email"
          placeholder="you@example.com"
          aria-invalid={state.status === "error"}
          className="sm:flex-1"
        />
        <Button type="submit" variant="gold" disabled={pending}>
          {pending ? "Subscribing..." : "Subscribe"}
        </Button>
      </div>

      {/* Live region: announces feedback without a focus change. */}
      <p
        role={state.status === "error" ? "alert" : "status"}
        aria-live="polite"
        className={
          "mt-2 min-h-[1.25rem] text-sm " +
          (state.status === "error"
            ? "text-red-300"
            : state.status === "success"
              ? "text-gold"
              : "sr-only")
        }
      >
        {state.message}
      </p>
    </form>
  );
}
