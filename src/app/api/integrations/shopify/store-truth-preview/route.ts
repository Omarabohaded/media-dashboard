import { NextRequest, NextResponse } from "next/server";
import {
  exchangeShopifyClientCredentials,
  fetchShopifyStoreTruthPreview,
  getShopifyConfig,
} from "@/lib/integrations/shopify";
import { getClientById, getShopifyConnection } from "@/lib/clientStore";

export async function GET(request: NextRequest) {
  try {
    const config = getShopifyConfig();
    const client = await getClientById(request.nextUrl.searchParams.get("clientId"));
    const connection = await getShopifyConnection(client.id);

    if (config.missingEnv.length > 0) {
      return NextResponse.json(
        {
          error:
            "Shopify is not configured yet. Add the shared Shopify app credentials first.",
          missingEnv: config.missingEnv,
        },
        { status: 400 }
      );
    }

    if (!connection?.storeDomain) {
      return NextResponse.json(
        {
          error: "Connect Shopify for this client before loading store truth preview.",
        },
        { status: 400 }
      );
    }

    const token = await exchangeShopifyClientCredentials(connection.storeDomain);
    const preview = await fetchShopifyStoreTruthPreview(
      token.access_token!,
      connection.storeDomain
    );

    return NextResponse.json({
      clientId: client.id,
      storeDomain: connection.storeDomain,
      ...preview,
      note:
        "This is store-truth preview data from Shopify GraphQL Admin API for the last 7 days. Sessions and funnel-stage metrics still need GA4 or a storefront analytics source.",
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Could not load Shopify store truth preview.",
      },
      { status: 500 }
    );
  }
}
