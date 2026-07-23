import { NextRequest, NextResponse } from "next/server";
import { getClientById, getWooCommerceConnection } from "@/lib/clientStore";
import {
  fetchWooCommerceStoreTruthPreview,
  type WooCommerceDatePreset,
} from "@/lib/integrations/woocommerce";
import { requireClientAccess } from "@/lib/serverAccess";

const supportedDatePresets = new Set<WooCommerceDatePreset>([
  "today",
  "yesterday",
  "last_7d",
  "last_30d",
  "this_month",
  "last_month",
  "custom",
]);

function getDatePreset(request: NextRequest): WooCommerceDatePreset {
  const rawPreset = request.nextUrl.searchParams.get("datePreset") as WooCommerceDatePreset | null;

  if (rawPreset && supportedDatePresets.has(rawPreset)) {
    return rawPreset;
  }

  return "last_7d";
}

export async function GET(request: NextRequest) {
  const access = await requireClientAccess(request.nextUrl.searchParams.get("clientId"));
  if (access.response) return access.response;

  try {
    const client = await getClientById(access.clientId);
    const connection = await getWooCommerceConnection(client.id);

    if (!connection) {
      return NextResponse.json(
        { error: "WooCommerce is not connected for this client." },
        { status: 400 }
      );
    }

    const preview = await fetchWooCommerceStoreTruthPreview(
      {
        storeUrl: connection.storeUrl,
        consumerKey: connection.consumerKey,
        consumerSecret: connection.consumerSecret,
      },
      {
        datePreset: getDatePreset(request),
      }
    );

    return NextResponse.json({
      client,
      ...preview,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Could not load WooCommerce store truth preview.",
      },
      { status: 400 }
    );
  }
}
