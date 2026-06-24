import type { Metadata } from "next";
import type { ReactNode } from "react";

import { requireAdmin } from "@/lib/rbac";
import { Container } from "@/components/ui/container";
import { ScriptureEyebrow } from "@/components/ui/scripture-eyebrow";
import { AdminNav } from "@/components/site/admin-nav";

export const metadata: Metadata = {
  title: "Admin",
  description: "Content management for RCCG Covenant Embassy.",
  robots: { index: false, follow: false },
};

/**
 * Admin shell. Server component that gates the ENTIRE /admin subtree via
 * requireAdmin() (redirects unauthenticated -> /login, non-admin -> /). This is
 * the first line of defence; every mutating server action independently
 * re-checks the admin role too (defence in depth), because the middleware only
 * proves authentication and an action can be invoked directly.
 */
export default async function AdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  const user = await requireAdmin();
  const firstName = user.name?.trim().split(/\s+/)[0] ?? "Admin";

  return (
    <div className="bg-cream">
      <Container className="py-10 sm:py-14 lg:py-16">
        <div className="lg:grid lg:grid-cols-[16rem_1fr] lg:gap-10">
          <aside className="lg:sticky lg:top-24 lg:self-start">
            <div className="rounded-2xl bg-navy p-5 text-cream shadow-sm shadow-navy/10 sm:p-6">
              <ScriptureEyebrow reference="1 Corinthians 14:40" label="Order" />
              <p className="mt-3 font-body text-sm text-cream/70">Admin</p>
              <p className="font-display text-2xl text-cream">{firstName}</p>
              <div className="mt-5 border-t border-white/10 pt-5">
                <AdminNav />
              </div>
            </div>
          </aside>

          <div className="mt-8 lg:mt-0">{children}</div>
        </div>
      </Container>
    </div>
  );
}
