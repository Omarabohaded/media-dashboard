import { NextRequest, NextResponse } from "next/server";
import {
  exchangeShopifyClientCredentials,
  fetchShopifyStoreTruthPreview,
  getShopifyConfig,
  SHOPIFY_TOKEN_COOKIE,
} from "@/lib/integrations/shopify";

export async function GET(request: NextRequest) {
  const config = getShopifyConfig();
  let accessToken = request.cookies.get(SHOPIFY_TOKEN_COOKIE)?.value ?? null;
  let connectionError: string | null = null;
  let previewReady = false;
  let shopName: string | null = null;

  if (config.missingEnv.length === 0) {
    try {
      if (!accessToken) {
        const token = await exchangeShopifyClientCredentials();
        accessToken = token.access_token ?? null;
      }

      if (accessToken) {
        const preview = await fetchShopifyStoreTruthPreview(accessToken);
        previewReady = true;
        shopName = preview.snapshot.shopName;
      }
    } catch (error) {
      connectionError =
        error instanceof Error ? error.message : "Shopify connection failed.";
    }
  }

  return NextResponse.json({
    platform: "shopify",
    configured: config.missingEnv.length === 0,
    connected: Boolean(accessToken) && !connectionError,
    previewReady,
    storeDomain: config.storeDomain,
    apiVersion: config.apiVersion,
    requestedScopes: config.requestedScopes,
    missingEnv: config.missingEnv,
    usesMockData: true,
    shopName,
    connectionError,
    recommendedNextStep:
      config.missingEnv.length > 0
        ? "Add Shopify client credentials for the store-truth source."
        : !previewReady
        ? "Validate the Shopify app install, scopes, and token grant."
        : "Compare Shopify store truth against Meta before enabling scale recommendations.",
  });
}
