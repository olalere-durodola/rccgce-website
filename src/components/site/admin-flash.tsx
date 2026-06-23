import { Card } from "@/components/ui/card";

/**
 * Accessible confirmation banner for admin list pages. The CRUD actions redirect
 * back with `?saved=1` or `?deleted=1`; this reads that param (passed in by the
 * page) and announces the result politely to screen readers.
 *
 * Renders nothing when neither flag is present.
 */
export function AdminFlash({
  saved,
  deleted,
}: {
  saved?: string;
  deleted?: string;
}) {
  const message = saved ? "Saved." : deleted ? "Deleted." : null;
  if (!message) return null;

  return (
    <Card
      hairline
      role="status"
      aria-live="polite"
      className="border-gold/60 bg-gold/10 px-4 py-3 font-body text-sm font-medium text-navy"
    >
      {message}
    </Card>
  );
}
