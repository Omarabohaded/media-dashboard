import { NextRequest, NextResponse } from "next/server";
import { getClientById, getWooCommerceConnection } from "@/lib/clientStore";
import { fetchWooCommerceStoreTruthPreview } from "@/lib/integrations/woocommerce";
import { requireAuthenticatedUser } from "@/lib/serverAccess";

export async function GET(request: NextRequest) {
  const access = await requireAuthenticatedUser();
  if (access.response) return access.response;

  try {
    const client = await getClientById(request.nextUrl.searchParams.get("clientId"));
    const connection = await getWooCommerceConnection(client.id);

    if (!connection) {
      return NextResponse.json(
        { error: "WooCommerce is not connected for this client." },
        { status: 400 }
      );
    }

    const preview = await fetchWooCommerceStoreTruthPreview({
      storeUrl: connection.storeUrl,
      consumerKey: connection.consumerKey,
      consumerSecret: connection.consumerSecret,
    });

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
