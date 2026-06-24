"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { registerAction, type AuthFormState } from "@/app/(auth)/actions";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="navy" className="w-full" disabled={pending}>
      {pending ? "Creating account…" : "Create account"}
    </Button>
  );
}

export function RegisterForm() {
  const [state, formAction] = useActionState<AuthFormState, FormData>(
    registerAction,
    {},
  );

  return (
    <form action={formAction} className="space-y-4" noValidate>
      {state.error ? (
        <p
          role="alert"
          aria-live="assertive"
          className="rounded-lg border border-red-600/30 bg-red-50 px-3.5 py-2.5 font-body text-sm text-red-700"
        >
          {state.error}
        </p>
      ) : null}

      <div>
        <Label htmlFor="name">Full name</Label>
        <Input id="name" name="name" type="text" autoComplete="name" required />
      </div>

      <div>
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
        />
      </div>

      <div>
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          minLength={8}
          required
          aria-describedby="password-hint"
        />
        <p id="password-hint" className="mt-1 font-body text-xs text-muted">
          At least 8 characters.
        </p>
      </div>

      <SubmitButton />
    </form>
  );
}
