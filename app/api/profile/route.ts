import { NextResponse } from "next/server";
import { requireUserApi } from "@/lib/auth/api";
import { profileSchema } from "@/lib/validation/schemas";
import { updateProfile } from "@/lib/users/profile";

/**
 * POST /api/profile
 * Completes the signed-in user's profile (the qualifying action).
 */
export async function POST(request: Request) {
  const auth = await requireUserApi();
  if (!auth.ok) return auth.response;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = profileSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const result = await updateProfile(auth.user.id, parsed.data);
  return NextResponse.json(result, { status: 200 });
}
