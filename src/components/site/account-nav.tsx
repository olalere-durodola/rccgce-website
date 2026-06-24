"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";
import { signOutAction } from "@/app/account/actions";

const LINKS = [
  { href: "/account", label: "Dashboard" },
  { href: "/account/giving", label: "Giving" },
  { href: "/account/saved", label: "Saved Sermons" },
  { href: "/account/profile", label: "Profile" },
] as const;

/**
 * Member-portal sub-navigation. Renders as a horizontal scroll row on mobile
 * and a vertical sidebar rail on large screens. Highlights the active section
 * (exact match for the dashboard root, prefix match for sub-sections) and posts
 * to the signOut server action.
 */
export function AccountNav() {
  const pathname = usePathname();

  function isActive(href: string) {
    if (href === "/account") return pathname === "/account";
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  return (
    <nav aria-label="Account" className="flex flex-col gap-2">
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

      <form action={signOutAction} className="mt-2 lg:mt-4">
        <button
          type="submit"
          className="block w-full rounded-lg px-4 py-2.5 text-left font-body text-sm font-medium text-cream/60 transition-colors hover:bg-white/5 hover:text-gold focus-ring-gold"
        >
          Sign out
        </button>
      </form>
    </nav>
  );
}
