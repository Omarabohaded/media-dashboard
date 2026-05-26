import { NextRequest, NextResponse } from "next/server";
import {
  exchangeShopifyClientCredentials,
  fetchShopifyStoreTruthPreview,
  getShopifyConfig,
  normalizeShopifyStoreDomain,
} from "@/lib/integrations/shopify";
import {
  clearShopifyConnection,
  getClientById,
  getShopifyConnection,
  upsertShopifyConnection,
} from "@/lib/clientStore";

export async function POST(request: NextRequest) {
  const config = getShopifyConfig();
  const body = (await request.json().catch(() => ({}))) as {
    clientId?: string;
    storeDomain?: string;
  };
  const client = await getClientById(body.clientId);
  const existingConnection = await getShopifyConnection(client.id);
  const storeDomain = normalizeShopifyStoreDomain(body.storeDomain ?? "");

  if (config.missingEnv.length > 0) {
    return NextResponse.json(
      { error: "Missing Shopify configuration." },
      { status: 400 }
    );
  }

  if (!storeDomain) {
    return NextResponse.json(
      { error: "Shopify store domain is required." },
      { status: 400 }
    );
  }

  try {
    const token = await exchangeShopifyClientCredentials(storeDomain);
    const preview = await fetchShopifyStoreTruthPreview(
      token.access_token!,
      storeDomain
    );

    await upsertShopifyConnection({
      clientId: client.id,
      storeDomain,
      connectedAt: new Date().toISOString(),
      shopName: preview.snapshot.shopName,
      lastError: null,
    });

    return NextResponse.json({
      ok: true,
      clientId: client.id,
      storeDomain,
      shopName: preview.snapshot.shopName,
      expiresIn: token.expires_in ?? 0,
      scope: token.scope ?? "",
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Could not connect Shopify.";

    if (!existingConnection?.shopName) {
      await clearShopifyConnection(client.id);
    }

    return NextResponse.json(
      {
        error: message,
      },
      { status: 500 }
    );
  }
}
