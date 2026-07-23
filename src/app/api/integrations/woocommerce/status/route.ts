import { NextRequest, NextResponse } from "next/server";
import {
  clearWooCommerceConnection,
  getClientById,
  getWooCommerceConnection,
} from "@/lib/clientStore";
import { requireClientAccess, requireClientIntegrationAccess } from "@/lib/serverAccess";

export async function GET(request: NextRequest) {
  const access = await requireClientAccess(request.nextUrl.searchParams.get("clientId"));
  if (access.response) return access.response;

  const client = await getClientById(access.clientId);
  const connection = await getWooCommerceConnection(client.id);

  return NextResponse.json({
    client,
    configured: Boolean(connection),
    connected: Boolean(connection && !connection.lastError),
    previewReady: Boolean(connection && !connection.lastError),
    storeUrl: connection?.storeUrl ?? "",
    storeName: connection?.storeName ?? null,
    currencyCode: connection?.currencyCode ?? null,
    connectedAt: connection?.connectedAt ?? null,
    connectionError: connection?.lastError ?? null,
    recommendedNextStep: connection
      ? connection.lastError
        ? "Review the saved WooCommerce credentials and reconnect."
        : "WooCommerce is connected for this client. Load a store truth preview to verify revenue and order data."
      : "Add this client's WooCommerce store URL and REST API keys.",
  });
}

export async function DELETE(request: NextRequest) {
  const access = await requireClientIntegrationAccess(request.nextUrl.searchParams.get("clientId"));
  if (access.response) return access.response;

  const client = await getClientById(access.clientId);
  await clearWooCommerceConnection(client.id);

  return NextResponse.json({ ok: true, clientId: client.id });
}
