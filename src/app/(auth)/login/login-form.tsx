"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import {
  loginAction,
  googleSignInAction,
  type AuthFormState,
} from "@/app/(auth)/actions";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="navy" className="w-full" disabled={pending}>
      {pending ? "Signing in…" : "Sign in"}
    </Button>
  );
}

export function LoginForm({
  googleEnabled,
  registered,
}: {
  googleEnabled: boolean;
  registered: boolean;
}) {
  const [state, formAction] = useActionState<AuthFormState, FormData>(
    loginAction,
    {},
  );

  return (
    <div className="space-y-5">
      {registered ? (
        <p
          role="status"
          aria-live="polite"
          className="rounded-lg border border-green-700/30 bg-green-50 px-3.5 py-2.5 font-body text-sm text-green-800"
        >
          Account created. Please sign in.
        </p>
      ) : null}

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
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Password</Label>
            {/* Password reset deferred to a later phase. */}
            <Link
              href="#"
              className="mb-1.5 font-body text-xs text-muted hover:text-gold"
            >
              Forgot password?
            </Link>
          </div>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
          />
        </div>

        <SubmitButton />
      </form>

      {googleEnabled ? (
        <>
          <div className="flex items-center gap-3" aria-hidden="true">
            <span className="h-px flex-1 bg-navy/15" />
            <span className="font-mono text-xs uppercase tracking-[0.2em] text-muted">
              or
            </span>
            <span className="h-px flex-1 bg-navy/15" />
          </div>

          <form action={googleSignInAction}>
            <Button type="submit" variant="outline" className="w-full text-navy border-navy/30 hover:bg-navy/5">
              Continue with Google
            </Button>
          </form>
        </>
      ) : null}
    </div>
  );
}
