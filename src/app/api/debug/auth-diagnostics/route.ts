import { NextResponse } from "next/server";
import { getUserByEmail } from "@/lib/accessStore";
import { getAccessStoreMeta } from "@/lib/accessStore";
import { getPasswordHashFormat, verifyPasswordDetailed } from "@/lib/password";

const TARGET_EMAIL = "omarhadida24@gmail.com";

export async function GET() {
  try {
    const user = await getUserByEmail(TARGET_EMAIL);
    const bootstrapPassword = process.env.DASHBOARD_BOOTSTRAP_PASSWORD?.trim() ?? "";
    const hashFormat = getPasswordHashFormat(user?.passwordHash);
    const bootstrapVerification = bootstrapPassword
      ? verifyPasswordDetailed(bootstrapPassword, user?.passwordHash)
      : { ok: false, format: hashFormat };

    return NextResponse.json({
      diagnostic: "temporary_auth_diagnostics",
      targetEmail: TARGET_EMAIL,
      storage: getAccessStoreMeta(),
      bootstrapPasswordConfigured: Boolean(bootstrapPassword),
      userExists: Boolean(user),
      user: user
        ? {
            id: user.id,
            email: user.email,
            role: user.role,
            status: user.status,
            hasPasswordHash: Boolean(user.passwordHash),
            passwordHashFormat: hashFormat,
            bootstrapPasswordMatchesStoredHash: bootstrapVerification.ok,
            lastLoginAt: user.lastLoginAt,
            updatedAt: user.updatedAt,
          }
        : null,
    });
  } catch (error) {
    return NextResponse.json(
      {
        diagnostic: "temporary_auth_diagnostics",
        error: error instanceof Error ? error.message : "storage_unavailable",
      },
      { status: 500 }
    );
  }
}
