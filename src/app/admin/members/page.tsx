import { format } from "date-fns";

import { prisma } from "@/lib/db";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScriptureEyebrow } from "@/components/ui/scripture-eyebrow";

export const dynamic = "force-dynamic";

/**
 * Read-only members directory (admin-only via the admin layout's requireAdmin).
 * Lists every user with role, join date, and a donations count. No mutation.
 *
 * TODO: role management (promote/demote MEMBER <-> ADMIN) could be added here in
 * a future version — it is intentionally read-only in v1.
 */
export default async function AdminMembersPage() {
  const members = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
      _count: { select: { donations: true } },
    },
  });

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <ScriptureEyebrow reference="1 Corinthians 12:27" label="Body" />
          <h1 className="mt-2 font-display text-3xl text-ink sm:text-4xl">
            Members
          </h1>
        </div>
        <p className="font-body text-sm text-muted">
          {members.length} {members.length === 1 ? "member" : "members"}
        </p>
      </header>

      {members.length === 0 ? (
        <Card hairline className="p-10 text-center">
          <p className="font-body text-muted">No members yet.</p>
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-black/10 bg-black/[0.02]">
                <tr className="font-mono text-xs uppercase tracking-wide text-muted">
                  <th className="px-4 py-3 font-medium">Name</th>
                  <th className="px-4 py-3 font-medium">Email</th>
                  <th className="px-4 py-3 font-medium">Role</th>
                  <th className="px-4 py-3 font-medium">Joined</th>
                  <th className="px-4 py-3 font-medium">Donations</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/5">
                {members.map((m) => (
                  <tr key={m.id} className="text-ink">
                    <td className="px-4 py-3 font-medium">
                      {m.name?.trim() || "—"}
                    </td>
                    <td className="px-4 py-3 text-muted">{m.email}</td>
                    <td className="px-4 py-3">
                      <Badge tone={m.role === "ADMIN" ? "gold" : "outline"}>
                        {m.role}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-muted">
                      {format(m.createdAt, "PP")}
                    </td>
                    <td className="px-4 py-3 text-muted">
                      {m._count.donations}
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
