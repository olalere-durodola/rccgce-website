import type { Metadata } from "next";
import type { ReactNode } from "react";

import { requireUser } from "@/lib/rbac";
import { Container } from "@/components/ui/container";
import { ScriptureEyebrow } from "@/components/ui/scripture-eyebrow";
import { AccountNav } from "@/components/site/account-nav";

export const metadata: Metadata = {
  title: "My Account",
  description: "Your member portal at RCCG Covenant Embassy.",
  robots: { index: false, follow: false },
};

/**
 * Account portal shell. Server component that gates the entire /account subtree
 * via requireUser() (redirecting to /login when unauthenticated) and frames the
 * member area with a branded navy sidebar containing the AccountNav.
 *
 * Each child page independently re-scopes its data to the session user id, so
 * data never leaks across members.
 */
export default async function AccountLayout({
  children,
}: {
  children: ReactNode;
}) {
  const user = await requireUser();
  const firstName = user.name?.trim().split(/\s+/)[0] ?? "Friend";

  return (
    <div className="bg-cream">
      <Container className="py-10 sm:py-14 lg:py-16">
        <div className="lg:grid lg:grid-cols-[16rem_1fr] lg:gap-10">
          {/* Sidebar / topbar */}
          <aside className="lg:sticky lg:top-24 lg:self-start">
            <div className="rounded-2xl bg-navy p-5 text-cream shadow-sm shadow-navy/10 sm:p-6">
              <ScriptureEyebrow reference="Galatians 4:7" label="Heir" />
              <p className="mt-3 font-body text-sm text-cream/70">Welcome,</p>
              <p className="font-display text-2xl text-cream">{firstName}</p>
              <div className="mt-5 border-t border-white/10 pt-5">
                <AccountNav />
              </div>
            </div>
          </aside>

          {/* Page content */}
          <div className="mt-8 lg:mt-0">{children}</div>
        </div>
      </Container>
    </div>
  );
}
