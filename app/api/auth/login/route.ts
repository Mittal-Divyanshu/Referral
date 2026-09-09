import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { loginSchema } from "@/lib/validation/schemas";
import { verifyPassword } from "@/lib/auth/password";
import { createSession } from "@/lib/auth/session";
import { log } from "@/lib/utils/logger";

/**
 * POST /api/auth/login
 * Verifies credentials and starts a session. Returns the same error whether the
 * email is unknown or the password is wrong, so the endpoint does not reveal
 * which emails are registered.
 */
export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 400 });
  }
  const { email, password } = parsed.data;

  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, passwordHash: true },
  });

  // Always run a hash comparison to keep timing similar for unknown emails.
  const DUMMY_HASH =
    "$2b$12$C6UzMDM.H6dfI/f/IKcEeO2iKY9r0m4hJ7fJ3q3q3q3q3q3q3q3q3";
  const valid = await verifyPassword(
    password,
    user?.passwordHash ?? DUMMY_HASH,
  );

  if (!user || !valid) {
    log.warn("login_failed", { email });
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }

  await createSession(user.id);
  log.info("login_succeeded", { userId: user.id });
  return NextResponse.json({ userId: user.id }, { status: 200 });
}
