import { timingSafeEqual } from "crypto";
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { getPasswordHashFormat, verifyPasswordDetailed } from "@/lib/password";
import { getUserByEmail, updateUser } from "@/lib/accessStore";
import { authConfig } from "@/auth.config";

type LoginFailureReason =
  | "user_not_found"
  | "invalid_access_key"
  | "inactive_user"
  | "malformed_record"
  | "storage_unavailable";

const DEFAULT_OWNER_EMAIL = "omarhadida24@gmail.com";

function normalizeCredentialEmail(value: unknown) {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

function normalizeAccessKey(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function maskEmail(email: string) {
  const [localPart, domain] = email.split("@");
  if (!localPart || !domain) return "malformed_email";
  return `${localPart.slice(0, 2)}***@${domain}`;
}

function timingSafeTextEqual(left: string, right: string) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);

  if (leftBuffer.length !== rightBuffer.length) {
    return false;
  }

  return timingSafeEqual(leftBuffer, rightBuffer);
}

function isDefaultOwnerBootstrapLogin(email: string, accessKey: string) {
  const bootstrapPassword = process.env.DASHBOARD_BOOTSTRAP_PASSWORD?.trim() ?? "";

  return (
    email === DEFAULT_OWNER_EMAIL &&
    Boolean(bootstrapPassword) &&
    timingSafeTextEqual(accessKey, bootstrapPassword)
  );
}

function logLoginFailure(reason: LoginFailureReason, email: string, details: Record<string, unknown> = {}) {
  console.warn("dashboard_login_failed", {
    reason,
    email: maskEmail(email),
    ...details,
  });
}

async function persistUserAfterLogin(
  input: Parameters<typeof updateUser>[0],
  email: string,
  action: "login_touch" | "bootstrap_recovery"
) {
  try {
    await updateUser(input);
  } catch (error) {
    console.warn("dashboard_login_persist_failed", {
      action,
      email: maskEmail(email),
      userId: input.userId,
      message: error instanceof Error ? error.message : "unknown_storage_error",
    });
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        accessKey: { label: "Access key", type: "text" },
      },
      async authorize(credentials) {
        const email = normalizeCredentialEmail(credentials?.email);
        const accessKey = normalizeAccessKey(credentials?.accessKey);

        if (!email || !accessKey) {
          logLoginFailure("malformed_record", email || "missing_email", {
            missingEmail: !email,
            missingAccessKey: !accessKey,
          });
          return null;
        }

        let user: Awaited<ReturnType<typeof getUserByEmail>>;

        try {
          user = await getUserByEmail(email);
        } catch (error) {
          logLoginFailure("storage_unavailable", email, {
            message: error instanceof Error ? error.message : "unknown_storage_error",
          });
          return null;
        }

        if (!user) {
          logLoginFailure("user_not_found", email);
          return null;
        }

        if (user.status !== "active") {
          logLoginFailure("inactive_user", email, {
            userId: user.id,
            status: user.status,
            role: user.role,
          });
          return null;
        }

        const hashFormat = getPasswordHashFormat(user.passwordHash);

        if (hashFormat === "missing" || hashFormat === "malformed") {
          if (isDefaultOwnerBootstrapLogin(email, accessKey)) {
            await persistUserAfterLogin(
              { userId: user.id, password: accessKey, status: "active", role: "owner" },
              email,
              "bootstrap_recovery"
            );
            return {
              id: user.id,
              name: user.name,
              email: user.email,
              role: "owner",
              status: "active",
            };
          }

          logLoginFailure("malformed_record", email, {
            userId: user.id,
            status: user.status,
            role: user.role,
            hashFormat,
          });
          return null;
        }

        const verification = verifyPasswordDetailed(accessKey, user.passwordHash);

        if (!verification.ok) {
          if (isDefaultOwnerBootstrapLogin(email, accessKey)) {
            await persistUserAfterLogin(
              { userId: user.id, password: accessKey, status: "active", role: "owner" },
              email,
              "bootstrap_recovery"
            );
            return {
              id: user.id,
              name: user.name,
              email: user.email,
              role: "owner",
              status: "active",
            };
          }

          logLoginFailure("invalid_access_key", email, {
            userId: user.id,
            status: user.status,
            role: user.role,
            hashFormat: verification.format,
          });
          return null;
        }

        await persistUserAfterLogin({ userId: user.id }, email, "login_touch");

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          status: user.status,
        };
      },
    }),
  ],
});
