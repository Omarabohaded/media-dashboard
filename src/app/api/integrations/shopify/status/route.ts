import { NextRequest, NextResponse } from "next/server";
import {
  exchangeShopifyClientCredentials,
  fetchShopifyStoreTruthPreview,
  getShopifyConfig,
} from "@/lib/integrations/shopify";
import { getClientById, getShopifyConnection } from "@/lib/clientStore";

export async function GET(request: NextRequest) {
  const client = await getClientById(request.nextUrl.searchParams.get("clientId"));
  const connection = await getShopifyConnection(client.id);
  const config = getShopifyConfig();
  const storeDomain = connection?.storeDomain ?? "";
  let connectionError = connection?.lastError ?? null;
  let previewReady = false;
  let shopName = connection?.shopName ?? null;

  if (config.missingEnv.length === 0 && storeDomain) {
    try {
      const token = await exchangeShopifyClientCredentials(storeDomain);
      const preview = await fetchShopifyStoreTruthPreview(
        token.access_token!,
        storeDomain
      );
      previewReady = true;
      shopName = preview.snapshot.shopName;
      connectionError = null;
    } catch (error) {
      connectionError =
        error instanceof Error ? error.message : "Shopify connection failed.";
    }
  }

  return NextResponse.json({
    client,
    platform: "shopify",
    configured: config.missingEnv.length === 0,
    connected: Boolean(storeDomain),
    previewReady,
    storeDomain,
    apiVersion: config.apiVersion,
    requestedScopes: config.requestedScopes,
    missingEnv: config.missingEnv,
    usesMockData: true,
    shopName,
    connectionError,
    recommendedNextStep:
      config.missingEnv.length > 0
        ? "Add Shopify client credentials before connecting client stores."
        : !storeDomain
        ? "Save the Shopify store domain for this client first."
        : !previewReady
        ? "Validate the Shopify app install, scopes, and saved store domain for this client."
        : "Compare Shopify store truth against Meta before enabling scale recommendations.",
  });
}

export async function DELETE(request: NextRequest) {
  const client = await getClientById(request.nextUrl.searchParams.get("clientId"));
  const { clearShopifyConnection } = await import("@/lib/clientStore");
  await clearShopifyConnection(client.id);
  return NextResponse.json({ ok: true, clientId: client.id });
}
