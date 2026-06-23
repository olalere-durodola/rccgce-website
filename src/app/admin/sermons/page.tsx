import Link from "next/link";
import { format } from "date-fns";

import { prisma } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ScriptureEyebrow } from "@/components/ui/scripture-eyebrow";
import { AdminFlash } from "@/components/site/admin-flash";
import { deleteSermon } from "./actions";

export const dynamic = "force-dynamic";

/**
 * Admin sermons list: a table of every sermon with Edit + Delete actions and a
 * "New sermon" button. Empty state invites the first create.
 */
export default async function AdminSermonsPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string; deleted?: string }>;
}) {
  const { saved, deleted } = await searchParams;
  const sermons = await prisma.sermon.findMany({
    orderBy: { date: "desc" },
    include: { series: { select: { title: true } } },
  });

  return (
    <div className="space-y-8">
      <AdminFlash saved={saved} deleted={deleted} />
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <ScriptureEyebrow reference="2 Timothy 4:2" label="Preach" />
          <h1 className="mt-2 font-display text-3xl text-ink sm:text-4xl">
            Sermons
          </h1>
        </div>
        <Button href="/admin/sermons/new" variant="gold">
          New sermon
        </Button>
      </header>

      {sermons.length === 0 ? (
        <Card hairline className="p-10 text-center">
          <p className="font-body text-muted">No sermons yet.</p>
          <Button href="/admin/sermons/new" variant="navy" className="mt-4">
            Add the first sermon
          </Button>
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-black/10 bg-black/[0.02]">
                <tr className="font-mono text-xs uppercase tracking-wide text-muted">
                  <th className="px-4 py-3 font-medium">Title</th>
                  <th className="px-4 py-3 font-medium">Speaker</th>
                  <th className="px-4 py-3 font-medium">Date</th>
                  <th className="px-4 py-3 font-medium">Series</th>
                  <th className="px-4 py-3 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/5">
                {sermons.map((s) => (
                  <tr key={s.id} className="text-ink">
                    <td className="px-4 py-3 font-medium">{s.title}</td>
                    <td className="px-4 py-3 text-muted">{s.speaker}</td>
                    <td className="px-4 py-3 text-muted">
                      {format(s.date, "PP")}
                    </td>
                    <td className="px-4 py-3 text-muted">
                      {s.series?.title ?? "—"}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-3">
                        <Link
                          href={`/admin/sermons/${s.id}`}
                          className="font-body text-sm font-medium text-navy hover:text-royal focus-ring-gold rounded"
                        >
                          Edit
                        </Link>
                        <form action={deleteSermon}>
                          <input type="hidden" name="id" value={s.id} />
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
