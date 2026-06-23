"use client";

import { useActionState, useId } from "react";

import { Input, Label } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  updateProfile,
  type ProfileState,
} from "@/app/account/profile/actions";

type Props = {
  defaultName: string;
  defaultImage: string;
  email: string;
  /** True when redirected back with ?updated=1 after a successful save. */
  justUpdated?: boolean;
};

const initialState: ProfileState = { status: "idle" };

/**
 * Accessible profile edit form. Posts to the `updateProfile` server action,
 * which scopes the write to the session user id only.
 *
 * Email is rendered read-only (it is the login identity — see profile-core for
 * the rationale). Field errors surface via aria-invalid + aria-describedby; the
 * live region announces success/error without moving focus.
 */
export function ProfileForm({
  defaultName,
  defaultImage,
  email,
  justUpdated,
}: Props) {
  const [state, formAction, pending] = useActionState(
    updateProfile,
    initialState,
  );
  const nameId = useId();
  const imageId = useId();
  const emailId = useId();
  const nameErrId = `${nameId}-err`;
  const imageErrId = `${imageId}-err`;

  // Success arrives via redirect (?updated=1); errors via action state.
  const isError = state.status === "error";
  const isSuccess = !isError && justUpdated;

  return (
    <form action={formAction} className="space-y-5" noValidate>
      <div>
        <Label htmlFor={nameId}>Display name</Label>
        <Input
          id={nameId}
          name="name"
          defaultValue={defaultName}
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
        <Label htmlFor={imageId}>Avatar image URL</Label>
        <Input
          id={imageId}
          name="image"
          type="url"
          inputMode="url"
          placeholder="https://…"
          defaultValue={defaultImage}
          autoComplete="off"
          aria-invalid={Boolean(state.errors?.image)}
          aria-describedby={state.errors?.image ? imageErrId : undefined}
        />
        {state.errors?.image ? (
          <p id={imageErrId} className="mt-1 text-sm text-red-600">
            {state.errors.image}
          </p>
        ) : (
          <p className="mt-1 text-sm text-muted">
            Optional. Link to a photo of you.
          </p>
        )}
      </div>

      <div>
        <Label htmlFor={emailId}>Email</Label>
        <Input
          id={emailId}
          type="email"
          value={email}
          readOnly
          disabled
          aria-describedby={`${emailId}-note`}
        />
        <p id={`${emailId}-note`} className="mt-1 text-sm text-muted">
          Your email is your sign-in identity and can&apos;t be changed here.
        </p>
      </div>

      <Button type="submit" variant="navy" disabled={pending}>
        {pending ? "Saving…" : "Save changes"}
      </Button>

      {/* Live region: announces feedback without moving focus. */}
      <p
        role={isError ? "alert" : "status"}
        aria-live="polite"
        className={
          "min-h-[1.25rem] text-sm " +
          (isError
            ? "text-red-600"
            : isSuccess
              ? "text-gold-deep"
              : "sr-only")
        }
      >
        {isError
          ? state.message
          : isSuccess
            ? "Your profile has been updated."
            : ""}
      </p>
    </form>
  );
}
