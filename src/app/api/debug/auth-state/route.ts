import { NextResponse } from "next/server";
import { getPasswordHashFormat, verifyPasswordDetailed } from "@/lib/password";
import { getAccessStoreMeta, getUserByEmail } from "@/lib/accessStore";

const OWNER_EMAIL = "omarhadida24@gmail.com";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const bootstrapPassword = process.env.DASHBOARD_BOOTSTRAP_PASSWORD?.trim() ?? "";
  const user = await getUserByEmail(OWNER_EMAIL);
  const hashFormat = getPasswordHashFormat(user?.passwordHash ?? null);
  const bootstrapVerification = user
    ? verifyPasswordDetailed(bootstrapPassword, user.passwordHash)
    : { ok: false, format: "missing" as const };

  return NextResponse.json({
    deployment: {
      commitSha: process.env.VERCEL_GIT_COMMIT_SHA ?? null,
      environment: process.env.VERCEL_ENV ?? null,
      region: process.env.VERCEL_REGION ?? null,
    },
    storage: getAccessStoreMeta(),
    bootstrap: {
      configured: Boolean(bootstrapPassword),
      matchesStoredHash: Boolean(bootstrapPassword && bootstrapVerification.ok),
    },
    owner: user
      ? {
          exists: true,
          id: user.id,
          email: user.email,
          role: user.role,
          status: user.status,
          hashFormat,
          hasPasswordHash: Boolean(user.passwordHash),
          updatedAt: user.updatedAt,
          lastLoginAt: user.lastLoginAt,
          ownerBootstrapRecoveryWouldPass:
            user.email === OWNER_EMAIL && user.status === "active" && Boolean(bootstrapPassword),
        }
      : {
          exists: false,
        },
  });
}
