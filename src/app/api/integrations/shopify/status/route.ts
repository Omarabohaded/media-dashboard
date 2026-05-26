import { NextRequest, NextResponse } from "next/server";
import {
  fetchShopifyStoreTruthPreview,
  getShopifyConfig,
} from "@/lib/integrations/shopify";
import { getClientById, getShopifyConnection } from "@/lib/clientStore";

export async function GET(request: NextRequest) {
  const client = await getClientById(request.nextUrl.searchParams.get("clientId"));
  const connection = await getShopifyConnection(client.id);
  const config = getShopifyConfig();
  const storeDomain = connection?.storeDomain ?? "";
  const accessToken = connection?.accessToken ?? "";
  const clientDeclinedAccess = Boolean(client.storeAccessDeclined);
  let connectionError = connection?.lastError ?? null;
  let previewReady = false;
  let shopName = connection?.shopName ?? null;

  if (config.missingEnv.length === 0 && storeDomain && accessToken) {
    try {
      const preview = await fetchShopifyStoreTruthPreview(accessToken, storeDomain);
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
    connected:
      Boolean(storeDomain && accessToken) && !connectionError && !clientDeclinedAccess,
    previewReady: previewReady && !clientDeclinedAccess,
    storeDomain,
    apiVersion: config.apiVersion,
    requestedScopes: config.requestedScopes,
    missingEnv: config.missingEnv,
    usesMockData: false,
    shopName,
    connectionError: clientDeclinedAccess && !storeDomain ? null : connectionError,
    recommendedNextStep:
      config.missingEnv.length > 0
        ? "Add Shopify app credentials before connecting client stores."
        : clientDeclinedAccess && !storeDomain
        ? "This client has not granted website access. Keep Shopify optional unless they choose to share it later."
        : !storeDomain || !accessToken
        ? "Start the Shopify install flow for this client store."
        : connectionError
        ? "Reconnect Shopify so the store owner can approve the latest app access."
        : "Compare Shopify store truth against Meta before enabling scale recommendations.",
  });
}

export async function DELETE(request: NextRequest) {
  const client = await getClientById(request.nextUrl.searchParams.get("clientId"));
  const { clearShopifyConnection } = await import("@/lib/clientStore");
  await clearShopifyConnection(client.id);
  return NextResponse.json({ ok: true, clientId: client.id });
}
