import { NextResponse } from "next/server";
import { getCurrentUser, type SafeUser } from "./current-user";
import { UserRole } from "@/lib/db";

/**
 * Authorization guards for API route handlers. Unlike the page helpers in
 * current-user.ts these return a JSON 401/403 instead of redirecting, so
 * fetch callers get a proper status code. Authorization is enforced on the
 * server on every protected endpoint.
 */
type AuthOk = { ok: true; user: SafeUser };
type AuthFail = { ok: false; response: NextResponse };

export async function requireUserApi(): Promise<AuthOk | AuthFail> {
  const user = await getCurrentUser();
  if (!user) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }
  return { ok: true, user };
}

export async function requireAdminApi(): Promise<AuthOk | AuthFail> {
  const user = await getCurrentUser();
  if (!user) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }
  if (user.role !== UserRole.ADMIN) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
    };
  }
  return { ok: true, user };
}
