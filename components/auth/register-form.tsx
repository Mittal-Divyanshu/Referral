"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { registerSchema, type RegisterInput } from "@/lib/validation/schemas";
import { Button } from "@/components/ui/button";
import { Field, inputClass } from "./auth-shell";

export function RegisterForm({ referralCode }: { referralCode?: string }) {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: { referralCode: referralCode ?? "" },
  });

  async function onSubmit(values: RegisterInput) {
    setServerError(null);
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });
    if (!res.ok) {
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      setServerError(data.error ?? "Something went wrong. Please try again.");
      return;
    }
    // Full navigation so server components re-read the new session cookie.
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      {referralCode ? (
        <p className="bg-brand-soft text-brand rounded-lg px-3 py-2 text-sm">
          You were invited with code <strong>{referralCode}</strong>.
        </p>
      ) : null}

      <Field label="Name" htmlFor="name" error={errors.name?.message}>
        <input
          id="name"
          autoComplete="name"
          className={inputClass}
          {...register("name")}
        />
      </Field>

      <Field label="Email" htmlFor="email" error={errors.email?.message}>
        <input
          id="email"
          type="email"
          autoComplete="email"
          className={inputClass}
          {...register("email")}
        />
      </Field>

      <Field
        label="Password"
        htmlFor="password"
        error={errors.password?.message}
      >
        <input
          id="password"
          type="password"
          autoComplete="new-password"
          className={inputClass}
          {...register("password")}
        />
      </Field>

      <Field
        label="Confirm password"
        htmlFor="confirmPassword"
        error={errors.confirmPassword?.message}
      >
        <input
          id="confirmPassword"
          type="password"
          autoComplete="new-password"
          className={inputClass}
          {...register("confirmPassword")}
        />
      </Field>

      <input type="hidden" {...register("referralCode")} />

      {serverError ? (
        <p role="alert" className="text-danger text-sm">
          {serverError}
        </p>
      ) : null}

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? "Creating account…" : "Create account"}
      </Button>
    </form>
  );
}
