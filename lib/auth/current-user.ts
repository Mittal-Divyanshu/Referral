import { cache } from "react";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { UserRole } from "@/lib/db";
import { getSessionUserId } from "./session";

/**
 * Authenticated user helpers.
 *
 * `getCurrentUser` never throws and never redirects -- use it where a logged
 * out visitor is fine. `requireUser` / `requireAdmin` enforce authorization on
 * the server and redirect otherwise. Authorization lives here, not in the UI:
 * hiding a link is not a security control.
 *
 * The passwordHash is explicitly excluded from the selection so it can never
 * leak into a page or an API response.
 */
export type SafeUser = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  referralCode: string;
  phone: string | null;
  profileComplete: boolean;
  createdAt: Date;
};

const USER_SELECT = {
  id: true,
  name: true,
  email: true,
  role: true,
  referralCode: true,
  phone: true,
  profileComplete: true,
  createdAt: true,
} as const;

// Cached per-request so multiple components in one render share a single query.
export const getCurrentUser = cache(async (): Promise<SafeUser | null> => {
  const userId = await getSessionUserId();
  if (!userId) return null;
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: USER_SELECT,
  });
  return user;
});

export async function requireUser(): Promise<SafeUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

export async function requireAdmin(): Promise<SafeUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== UserRole.ADMIN) redirect("/dashboard");
  return user;
}
