import { pbkdf2Sync, randomBytes, timingSafeEqual } from "crypto";

const ITERATIONS = 120_000;
const KEY_LENGTH = 64;
const DIGEST = "sha512";
const PREFIX = "pbkdf2";

export function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const hash = pbkdf2Sync(password, salt, ITERATIONS, KEY_LENGTH, DIGEST).toString("hex");
  return `${PREFIX}:${ITERATIONS}:${salt}:${hash}`;
}

export function verifyPassword(password: string, storedHash: string | null | undefined) {
  if (!storedHash) {
    return false;
  }

  const [prefix, iterationsText, salt, hash] = storedHash.split(":");

  if (prefix !== PREFIX || !iterationsText || !salt || !hash) {
    return false;
  }

  const iterations = Number(iterationsText);

  if (!Number.isFinite(iterations) || iterations <= 0) {
    return false;
  }

  const comparison = pbkdf2Sync(password, salt, iterations, KEY_LENGTH, DIGEST).toString("hex");
  const hashBuffer = Buffer.from(hash, "hex");
  const comparisonBuffer = Buffer.from(comparison, "hex");

  if (hashBuffer.length !== comparisonBuffer.length) {
    return false;
  }

  return timingSafeEqual(hashBuffer, comparisonBuffer);
}
