import { format } from "date-fns";

import { requireUser } from "@/lib/rbac";
import { prisma } from "@/lib/db";
import { formatCents } from "@/lib/money";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScriptureEyebrow } from "@/components/ui/scripture-eyebrow";

/**
 * Member giving history: one-time donations (newest first) and recurring
 * subscriptions. ALL queries are scoped to `userId = session user id`, so a
 * member only ever sees their own records.
 */
export default async function GivingPage() {
  const user = await requireUser();
  const userId = user.id;

  const [donations, subscriptions] = await Promise.all([
    prisma.donation.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    }),
    prisma.subscription.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const hasGiving = donations.length > 0 || subscriptions.length > 0;

  return (
    <div className="space-y-10">
      <header>
        <ScriptureEyebrow reference="2 Corinthians 9:7" label="Cheerful Giver" />
        <h1 className="mt-3 font-display text-3xl text-navy sm:text-4xl">
          Your giving
        </h1>
        <p className="mt-2 max-w-prose font-body text-muted">
          A record of your generosity toward the work of the Kingdom.
        </p>
      </header>

      {!hasGiving ? (
        <Card hairline className="p-10 text-center">
          <p className="font-display text-xl text-navy">
            You haven&apos;t given online yet
          </p>
          <p className="mt-2 font-body text-muted">
            When you give online, your history will appear here.
          </p>
          <div className="mt-6 flex justify-center">
            <Button href="/give" variant="gold">
              Make your first gift
            </Button>
          </div>
        </Card>
      ) : (
        <>
          {/* Recurring gifts */}
          {subscriptions.length > 0 ? (
            <section className="space-y-4">
              <h2 className="font-display text-xl text-navy">Recurring gifts</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                {subscriptions.map((sub) => (
                  <Card key={sub.id} hairline className="p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-display text-lg text-navy">
                          {formatCents(sub.amount)}
                          <span className="font-body text-sm text-muted">
                            {" "}
                            / month
                          </span>
                        </p>
                        <p className="mt-1 font-body text-sm text-muted">
                          {sub.fund} · {sub.planName}
                        </p>
                      </div>
                      <StatusBadge status={sub.status} />
                    </div>
                    <p className="mt-3 font-mono text-xs uppercase tracking-[0.15em] text-muted">
                      Since {format(sub.createdAt, "MMM d, yyyy")}
                    </p>
                  </Card>
                ))}
              </div>
            </section>
          ) : null}

          {/* One-time gifts */}
          {donations.length > 0 ? (
            <section className="space-y-4">
              <h2 className="font-display text-xl text-navy">Giving history</h2>
              <Card hairline className="overflow-x-auto">
                <table className="w-full text-left">
                  <caption className="sr-only">
                    Your one-time donations, newest first
                  </caption>
                  <thead>
                    <tr className="border-b border-navy/10 font-mono text-xs uppercase tracking-[0.15em] text-muted">
                      <th scope="col" className="px-5 py-3 font-medium">
                        Date
                      </th>
                      <th scope="col" className="px-5 py-3 font-medium">
                        Fund
                      </th>
                      <th scope="col" className="px-5 py-3 font-medium">
                        Amount
                      </th>
                      <th scope="col" className="px-5 py-3 font-medium">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="font-body text-sm">
                    {donations.map((d) => (
                      <tr
                        key={d.id}
                        className="border-b border-navy/5 last:border-0"
                      >
                        <td className="px-5 py-3 text-ink">
                          <time dateTime={d.createdAt.toISOString()}>
                            {format(d.createdAt, "MMM d, yyyy")}
                          </time>
                        </td>
                        <td className="px-5 py-3 text-ink">{d.fund}</td>
                        <td className="px-5 py-3 font-medium text-navy">
                          {formatCents(d.amount)}
                        </td>
                        <td className="px-5 py-3">
                          <StatusBadge status={d.status} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Card>
            </section>
          ) : null}
        </>
      )}
    </div>
  );
}

/** Small tone-mapped status pill for donation/subscription states. */
function StatusBadge({ status }: { status: string }) {
  const normalized = status.toUpperCase();
  const tone: "gold" | "navy" | "outline" =
    normalized === "COMPLETED" || normalized === "ACTIVE"
      ? "gold"
      : normalized === "CANCELLED" || normalized === "FAILED"
        ? "outline"
        : "navy";
  return (
    <Badge tone={tone}>
      {status.charAt(0) + status.slice(1).toLowerCase()}
    </Badge>
  );
}
