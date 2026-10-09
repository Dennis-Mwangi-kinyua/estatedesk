import { randomInt } from "node:crypto";

const REFERENCE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const REFERENCE_LENGTH = 10;

/** Human-facing reference for EstateDesk records; database IDs remain internal. */
export function createEstateDeskReference() {
  let suffix = "";
  for (let index = 0; index < REFERENCE_LENGTH; index += 1) {
    suffix += REFERENCE_ALPHABET[randomInt(REFERENCE_ALPHABET.length)];
  }
  return `ESDSK-${suffix}`;
}
