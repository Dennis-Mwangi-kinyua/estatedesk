import bcrypt from "bcryptjs";

// This is not an account credential. Unknown users still incur a normal password comparison.
const DUMMY_PASSWORD_HASH = "$2b$12$rlpkbB2f/3898ioDdkIV2er9AmQBH5Btw3tprvRWGa9IsNH6ccGkG";

export async function verifyLoginPassword(password: string, passwordHash?: string | null) {
  const matches = await bcrypt.compare(password, passwordHash || DUMMY_PASSWORD_HASH);
  return Boolean(passwordHash) && matches;
}
