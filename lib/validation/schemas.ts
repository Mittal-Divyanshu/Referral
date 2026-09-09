import { z } from "zod";

/**
 * Shared validation schemas. Used both by React Hook Form on the client (for
 * fast feedback) and by the server (for the real, trusted validation). Client
 * validation is a convenience; the server never trusts the client.
 */

export const registerSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, "Name must be at least 2 characters")
      .max(80),
    email: z.string().trim().toLowerCase().email("Enter a valid email"),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .max(100),
    confirmPassword: z.string(),
    // Optional referral code carried through the registration form as a
    // fallback. The real attribution comes from the signed cookie; this is
    // only used when a cookie is absent.
    referralCode: z.string().trim().optional().or(z.literal("")),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type RegisterInput = z.infer<typeof registerSchema>;

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email("Enter a valid email"),
  password: z.string().min(1, "Password is required"),
});

export type LoginInput = z.infer<typeof loginSchema>;

export const profileSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(80),
  phone: z
    .string()
    .trim()
    .regex(/^[+]?[\d\s-]{7,15}$/, "Enter a valid phone number"),
});

export type ProfileInput = z.infer<typeof profileSchema>;
