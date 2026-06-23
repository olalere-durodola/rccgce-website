import Link from "next/link";

import { requireUser } from "@/lib/rbac";
import { prisma } from "@/lib/db";
import { formatCents } from "@/lib/money";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScriptureEyebrow } from "@/components/ui/scripture-eyebrow";

/**
 * Member dashboard: a warm overview with quick stats (total given this calendar
 * year, saved-sermon count, active recurring gift) and quick links.
 *
 * Every query is scoped to the session user id, never to client input. Money is
 * summed in CENTS then formatted via formatCents.
 */
export default async function AccountDashboardPage() {
  const user = await requireUser();
  const userId = user.id;

  const yearStart = new Date(new Date().getFullYear(), 0, 1);

  const [givenAgg, savedCount, activeSub] = await Promise.all([
    prisma.donation.aggregate({
      _sum: { amount: true },
      where: { userId, status: "COMPLETED", createdAt: { gte: yearStart } },
    }),
    prisma.savedSermon.count({ where: { userId } }),
    prisma.subscription.findFirst({
      where: { userId, status: "ACTIVE" },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const givenThisYear = givenAgg._sum.amount ?? 0;

  const stats = [
    {
      label: `Given in ${yearStart.getFullYear()}`,
      value: formatCents(givenThisYear),
      hint: "Completed gifts",
    },
    {
      label: "Saved Sermons",
      value: String(savedCount),
      hint: savedCount === 1 ? "message" : "messages",
    },
    {
      label: "Recurring Gift",
      value: activeSub ? `${formatCents(activeSub.amount)}/mo` : "None",
      hint: activeSub ? `${activeSub.fund} · ${activeSub.planName}` : "No active plan",
    },
  ];

  return (
    <div className="space-y-10">
      <header>
        <ScriptureEyebrow reference="Psalm 84:10" label="Welcome Home" />
        <h1 className="mt-3 font-display text-3xl text-navy sm:text-4xl">
          Your Covenant dashboard
        </h1>
        <p className="mt-2 max-w-prose font-body text-muted">
          Track your giving, revisit saved messages, and keep your details
          current — all in one place.
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-3">
        {stats.map((stat) => (
          <Card key={stat.label} hairline className="p-6">
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-gold-deep">
              {stat.label}
            </p>
            <p className="mt-2 font-display text-3xl text-navy">{stat.value}</p>
            <p className="mt-1 font-body text-sm text-muted">{stat.hint}</p>
          </Card>
        ))}
      </div>

      <section className="space-y-4">
        <h2 className="font-display text-xl text-navy">Quick links</h2>
        <div className="flex flex-wrap gap-3">
          <Button href="/account/giving" variant="navy" size="sm">
            View giving history
          </Button>
          <Button href="/account/saved" variant="outline" size="sm">
            Saved sermons
          </Button>
          <Button href="/give" variant="gold" size="sm">
            Give now
          </Button>
          <Link
            href="/account/profile"
            className="inline-flex h-9 items-center px-2 font-body text-sm font-medium text-navy underline-offset-4 hover:underline focus-ring-gold"
          >
            Edit profile
          </Link>
        </div>
      </section>
    </div>
  );
}
