import bcrypt from "bcryptjs";

/**
 * Password hashing. bcrypt with a work factor of 12 -- deliberately slow, so
 * offline guessing of a stolen hash is expensive. Plaintext passwords are
 * never stored or logged.
 */
const SALT_ROUNDS = 12;

export function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, SALT_ROUNDS);
}

export function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}
