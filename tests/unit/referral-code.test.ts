import { describe, expect, it } from "vitest";
import {
  generateReferralCode,
  isWellFormedReferralCode,
} from "@/lib/referrals/code";

describe("referral code generation", () => {
  it("produces 7-character codes by default", () => {
    for (let i = 0; i < 50; i++) {
      expect(generateReferralCode()).toHaveLength(7);
    }
  });

  it("only uses the unambiguous alphabet (no 0 O 1 I L)", () => {
    const code = generateReferralCode(200);
    expect(code).not.toMatch(/[01OIL]/);
  });

  it("is extremely unlikely to collide", () => {
    const codes = new Set(
      Array.from({ length: 1000 }, () => generateReferralCode()),
    );
    expect(codes.size).toBeGreaterThan(995);
  });

  it("recognises well-formed codes and rejects malformed ones", () => {
    expect(isWellFormedReferralCode(generateReferralCode())).toBe(true);
    expect(isWellFormedReferralCode("abc")).toBe(false); // too short + lowercase
    expect(isWellFormedReferralCode("DVX82K90")).toBe(false); // too long
    expect(isWellFormedReferralCode("DVX8110")).toBe(false); // contains 1 and 0
    expect(isWellFormedReferralCode("")).toBe(false);
  });
});
