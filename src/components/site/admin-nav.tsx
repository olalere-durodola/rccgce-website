"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";
import { signOutAction } from "@/app/account/actions";

const LINKS = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/sermons", label: "Sermons" },
  { href: "/admin/series", label: "Series" },
  { href: "/admin/events", label: "Events" },
  { href: "/admin/ministries", label: "Ministries" },
  { href: "/admin/blog", label: "Blog" },
  { href: "/admin/donations", label: "Donations" },
  { href: "/admin/members", label: "Members" },
] as const;

/**
 * Admin sidebar navigation. Horizontal scroll row on mobile, vertical rail on
 * large screens. Highlights the active section (exact match for the dashboard
 * root, prefix match for sub-sections). Includes "View site" and sign-out.
 *
 * Some links (Events/Ministries/Blog/Donations/Members) are wired now but their
 * pages land in Phase 7b — they 404 until then by design.
 */
export function AdminNav() {
  const pathname = usePathname();

  function isActive(href: string) {
    if (href === "/admin") return pathname === "/admin";
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  return (
    <nav aria-label="Admin" className="flex flex-col gap-2">
      <ul className="flex gap-2 overflow-x-auto lg:flex-col lg:overflow-visible">
        {LINKS.map((link) => {
          const active = isActive(link.href);
          return (
            <li key={link.href} className="shrink-0 lg:shrink">
              <Link
                href={link.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "block whitespace-nowrap rounded-lg px-4 py-2.5 font-body text-sm font-medium transition-colors focus-ring-gold",
                  active
                    ? "bg-gold text-navy"
                    : "text-cream/80 hover:bg-white/5 hover:text-gold",
                )}
              >
                {link.label}
              </Link>
            </li>
          );
        })}
      </ul>

      <div className="mt-2 border-t border-white/10 pt-2 lg:mt-4 lg:pt-4">
        <Link
          href="/"
          className="block whitespace-nowrap rounded-lg px-4 py-2.5 font-body text-sm font-medium text-cream/70 transition-colors hover:bg-white/5 hover:text-gold focus-ring-gold"
        >
          View site
        </Link>
        <form action={signOutAction}>
          <button
            type="submit"
            className="block w-full rounded-lg px-4 py-2.5 text-left font-body text-sm font-medium text-cream/60 transition-colors hover:bg-white/5 hover:text-gold focus-ring-gold"
          >
            Sign out
          </button>
        </form>
      </div>
    </nav>
  );
}
