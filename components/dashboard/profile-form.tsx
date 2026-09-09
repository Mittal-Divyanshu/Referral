"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { profileSchema, type ProfileInput } from "@/lib/validation/schemas";
import { Button } from "@/components/ui/button";
import { Field, inputClass } from "@/components/auth/auth-shell";

export function ProfileForm({
  defaultName,
  defaultPhone,
  email,
}: {
  defaultName: string;
  defaultPhone: string;
  email: string;
}) {
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ProfileInput>({
    resolver: zodResolver(profileSchema),
    defaultValues: { name: defaultName, phone: defaultPhone },
  });

  async function onSubmit(values: ProfileInput) {
    setError(null);
    setMessage(null);
    const res = await fetch("/api/profile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });
    if (!res.ok) {
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      setError(data.error ?? "Could not save your profile.");
      return;
    }
    setMessage("Profile saved.");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      <Field label="Name" htmlFor="name" error={errors.name?.message}>
        <input id="name" className={inputClass} {...register("name")} />
      </Field>

      <Field label="Email" htmlFor="email">
        <input
          id="email"
          className={`${inputClass} text-muted`}
          value={email}
          readOnly
          disabled
        />
      </Field>

      <Field label="Phone" htmlFor="phone" error={errors.phone?.message}>
        <input
          id="phone"
          type="tel"
          autoComplete="tel"
          placeholder="+91 98765 43210"
          className={inputClass}
          {...register("phone")}
        />
      </Field>

      {error ? (
        <p role="alert" className="text-danger text-sm">
          {error}
        </p>
      ) : null}
      {message ? (
        <p role="status" className="text-success text-sm">
          {message}
        </p>
      ) : null}

      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Saving…" : "Save profile"}
      </Button>
    </form>
  );
}
