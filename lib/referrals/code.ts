import { randomInt } from "node:crypto";

/**
 * Referral code generation.
 *
 * Codes are URL-safe, unguessable and unique. We use a 32-character alphabet
 * that excludes visually ambiguous characters (0/O, 1/I/L) so a code is easy
 * to read aloud or copy from a screen. Generated with a CSPRNG (randomInt),
 * never from sequential ids.
 */
const ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789"; // 31 chars, no 0 O 1 I L
const CODE_LENGTH = 7;

export function generateReferralCode(length: number = CODE_LENGTH): string {
  let code = "";
  for (let i = 0; i < length; i++) {
    code += ALPHABET[randomInt(ALPHABET.length)];
  }
  return code;
}

/**
 * Whether a string is shaped like one of our referral codes. Cheap structural
 * check used to reject obviously invalid codes before hitting the database.
 * A code being well-formed does NOT mean it exists -- that is a DB lookup.
 */
const CODE_PATTERN = new RegExp(`^[${ALPHABET}]{${CODE_LENGTH}}$`);

export function isWellFormedReferralCode(value: string): boolean {
  return CODE_PATTERN.test(value);
}
