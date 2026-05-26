import { NextRequest, NextResponse } from "next/server";
import {
  exchangeShopifyAuthorizationCode,
  fetchShopifyStoreTruthPreview,
  getShopifyConfig,
  normalizeShopifyStoreDomain,
  SHOPIFY_OAUTH_CLIENT_COOKIE,
  SHOPIFY_STATE_COOKIE,
  verifyShopifyHmac,
} from "@/lib/integrations/shopify";
import {
  clearShopifyConnection,
  getClientById,
  getShopifyConnection,
  upsertShopifyConnection,
} from "@/lib/clientStore";

export async function GET(request: NextRequest) {
  const origin = request.nextUrl.origin;
  const config = getShopifyConfig();
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get("code");
  const shop = normalizeShopifyStoreDomain(searchParams.get("shop") ?? "");
  const state = searchParams.get("state");
  const expectedState = request.cookies.get(SHOPIFY_STATE_COOKIE)?.value;
  const oauthClientId = request.cookies.get(SHOPIFY_OAUTH_CLIENT_COOKIE)?.value;
  const client = await getClientById(oauthClientId);
  const existingConnection = await getShopifyConnection(client.id);

  if (!code || !shop || !state || !expectedState || state !== expectedState) {
    return NextResponse.redirect(
      new URL(
        `/admin?clientId=${client.id}&shopify_error=${encodeURIComponent(
          "Shopify OAuth state validation failed."
        )}`,
        origin
      )
    );
  }

  if (!verifyShopifyHmac(searchParams)) {
    return NextResponse.redirect(
      new URL(
        `/admin?clientId=${client.id}&shopify_error=${encodeURIComponent(
          "Shopify callback signature validation failed."
        )}`,
        origin
      )
    );
  }

  if (config.missingEnv.length > 0) {
    return NextResponse.redirect(
      new URL(`/admin?clientId=${client.id}&shopify_error=missing_config`, origin)
    );
  }

  try {
    const token = await exchangeShopifyAuthorizationCode(shop, code);
    const preview = await fetchShopifyStoreTruthPreview(token.access_token!, shop);
    const response = NextResponse.redirect(
      new URL(`/admin?clientId=${client.id}&shopify_connected=1`, origin)
    );

    response.cookies.delete(SHOPIFY_STATE_COOKIE);
    response.cookies.delete(SHOPIFY_OAUTH_CLIENT_COOKIE);

    await upsertShopifyConnection({
      clientId: client.id,
      storeDomain: shop,
      accessToken: token.access_token!,
      connectedAt: new Date().toISOString(),
      shopName: preview.snapshot.shopName,
      lastError: null,
    });

    return response;
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Shopify OAuth exchange failed.";

    if (existingConnection?.accessToken) {
      await upsertShopifyConnection({
        ...existingConnection,
        lastError: message,
      });
    } else {
      await clearShopifyConnection(client.id);
    }

    return NextResponse.redirect(
      new URL(
        `/admin?clientId=${client.id}&shopify_error=${encodeURIComponent(message)}`,
        origin
      )
    );
  }
}
