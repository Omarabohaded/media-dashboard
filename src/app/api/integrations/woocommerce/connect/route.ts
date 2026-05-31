import { NextRequest, NextResponse } from "next/server";
import {
  normalizeWooCommerceStoreUrl,
  validateWooCommerceConnection,
} from "@/lib/integrations/woocommerce";
import {
  getClientById,
  upsertWooCommerceConnection,
} from "@/lib/clientStore";
import { requireClientManagementAccess } from "@/lib/serverAccess";

export async function POST(request: NextRequest) {
  const access = await requireClientManagementAccess();
  if (access.response) return access.response;

  try {
    const body = (await request.json().catch(() => ({}))) as {
      clientId?: string;
      storeUrl?: string;
      consumerKey?: string;
      consumerSecret?: string;
    };

    const client = await getClientById(body.clientId);
    const storeUrl = normalizeWooCommerceStoreUrl(body.storeUrl ?? "");
    const consumerKey = body.consumerKey?.trim() ?? "";
    const consumerSecret = body.consumerSecret?.trim() ?? "";

    const validation = await validateWooCommerceConnection({
      storeUrl,
      consumerKey,
      consumerSecret,
    });

    const connection = await upsertWooCommerceConnection({
      clientId: client.id,
      storeUrl: validation.storeUrl,
      consumerKey,
      consumerSecret,
      connectedAt: new Date().toISOString(),
      storeName: validation.storeName,
      currencyCode: validation.currencyCode,
      lastError: null,
    });

    return NextResponse.json({
      ok: true,
      clientId: client.id,
      connection: {
        clientId: connection.clientId,
        storeUrl: connection.storeUrl,
        storeName: connection.storeName,
        currencyCode: connection.currencyCode,
        connectedAt: connection.connectedAt,
        lastError: connection.lastError,
      },
      validation,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Could not connect WooCommerce for this client.",
      },
      { status: 400 }
    );
  }
}
