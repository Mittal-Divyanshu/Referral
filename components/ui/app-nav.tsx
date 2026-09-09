import Link from "next/link";
import type { SafeUser } from "@/lib/auth/current-user";
import { UserRole } from "@/lib/db";
import { LogoutButton } from "./logout-button";

const USER_LINKS = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/referrals", label: "Referrals" },
  { href: "/profile", label: "Profile" },
];

/** Top navigation for signed-in users. Admin sees an extra link. */
export function AppNav({ user }: { user: SafeUser }) {
  const links =
    user.role === UserRole.ADMIN
      ? [...USER_LINKS, { href: "/admin", label: "Admin" }]
      : USER_LINKS;

  return (
    <header className="border-border bg-surface border-b">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        <div className="flex items-center gap-6">
          <Link href="/dashboard" className="font-semibold tracking-tight">
            Refer<span className="text-brand">Flow</span>
          </Link>
          <nav className="flex items-center gap-4" aria-label="Main">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-muted hover:text-ink text-sm font-medium"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-muted hidden text-sm sm:inline">
            {user.name}
          </span>
          <LogoutButton />
        </div>
      </div>
    </header>
  );
}
