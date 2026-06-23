import Link from "next/link";
import { format } from "date-fns";

import { prisma } from "@/lib/db";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScriptureEyebrow } from "@/components/ui/scripture-eyebrow";
import { formatCents } from "@/lib/money";
import { FUNDS } from "@/lib/validation";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

/** Donor display name: linked user's name/email, else "Guest". */
function donorLabel(d: {
  user: { name: string | null; email: string } | null;
}): string {
  if (!d.user) return "Guest";
  return d.user.name?.trim() || d.user.email;
}

/**
 * Read-only donations view (admin-only via the admin layout's requireAdmin).
 * Lists every donation newest-first with an optional `?fund=` filter, shows the
 * total of COMPLETED donations, and recurring subscriptions. No mutation.
 */
export default async function AdminDonationsPage({
  searchParams,
}: {
  searchParams: Promise<{ fund?: string }>;
}) {
  const { fund } = await searchParams;
  const activeFund = FUNDS.find((f) => f === fund);

  const [donations, completedAgg, subscriptions] = await Promise.all([
    prisma.donation.findMany({
      where: activeFund ? { fund: activeFund } : undefined,
      orderBy: { createdAt: "desc" },
      include: { user: { select: { name: true, email: true } } },
    }),
    // Total reflects COMPLETED donations, honouring the active fund filter.
    prisma.donation.aggregate({
      _sum: { amount: true },
      where: { status: "COMPLETED", ...(activeFund ? { fund: activeFund } : {}) },
    }),
    prisma.subscription.findMany({
      orderBy: { createdAt: "desc" },
      include: { user: { select: { name: true, email: true } } },
    }),
  ]);

  const completedTotal = completedAgg._sum.amount ?? 0;

  const filterLink = (f?: string) =>
    f ? `/admin/donations?fund=${f}` : "/admin/donations";

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <ScriptureEyebrow reference="2 Corinthians 9:7" label="Give" />
          <h1 className="mt-2 font-display text-3xl text-ink sm:text-4xl">
            Donations
          </h1>
        </div>
        <Card hairline className="px-5 py-3 text-right">
          <p className="font-mono text-xs uppercase tracking-wide text-muted">
            Completed total{activeFund ? ` · ${activeFund}` : ""}
          </p>
          <p className="font-display text-2xl text-navy">
            {formatCents(completedTotal)}
          </p>
        </Card>
      </header>

      <nav aria-label="Filter by fund" className="flex flex-wrap gap-2">
        <Link
          href={filterLink()}
          className={cn(
            "rounded-full px-3.5 py-1.5 font-body text-sm font-medium focus-ring-gold",
            !activeFund ? "bg-navy text-cream" : "bg-black/5 text-ink hover:bg-black/10",
          )}
        >
          All
        </Link>
        {FUNDS.map((f) => (
          <Link
            key={f}
            href={filterLink(f)}
            className={cn(
              "rounded-full px-3.5 py-1.5 font-body text-sm font-medium focus-ring-gold",
              activeFund === f
                ? "bg-navy text-cream"
                : "bg-black/5 text-ink hover:bg-black/10",
            )}
          >
            {f}
          </Link>
        ))}
      </nav>

      {donations.length === 0 ? (
        <Card hairline className="p-10 text-center">
          <p className="font-body text-muted">No donations found.</p>
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-black/10 bg-black/[0.02]">
                <tr className="font-mono text-xs uppercase tracking-wide text-muted">
                  <th className="px-4 py-3 font-medium">Date</th>
                  <th className="px-4 py-3 font-medium">Donor</th>
                  <th className="px-4 py-3 font-medium">Fund</th>
                  <th className="px-4 py-3 font-medium">Amount</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">PayPal Order</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/5">
                {donations.map((d) => (
                  <tr key={d.id} className="text-ink">
                    <td className="px-4 py-3 text-muted">
                      {format(d.createdAt, "PP")}
                    </td>
                    <td className="px-4 py-3">{donorLabel(d)}</td>
                    <td className="px-4 py-3 text-muted">{d.fund}</td>
                    <td className="px-4 py-3 font-medium">
                      {formatCents(d.amount)}
                    </td>
                    <td className="px-4 py-3">
                      <Badge tone={d.status === "COMPLETED" ? "navy" : "outline"}>
                        {d.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-muted">
                      {d.paypalOrderId}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      <section className="space-y-4">
        <h2 className="font-display text-2xl text-ink">
          Recurring subscriptions
        </h2>
        {subscriptions.length === 0 ? (
          <Card hairline className="p-8 text-center">
            <p className="font-body text-muted">No recurring subscriptions.</p>
          </Card>
        ) : (
          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-black/10 bg-black/[0.02]">
                  <tr className="font-mono text-xs uppercase tracking-wide text-muted">
                    <th className="px-4 py-3 font-medium">Started</th>
                    <th className="px-4 py-3 font-medium">Donor</th>
                    <th className="px-4 py-3 font-medium">Plan</th>
                    <th className="px-4 py-3 font-medium">Fund</th>
                    <th className="px-4 py-3 font-medium">Amount</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/5">
                  {subscriptions.map((s) => (
                    <tr key={s.id} className="text-ink">
                      <td className="px-4 py-3 text-muted">
                        {format(s.createdAt, "PP")}
                      </td>
                      <td className="px-4 py-3">{donorLabel(s)}</td>
                      <td className="px-4 py-3 text-muted">{s.planName}</td>
                      <td className="px-4 py-3 text-muted">{s.fund}</td>
                      <td className="px-4 py-3 font-medium">
                        {formatCents(s.amount)}
                      </td>
                      <td className="px-4 py-3">
                        <Badge
                          tone={s.status === "ACTIVE" ? "navy" : "outline"}
                        >
                          {s.status}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </section>
    </div>
  );
}
