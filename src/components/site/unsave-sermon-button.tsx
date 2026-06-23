"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { unsaveSermon } from "@/app/account/saved/actions";

/**
 * Remove-from-saved control for the member portal. Calls the `unsaveSermon`
 * server action (scoped to the session user) and hides the card optimistically.
 * If the session has expired the action returns `unauthenticated` and we route
 * to /login.
 */
export function UnsaveSermonButton({ sermonId }: { sermonId: string }) {
  const router = useRouter();
  const [removed, setRemoved] = useState(false);
  const [pending, startTransition] = useTransition();

  function onClick() {
    startTransition(async () => {
      const result = await unsaveSermon(sermonId);
      if (result.status === "unauthenticated") {
        router.push("/login?callbackUrl=/account/saved");
        return;
      }
      setRemoved(true);
      router.refresh();
    });
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={pending || removed}
      className="inline-flex items-center gap-1.5 rounded-full border border-navy/20 px-3 py-1.5 font-body text-xs font-medium text-muted transition-colors hover:border-red-600/40 hover:text-red-600 focus-ring-gold disabled:opacity-50"
    >
      <svg
        aria-hidden="true"
        viewBox="0 0 24 24"
        className="h-3.5 w-3.5"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M3 6h18M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2m-9 0v14a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V6" />
      </svg>
      {removed ? "Removed" : pending ? "Removing…" : "Remove"}
    </button>
  );
}
