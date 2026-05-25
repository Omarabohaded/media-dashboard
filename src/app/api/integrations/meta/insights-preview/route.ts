import { NextRequest, NextResponse } from "next/server";
import {
  fetchMetaInsightsPreview,
} from "@/lib/integrations/meta";
import { getClientById, getMetaConnection } from "@/lib/clientStore";

export async function GET(request: NextRequest) {
  try {
    const client = await getClientById(request.nextUrl.searchParams.get("clientId"));
    const connection = await getMetaConnection(client.id);
    const accessToken = connection?.accessToken;
    const accountId = connection?.selectedAccountId;

    if (!accessToken) {
      return NextResponse.json(
        { error: "Connect Meta before loading preview data." },
        { status: 401 }
      );
    }

    if (!accountId) {
      return NextResponse.json(
        { error: "Select an ad account before loading preview data." },
        { status: 400 }
      );
    }

    const rows = await fetchMetaInsightsPreview(accessToken, accountId);
    const totals = rows.reduce(
      (acc, row) => {
        acc.spend += row.spend;
        acc.purchases += row.purchases;
        acc.purchaseValue += row.purchaseValue;
        acc.impressions += row.impressions;
        acc.clicks += row.clicks;
        return acc;
      },
      {
        spend: 0,
        purchases: 0,
        purchaseValue: 0,
        impressions: 0,
        clicks: 0,
      }
    );

    return NextResponse.json({
      clientId: client.id,
      accountId,
      rows,
      totals,
      note:
        "This is a live Meta preview only. Do not enable scale recommendations until it is compared against store truth.",
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Could not load Meta preview data.",
      },
      { status: 500 }
    );
  }
}
