import { NextResponse } from "next/server";
import {
  getWordPressConfig,
  validateWordPressStoreConnection,
  WORDPRESS_CONNECTED_COOKIE,
} from "@/lib/integrations/wordpress";
import { requireAdminAccess } from "@/lib/serverAccess";

export async function POST() {
  const access = await requireAdminAccess();
  if (access.response) return access.response;
  const config = getWordPressConfig();

  if (config.missingEnv.length > 0) {
    return NextResponse.json(
      { error: "Missing WordPress/WooCommerce configuration." },
      { status: 400 }
    );
  }

  try {
    const validated = await validateWordPressStoreConnection();
    const response = NextResponse.json({
      ok: true,
      storeName: validated.storeName,
      currencyCode: validated.currencyCode,
    });

    response.cookies.set(WORDPRESS_CONNECTED_COOKIE, "1", {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 12,
    });

    return response;
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Could not connect WordPress/WooCommerce.",
      },
      { status: 500 }
    );
  }
}
