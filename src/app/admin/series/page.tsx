import Link from "next/link";

import { prisma } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ScriptureEyebrow } from "@/components/ui/scripture-eyebrow";
import { AdminFlash } from "@/components/site/admin-flash";
import { deleteSeries } from "./actions";

export const dynamic = "force-dynamic";

/** Admin series list with Edit + Delete actions and an empty state. */
export default async function AdminSeriesPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string; deleted?: string }>;
}) {
  const { saved, deleted } = await searchParams;
  const series = await prisma.series.findMany({
    orderBy: { title: "asc" },
    include: { _count: { select: { sermons: true } } },
  });

  return (
    <div className="space-y-8">
      <AdminFlash saved={saved} deleted={deleted} />
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <ScriptureEyebrow reference="Ecclesiastes 3:1" label="Seasons" />
          <h1 className="mt-2 font-display text-3xl text-ink sm:text-4xl">
            Series
          </h1>
        </div>
        <Button href="/admin/series/new" variant="gold">
          New series
        </Button>
      </header>

      {series.length === 0 ? (
        <Card hairline className="p-10 text-center">
          <p className="font-body text-muted">No series yet.</p>
          <Button href="/admin/series/new" variant="navy" className="mt-4">
            Add the first series
          </Button>
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-black/10 bg-black/[0.02]">
                <tr className="font-mono text-xs uppercase tracking-wide text-muted">
                  <th className="px-4 py-3 font-medium">Title</th>
                  <th className="px-4 py-3 font-medium">Slug</th>
                  <th className="px-4 py-3 font-medium">Sermons</th>
                  <th className="px-4 py-3 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/5">
                {series.map((s) => (
                  <tr key={s.id} className="text-ink">
                    <td className="px-4 py-3 font-medium">{s.title}</td>
                    <td className="px-4 py-3 font-mono text-xs text-muted">
                      {s.slug}
                    </td>
                    <td className="px-4 py-3 text-muted">{s._count.sermons}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-3">
                        <Link
                          href={`/admin/series/${s.id}`}
                          className="font-body text-sm font-medium text-navy hover:text-royal focus-ring-gold rounded"
                        >
                          Edit
                        </Link>
                        <form action={deleteSeries}>
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
