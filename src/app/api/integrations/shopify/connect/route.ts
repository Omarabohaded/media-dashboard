import { NextResponse } from "next/server";
import {
  exchangeShopifyClientCredentials,
  getShopifyConfig,
  SHOPIFY_TOKEN_COOKIE,
} from "@/lib/integrations/shopify";

export async function POST() {
  const config = getShopifyConfig();

  if (config.missingEnv.length > 0) {
    return NextResponse.json(
      { error: "Missing Shopify configuration." },
      { status: 400 }
    );
  }

  try {
    const token = await exchangeShopifyClientCredentials();
    const response = NextResponse.json({
      ok: true,
      expiresIn: token.expires_in ?? 0,
      scope: token.scope ?? "",
    });

    response.cookies.set(SHOPIFY_TOKEN_COOKIE, token.access_token!, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: Math.max(60 * 30, token.expires_in ?? 60 * 60),
    });

    return response;
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Could not connect Shopify.",
      },
      { status: 500 }
    );
  }
}
