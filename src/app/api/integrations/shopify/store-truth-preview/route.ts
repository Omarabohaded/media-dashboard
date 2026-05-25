import { NextRequest, NextResponse } from "next/server";
import {
  exchangeShopifyClientCredentials,
  fetchShopifyStoreTruthPreview,
  SHOPIFY_TOKEN_COOKIE,
} from "@/lib/integrations/shopify";

export async function GET(request: NextRequest) {
  try {
    let accessToken = request.cookies.get(SHOPIFY_TOKEN_COOKIE)?.value;

    if (!accessToken) {
      const token = await exchangeShopifyClientCredentials();
      accessToken = token.access_token;
    }

    const preview = await fetchShopifyStoreTruthPreview(accessToken!);

    return NextResponse.json({
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
