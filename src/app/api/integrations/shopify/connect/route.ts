import { NextRequest, NextResponse } from "next/server";
import {
  buildShopifyOauthUrl,
  getSecureCookieFlag,
  getShopifyConfig,
  isValidShopifyStoreDomain,
  normalizeShopifyStoreDomain,
  SHOPIFY_OAUTH_CLIENT_COOKIE,
  SHOPIFY_STATE_COOKIE,
} from "@/lib/integrations/shopify";
import { getClientById } from "@/lib/clientStore";

export async function GET(request: NextRequest) {
  const config = getShopifyConfig();
  const origin = request.nextUrl.origin;
  const client = await getClientById(request.nextUrl.searchParams.get("clientId"));
  const storeDomain = normalizeShopifyStoreDomain(
    request.nextUrl.searchParams.get("storeDomain") ?? ""
  );

  if (config.missingEnv.length > 0) {
    return NextResponse.redirect(
      new URL(`/admin?clientId=${client.id}&shopify_error=missing_config`, origin)
    );
  }

  if (!isValidShopifyStoreDomain(storeDomain)) {
    return NextResponse.redirect(
      new URL(
        `/admin?clientId=${client.id}&shopify_error=${encodeURIComponent(
          "Enter a valid .myshopify.com store domain."
        )}`,
        origin
      )
    );
  }

  const state = crypto.randomUUID();
  const response = NextResponse.redirect(
    buildShopifyOauthUrl(origin, storeDomain, state)
  );

  response.cookies.set(SHOPIFY_STATE_COOKIE, state, {
    httpOnly: true,
    sameSite: "lax",
    secure: getSecureCookieFlag(),
    path: "/",
    maxAge: 60 * 15,
  });
  response.cookies.set(SHOPIFY_OAUTH_CLIENT_COOKIE, client.id, {
    httpOnly: true,
    sameSite: "lax",
    secure: getSecureCookieFlag(),
    path: "/",
    maxAge: 60 * 15,
  });

  return response;
}
