import Link from "next/link";
import { format } from "date-fns";

import { prisma } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScriptureEyebrow } from "@/components/ui/scripture-eyebrow";
import { deleteEvent } from "./actions";

export const dynamic = "force-dynamic";

/** Admin events list: every event with Edit + Delete and a "New event" button. */
export default async function AdminEventsPage() {
  const events = await prisma.event.findMany({ orderBy: { startsAt: "desc" } });

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <ScriptureEyebrow reference="Ecclesiastes 3:1" label="Gather" />
          <h1 className="mt-2 font-display text-3xl text-ink sm:text-4xl">
            Events
          </h1>
        </div>
        <Button href="/admin/events/new" variant="gold">
          New event
        </Button>
      </header>

      {events.length === 0 ? (
        <Card hairline className="p-10 text-center">
          <p className="font-body text-muted">No events yet.</p>
          <Button href="/admin/events/new" variant="navy" className="mt-4">
            Add the first event
          </Button>
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-black/10 bg-black/[0.02]">
                <tr className="font-mono text-xs uppercase tracking-wide text-muted">
                  <th className="px-4 py-3 font-medium">Title</th>
                  <th className="px-4 py-3 font-medium">Date</th>
                  <th className="px-4 py-3 font-medium">Location</th>
                  <th className="px-4 py-3 font-medium">Featured</th>
                  <th className="px-4 py-3 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/5">
                {events.map((e) => (
                  <tr key={e.id} className="text-ink">
                    <td className="px-4 py-3 font-medium">{e.title}</td>
                    <td className="px-4 py-3 text-muted">
                      {format(e.startsAt, "PP p")}
                    </td>
                    <td className="px-4 py-3 text-muted">{e.location ?? "—"}</td>
                    <td className="px-4 py-3">
                      {e.isFeatured ? <Badge tone="gold">Featured</Badge> : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-3">
                        <Link
                          href={`/admin/events/${e.id}`}
                          className="font-body text-sm font-medium text-navy hover:text-royal focus-ring-gold rounded"
                        >
                          Edit
                        </Link>
                        <form action={deleteEvent}>
                          <input type="hidden" name="id" value={e.id} />
                          <button
                            type="submit"
                            className="font-body text-sm font-medium text-red-600 hover:text-red-700 focus-ring-gold rounded"
                          >
                            Delete
                          </button>
                        </form>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
