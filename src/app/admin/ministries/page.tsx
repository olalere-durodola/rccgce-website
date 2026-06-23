import Link from "next/link";

import { prisma } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ScriptureEyebrow } from "@/components/ui/scripture-eyebrow";
import { deleteMinistry } from "./actions";

export const dynamic = "force-dynamic";

/** Admin ministries list. */
export default async function AdminMinistriesPage() {
  const ministries = await prisma.ministry.findMany({
    orderBy: { name: "asc" },
  });

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <ScriptureEyebrow reference="Ephesians 4:12" label="Serve" />
          <h1 className="mt-2 font-display text-3xl text-ink sm:text-4xl">
            Ministries
          </h1>
        </div>
        <Button href="/admin/ministries/new" variant="gold">
          New ministry
        </Button>
      </header>

      {ministries.length === 0 ? (
        <Card hairline className="p-10 text-center">
          <p className="font-body text-muted">No ministries yet.</p>
          <Button href="/admin/ministries/new" variant="navy" className="mt-4">
            Add the first ministry
          </Button>
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-black/10 bg-black/[0.02]">
                <tr className="font-mono text-xs uppercase tracking-wide text-muted">
                  <th className="px-4 py-3 font-medium">Name</th>
                  <th className="px-4 py-3 font-medium">Leader</th>
                  <th className="px-4 py-3 font-medium">Meeting time</th>
                  <th className="px-4 py-3 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/5">
                {ministries.map((m) => (
                  <tr key={m.id} className="text-ink">
                    <td className="px-4 py-3 font-medium">{m.name}</td>
                    <td className="px-4 py-3 text-muted">{m.leader ?? "—"}</td>
                    <td className="px-4 py-3 text-muted">
                      {m.meetingTime ?? "—"}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-3">
                        <Link
                          href={`/admin/ministries/${m.id}`}
                          className="font-body text-sm font-medium text-navy hover:text-royal focus-ring-gold rounded"
                        >
                          Edit
                        </Link>
                        <form action={deleteMinistry}>
                          <input type="hidden" name="id" value={m.id} />
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
