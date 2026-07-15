import { pbkdf2Sync, randomBytes, timingSafeEqual } from "crypto";

const ITERATIONS = 120_000;
const KEY_LENGTH = 64;
const DIGEST = "sha512";
const PREFIX = "pbkdf2";

export type PasswordHashFormat = "missing" | "pbkdf2" | "legacy_plain" | "malformed";

export type PasswordVerificationResult = {
  ok: boolean;
  format: PasswordHashFormat;
};

export function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const hash = pbkdf2Sync(password, salt, ITERATIONS, KEY_LENGTH, DIGEST).toString("hex");
  return `${PREFIX}:${ITERATIONS}:${salt}:${hash}`;
}

export function getPasswordHashFormat(storedHash: string | null | undefined): PasswordHashFormat {
  if (!storedHash) {
    return "missing";
  }

  const parts = storedHash.split(":");

  if (parts.length === 1) {
    return storedHash.trim() ? "legacy_plain" : "missing";
  }

  const [prefix, iterationsText, salt, hash] = parts;
  const iterations = Number(iterationsText);

  if (
    parts.length !== 4 ||
    prefix !== PREFIX ||
    !Number.isFinite(iterations) ||
    iterations <= 0 ||
    !salt ||
    !hash ||
    !/^[a-f0-9]+$/i.test(hash)
  ) {
    return "malformed";
  }

  return "pbkdf2";
}

function timingSafeTextEqual(left: string, right: string) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);

  if (leftBuffer.length !== rightBuffer.length) {
    return false;
  }

  return timingSafeEqual(leftBuffer, rightBuffer);
}

export function verifyPasswordDetailed(
  password: string,
  storedHash: string | null | undefined
): PasswordVerificationResult {
  const format = getPasswordHashFormat(storedHash);

  if (format === "missing" || !storedHash) {
    return { ok: false, format };
  }

  if (format === "legacy_plain") {
    return { ok: timingSafeTextEqual(password, storedHash.trim()), format };
  }

  if (format === "malformed") {
    return { ok: false, format };
  }

  const [, iterationsText, salt, hash] = storedHash.split(":");
  const iterations = Number(iterationsText);
  const comparison = pbkdf2Sync(password, salt, iterations, KEY_LENGTH, DIGEST).toString("hex");
  const hashBuffer = Buffer.from(hash, "hex");
  const comparisonBuffer = Buffer.from(comparison, "hex");

  if (hashBuffer.length !== comparisonBuffer.length) {
    return { ok: false, format: "malformed" };
  }

  return { ok: timingSafeEqual(hashBuffer, comparisonBuffer), format };
}

export function verifyPassword(password: string, storedHash: string | null | undefined) {
  return verifyPasswordDetailed(password, storedHash).ok;
}
