"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toggleSavedSermon } from "@/app/(marketing)/sermons/actions";

type Props = {
  sermonId: string;
  slug: string;
  isLoggedIn: boolean;
  initialSaved: boolean;
};

/**
 * Save / unsave control for a sermon.
 *
 * - Logged-out visitors get a link to /login with a callbackUrl back to this
 *   sermon, so they return here after authenticating. We never render another
 *   user's saved state.
 * - Logged-in members get a button that calls the `toggleSavedSermon` action.
 *   We optimistically flip the label and reconcile with the server result. If
 *   the session has since expired the action returns `unauthenticated` and we
 *   route to /login.
 */
export function SaveSermonButton({
  sermonId,
  slug,
  isLoggedIn,
  initialSaved,
}: Props) {
  const router = useRouter();
  const [saved, setSaved] = useState(initialSaved);
  const [pending, startTransition] = useTransition();

  const callbackUrl = `/sermons/${slug}`;

  if (!isLoggedIn) {
    return (
      <a
        href={`/login?callbackUrl=${encodeURIComponent(callbackUrl)}`}
        className="inline-flex h-11 items-center justify-center gap-2 rounded-full border border-gold px-6 font-body font-medium text-gold transition-colors hover:bg-gold/10 focus-ring-gold"
      >
        <BookmarkIcon filled={false} />
        Save this sermon
      </a>
    );
  }

  function onClick() {
    startTransition(async () => {
      const result = await toggleSavedSermon(sermonId, slug);
      if (result.status === "unauthenticated") {
        router.push(`/login?callbackUrl=${encodeURIComponent(callbackUrl)}`);
        return;
      }
      setSaved(result.status === "saved");
    });
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={pending}
      aria-pressed={saved}
      className={
        "inline-flex h-11 items-center justify-center gap-2 rounded-full border px-6 font-body font-medium transition-colors focus-ring-gold disabled:opacity-50 " +
        (saved
          ? "border-gold bg-gold text-navy hover:bg-gold-deep"
          : "border-gold text-gold hover:bg-gold/10")
      }
    >
      <BookmarkIcon filled={saved} />
      {saved ? "Saved" : "Save this sermon"}
    </button>
  );
}

function BookmarkIcon({ filled }: { filled: boolean }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="h-4 w-4"
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M6 4h12a1 1 0 0 1 1 1v15l-7-4-7 4V5a1 1 0 0 1 1-1z" />
    </svg>
  );
}
