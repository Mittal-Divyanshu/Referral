import { describe, expect, it } from "vitest";
import { hashPassword, verifyPassword } from "@/lib/auth/password";

describe("password hashing", () => {
  it("never stores the plaintext", async () => {
    const hash = await hashPassword("Password123");
    expect(hash).not.toContain("Password123");
    expect(hash.startsWith("$2")).toBe(true);
  });

  it("verifies a correct password", async () => {
    const hash = await hashPassword("Password123");
    expect(await verifyPassword("Password123", hash)).toBe(true);
  });

  it("rejects a wrong password", async () => {
    const hash = await hashPassword("Password123");
    expect(await verifyPassword("wrong", hash)).toBe(false);
  });
});
