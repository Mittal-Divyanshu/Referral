import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/current-user";
import { AuthShell } from "@/components/auth/auth-shell";
import { RegisterForm } from "@/components/auth/register-form";

export const metadata: Metadata = { title: "Create your account" };

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ ref?: string }>;
}) {
  if (await getCurrentUser()) redirect("/dashboard");
  const { ref } = await searchParams;

  return (
    <AuthShell
      title="Create your account"
      subtitle="Get your referral link and start earning."
      footer={
        <>
          Already have an account?{" "}
          <Link href="/login" className="text-brand font-medium">
            Sign in
          </Link>
        </>
      }
    >
      <RegisterForm referralCode={ref} />
    </AuthShell>
  );
}
