import Link from "next/link";
import { format } from "date-fns";

import { prisma } from "@/lib/db";
import { formatCents } from "@/lib/money";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ScriptureEyebrow } from "@/components/ui/scripture-eyebrow";

export const dynamic = "force-dynamic";

/**
 * Admin dashboard: at-a-glance counts, total completed donations, recent
 * activity, and quick "new" actions. All data is read fresh on each request
 * (force-dynamic) so newly created content shows immediately.
 */
export default async function AdminDashboardPage() {
  const [
    sermonCount,
    eventCount,
    ministryCount,
    blogCount,
    memberCount,
    completed,
    recentDonations,
    recentSermons,
  ] = await Promise.all([
    prisma.sermon.count(),
    prisma.event.count(),
    prisma.ministry.count(),
    prisma.blogPost.count(),
    prisma.user.count(),
    prisma.donation.aggregate({
      where: { status: "COMPLETED" },
      _sum: { amount: true },
    }),
    prisma.donation.findMany({
      where: { status: "COMPLETED" },
      orderBy: { createdAt: "desc" },
      take: 5,
      include: { user: { select: { name: true, email: true } } },
    }),
    prisma.sermon.findMany({
      orderBy: { date: "desc" },
      take: 5,
      select: { id: true, title: true, speaker: true, date: true },
    }),
  ]);

  const donationTotal = formatCents(completed._sum.amount ?? 0);

  const stats = [
    { label: "Sermons", value: sermonCount, href: "/admin/sermons" },
    { label: "Events", value: eventCount, href: "/admin/events" },
    { label: "Ministries", value: ministryCount, href: "/admin/ministries" },
    { label: "Blog posts", value: blogCount, href: "/admin/blog" },
    { label: "Members", value: memberCount, href: "/admin/members" },
    { label: "Donations received", value: donationTotal, href: "/admin/donations" },
  ];

  return (
    <div className="space-y-10">
      <header>
        <ScriptureEyebrow reference="1 Corinthians 14:40" label="Order" />
        <h1 className="mt-2 font-display text-3xl text-ink sm:text-4xl">
          Dashboard
        </h1>
        <p className="mt-2 font-body text-muted">
          Manage the ministry&apos;s content and keep the house in order.
        </p>
      </header>

      <div className="flex flex-wrap gap-3">
        <Button href="/admin/sermons/new" variant="gold">
          New sermon
        </Button>
        <Button href="/admin/events/new" variant="outline">
          New event
        </Button>
      </div>

      <section aria-label="Overview">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {stats.map((s) => (
            <Link key={s.label} href={s.href} className="focus-ring-gold rounded-xl">
              <Card hairline className="p-5 transition-shadow hover:shadow-md">
                <p className="font-mono text-xs uppercase tracking-[0.15em] text-muted">
                  {s.label}
                </p>
                <p className="mt-2 font-display text-3xl text-navy">{s.value}</p>
              </Card>
            </Link>
          ))}
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <section aria-label="Recent donations">
          <h2 className="mb-3 font-display text-xl text-ink">Recent donations</h2>
          <Card className="divide-y divide-black/5">
            {recentDonations.length === 0 ? (
              <p className="p-5 text-sm text-muted">No donations yet.</p>
            ) : (
              recentDonations.map((d) => (
                <div
                  key={d.id}
                  className="flex items-center justify-between gap-4 p-4"
                >
                  <div className="min-w-0">
                    <p className="truncate font-body text-sm font-medium text-ink">
                      {d.user?.name ?? d.user?.email ?? "Anonymous"}
                    </p>
                    <p className="text-xs text-muted">
                      {d.fund} · {format(d.createdAt, "PP")}
                    </p>
                  </div>
                  <p className="shrink-0 font-mono text-sm text-navy">
                    {formatCents(d.amount)}
                  </p>
                </div>
              ))
            )}
          </Card>
        </section>

        <section aria-label="Recent sermons">
          <h2 className="mb-3 font-display text-xl text-ink">Recent sermons</h2>
          <Card className="divide-y divide-black/5">
            {recentSermons.length === 0 ? (
              <p className="p-5 text-sm text-muted">No sermons yet.</p>
            ) : (
              recentSermons.map((s) => (
                <Link
                  key={s.id}
                  href={`/admin/sermons/${s.id}`}
                  className="flex items-center justify-between gap-4 p-4 transition-colors hover:bg-black/[0.02] focus-ring-gold"
                >
                  <div className="min-w-0">
                    <p className="truncate font-body text-sm font-medium text-ink">
                      {s.title}
                    </p>
                    <p className="text-xs text-muted">{s.speaker}</p>
                  </div>
                  <p className="shrink-0 text-xs text-muted">
                    {format(s.date, "PP")}
                  </p>
                </Link>
              ))
            )}
          </Card>
        </section>
      </div>
    </div>
  );
}
